'use strict';

/**
 * Concurrent load driver for the AI Assistant dashboard plugin. Run it against a real dashboard
 * (set EVAL_BASE_URL) to measure the plugin's memory and CPU footprint under many simultaneous
 * in-flight chat streams. Pair it with any host-side resource sampler and with
 * `eval/mock_provider.js`'s `[[mock:stream:CHARS:MS]]` marker, which holds a mocked SSE stream
 * open for a controllable duration instead of resolving instantly.
 *
 * Unlike every other eval/*.js script, this one does NOT reuse `sse_client.js`'s `chat()` for the
 * load-generating requests themselves: `chat()` is built on global `fetch` (Node's bundled undici),
 * whose connection-pool size isn't configurable without the `undici` npm package installed (this
 * repo has zero deps outside Node built-ins, and `require('undici')` is not resolvable on plain
 * Node). To hit 50 concurrent TLS
 * connections reliably, this file instead talks to the chat route directly over the built-in
 * `https` module with an explicit `https.Agent({ maxSockets })`, mirroring sse_client.js's own SSE
 * frame-parsing pattern (`data: {json}\n\n`, buffered across chunk boundaries) so the two stay wire
 * -compatible. `login()` (low concurrency: one call per user, not per question) IS reused as-is
 * from sse_client.js.
 *
 * TLS: the dashboard's self-signed cert is handled two ways here -- the custom `https.Agent` below
 * sets `rejectUnauthorized: false` for the load-generating requests, but `sse_client.js`'s login()
 * still goes through global `fetch`, which per its own file header never disables verification
 * itself -- so `NODE_TLS_REJECT_UNAUTHORIZED=0` must still be set in the shell for login() to work
 * against a self-signed cert, exactly as eval/README.md's "Common setup" section documents.
 *
 * Env vars (each also accepts an argv `KEY=value` token, e.g. `node run_load.js TOTAL=20`, so this
 * runs unchanged from PowerShell where inline `VAR=val cmd` shell syntax doesn't exist):
 *   EVAL_BASE_URL     default "https://localhost:8444"
 *   EVAL_PROVIDER_ID  required -- saved-object id of the mock provider (see start_mock_provider.sh)
 *   EVAL_USERS        required -- "user1:pass,user2:pass,..."; each user logs in ONCE, its cookie
 *                     jar is reused for every question routed to it
 *   CONCURRENCY       default 5 -- number of parallel in-flight questions (worker pool size)
 *   TOTAL             default 10 -- total questions sent across the whole run
 *   QUESTION_MODE     "stream" | "tool" | "mixed" (default "stream")
 *   EVAL_STREAM_CHARS default 2000 -- stream-mode marker's CHARS
 *   EVAL_STREAM_MS    default 20000 -- stream-mode marker's MS (total streaming duration)
 *   EVAL_TIMEOUT_MS   default 60000 -- per-request client-side timeout
 *   EVAL_LOADOUT_DIR  default eval/loadout -- where the per-run .jsonl file is written
 *
 * Output: one JSON-lines file under EVAL_LOADOUT_DIR (one line per request, in request-index
 * order) plus a printed summary (p50/p95 TTFT and duration, error count, achieved concurrency --
 * the max number of requests observed simultaneously in-flight, computed from each record's own
 * start/end epoch timestamps, independent of the configured CONCURRENCY).
 *
 * Exit code: number of failed/errored requests (0 = all clean).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');
const { login, cookieHeader, API_ROOT } = require('./sse_client');

function getParam(name, def) {
  const prefix = `${name}=`;
  const fromArgv = process.argv.slice(2).find(a => a.startsWith(prefix));
  if (fromArgv !== undefined) return fromArgv.slice(prefix.length);
  if (process.env[name] !== undefined && process.env[name] !== '')
    return process.env[name];
  return def;
}

const BASE_URL = getParam('EVAL_BASE_URL', 'https://localhost:8444').replace(
  /\/$/,
  '',
);
const PROVIDER_ID = getParam('EVAL_PROVIDER_ID', undefined);
const USERS_RAW = getParam('EVAL_USERS', undefined);
const CONCURRENCY = Number(getParam('CONCURRENCY', '5'));
const TOTAL = Number(getParam('TOTAL', '10'));
const QUESTION_MODE = getParam('QUESTION_MODE', 'stream').toLowerCase();
const STREAM_CHARS = Number(getParam('EVAL_STREAM_CHARS', '2000'));
const STREAM_MS = Number(getParam('EVAL_STREAM_MS', '20000'));
const TIMEOUT_MS = Number(getParam('EVAL_TIMEOUT_MS', '60000'));
const RAMP_MS = Number(getParam('RAMP_MS', '25'));
// >0: destroy each request's socket this many ms in (simulates the user closing the tab
// mid-stream). The record gets error='aborted-by-test'; server-side cleanup is then verified
// out-of-band (established-443 count and RSS in sample_metrics.sh output).
const ABORT_AFTER_MS = Number(getParam('EVAL_ABORT_AFTER_MS', '0'));
const OUT_DIR = getParam('EVAL_LOADOUT_DIR', path.join(__dirname, 'loadout'));

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

if (!PROVIDER_ID)
  fail('EVAL_PROVIDER_ID is required (saved-object id of the mock provider).');
if (!USERS_RAW)
  fail('EVAL_USERS is required, e.g. "user1:pass,user2:pass,user3:pass".');
if (!['stream', 'tool', 'mixed', '429'].includes(QUESTION_MODE)) {
  fail(`QUESTION_MODE must be stream|tool|mixed|429, got "${QUESTION_MODE}"`);
}

/** Parses "user1:pass,user2:pass" into [{username,password}, ...]. */
function parseUsers(raw) {
  return raw.split(',').map(pair => {
    const trimmedPair = pair.trim();
    const sep = trimmedPair.indexOf(':');
    if (sep === -1) {
      fail(`bad EVAL_USERS entry (expected "user:pass"): "${trimmedPair}"`);
    }
    return {
      username: trimmedPair.slice(0, sep),
      password: trimmedPair.slice(sep + 1),
    };
  });
}

/**
 * 3-4 real catalog tools cycled through in "tool"/"mixed" mode so the REAL Indexer gets queried
 * through the real executor/guardrails/digest path (not just the mocked "thinking" step). Args and
 * router categories mirror eval/run_plumbing.js's TOOL_ARGS/TOOL_CATEGORY for these same tools --
 * see eval/README.md's "Two-stage router" section for why the `[[route:...]]` marker is prepended
 * (harmless no-op when server/tools/router.ts's ROUTER_ENABLED is false: chat.ts then never sends a
 * stage-1 request at all, so mock_provider.js's stage-1 branch simply never triggers).
 */
const TOOL_CYCLE = [
  { tool: 'get_active_agents', category: 'agents', args: {} },
  { tool: 'get_critical_alerts', category: 'alerts', args: {} },
  { tool: 'get_top_rules', category: 'alerts', args: {} },
  {
    tool: 'search_alerts_by_agent',
    category: 'alerts',
    args: { agent_name: 'wazuh-aio' },
  },
];

function buildStreamPrompt(index) {
  return `Load test question #${index}: please answer plainly. [[mock:stream:${STREAM_CHARS}:${STREAM_MS}]]`;
}

function buildToolPrompt(index) {
  const entry = TOOL_CYCLE[index % TOOL_CYCLE.length];
  return `[[route:${entry.category}]] Load test question #${index}: run ${
    entry.tool
  }. [[mock:${entry.tool}:${JSON.stringify(entry.args)}]]`;
}

function buildPrompt(mode, index) {
  if (mode === 'stream') return buildStreamPrompt(index);
  if (mode === 'tool') return buildToolPrompt(index);
  // '429': every request's FIRST provider call gets rate-limited (mock replies 429 once per
  // unique body, retry.ts then retries after ~1s) — measures the retry pile-up shape under
  // concurrent rate limiting. The q${index} prefix keeps each body unique so each request
  // triggers its own first-time 429.
  if (mode === '429') return `load q${index}: rate limit me [[mock:429-once]]`;
  return index % 2 === 0 ? buildStreamPrompt(index) : buildToolPrompt(index);
}

/**
 * Parses one already-decoded SSE chunk of text into complete `data: {json}\n\n` frames, same
 * buffering approach as sse_client.js's iterateSseEvents (frames can split across TCP chunk
 * boundaries). Calls `onEvent(parsedJson)` for every complete frame found; returns the leftover
 * (possibly partial) buffer tail for the next call.
 */
function consumeSseBuffer(buffer, onEvent) {
  let working = buffer;
  let separatorIndex = working.indexOf('\n\n');
  while (separatorIndex !== -1) {
    const rawFrame = working.slice(0, separatorIndex);
    working = working.slice(separatorIndex + 2);
    for (const line of rawFrame.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice('data:'.length).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        onEvent(JSON.parse(payload));
      } catch {
        // malformed/partial frame -- skip, same tolerance as sse_client.js
      }
    }
    separatorIndex = working.indexOf('\n\n');
  }
  return working;
}

/**
 * POSTs one chat turn over a raw https.request (not fetch) so `agent` (an https.Agent with an
 * explicit maxSockets) actually governs this connection, and records fine-grained timing/byte
 * metrics as the SSE frames arrive: TTFT (first parsed StreamEvent of any type), first-delta time
 * (first `type:'delta'` event -- meaningful for stream-mode prompts), total duration, raw SSE byte
 * count, and event count. Never rejects -- every failure mode (non-2xx, socket error, client-side
 * timeout) resolves into the same result shape with `error` set, so the caller's worker loop never
 * needs a try/catch around this call.
 */
function chatWithTiming(
  baseUrl,
  cookieJar,
  providerId,
  prompt,
  agent,
  timeoutMs,
) {
  return new Promise(resolve => {
    const url = new URL(`${baseUrl}${API_ROOT}/chat`);
    const bodyStr = JSON.stringify({
      providerId,
      messages: [{ role: 'user', content: prompt }],
    });
    const startedEpochMs = Date.now();

    let ttftMs = null;
    let firstDeltaMs = null;
    let bytesReceived = 0;
    let eventsCount = 0;
    let sawDone = false;
    let errorMessage = null;
    let buffer = '';
    let settled = false;

    function markEvent(evt) {
      const now = Date.now();
      if (ttftMs === null) ttftMs = now - startedEpochMs;
      eventsCount += 1;
      if (evt && evt.type === 'delta' && firstDeltaMs === null)
        firstDeltaMs = now - startedEpochMs;
      if (evt && evt.type === 'done') sawDone = true;
      if (evt && evt.type === 'error' && !errorMessage)
        errorMessage = evt.message;
    }

    function finish(httpStatus) {
      if (settled) return;
      settled = true;
      resolve({
        httpStatus,
        ttftMs,
        firstDeltaMs,
        durationMs: Date.now() - startedEpochMs,
        bytesReceived,
        eventsCount,
        sawDone,
        error: errorMessage,
        startedEpochMs,
      });
    }

    const req = https.request(
      {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        agent,
        headers: {
          'Content-Type': 'application/json',
          'osd-xsrf': 'true',
          Cookie: cookieHeader(cookieJar),
          'Content-Length': Buffer.byteLength(bodyStr),
        },
      },
      res => {
        const httpStatus = res.statusCode;
        res.setEncoding('utf8');
        if (httpStatus < 200 || httpStatus >= 300) {
          let errBody = '';
          res.on('data', chunk => {
            errBody += chunk;
          });
          res.on('end', () => {
            errorMessage = `HTTP ${httpStatus}: ${errBody.slice(0, 300)}`;
            finish(httpStatus);
          });
          return;
        }
        res.on('data', chunk => {
          bytesReceived += Buffer.byteLength(chunk, 'utf8');
          buffer = consumeSseBuffer(buffer + chunk, markEvent);
        });
        res.on('end', () => {
          // Trailing frame with no final blank-line terminator (connection closed right after it).
          const trailing = buffer.trim();
          if (trailing.startsWith('data:')) {
            const payload = trailing.slice('data:'.length).trim();
            if (payload && payload !== '[DONE]') {
              try {
                markEvent(JSON.parse(payload));
              } catch {
                // ignore
              }
            }
          }
          if (!sawDone && !errorMessage) {
            errorMessage = 'stream ended without a done/error event';
          }
          finish(httpStatus);
        });
        res.on('error', err => {
          errorMessage = `response stream error: ${err.message}`;
          finish(httpStatus);
        });
      },
    );

    req.on('error', err => {
      errorMessage = `request failed: code=${err.code || '?'} ${
        err.message || '(no message)'
      }`;
      finish(null);
    });
    req.on('timeout', () => {
      errorMessage = `client-side timeout after ${timeoutMs}ms`;
      // `destroy()` with no error argument emits no 'error' event, so the request's promise has to
      // be settled here. Without this the worker holding it never returns and the run hangs.
      req.destroy();
      finish(null);
    });
    req.setTimeout(timeoutMs);
    if (ABORT_AFTER_MS > 0) {
      setTimeout(() => {
        if (!settled) {
          errorMessage = 'aborted-by-test';
          req.destroy();
          finish(null);
        }
      }, ABORT_AFTER_MS);
    }
    req.write(bodyStr);
    req.end();
  });
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return null;
  const idx = Math.min(
    sortedArr.length - 1,
    Math.floor((p / 100) * sortedArr.length),
  );
  return sortedArr[idx];
}

/** Max number of records simultaneously in-flight, via a sweep line over each record's own
 * [startEpochMs, endEpochMs] interval -- independent of the configured CONCURRENCY, so this is a
 * genuine measurement of achieved overlap, not an echo of the input. */
function computeAchievedConcurrency(records) {
  const boundaries = [];
  for (const r of records) {
    if (r.startEpochMs == null || r.endEpochMs == null) continue;
    boundaries.push([r.startEpochMs, 1]);
    boundaries.push([r.endEpochMs, -1]);
  }
  boundaries.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let current = 0;
  let max = 0;
  for (const [, delta] of boundaries) {
    current += delta;
    if (current > max) max = current;
  }
  return max;
}

function printSummary(records, overallWallClockMs, outFile) {
  const ok = records.filter(r => !r.error && r.sawDone);
  const errored = records.filter(r => r.error || !r.sawDone);
  const ttfts = ok
    .map(r => r.ttftMs)
    .filter(v => v != null)
    .sort((a, b) => a - b);
  const durations = ok
    .map(r => r.durationMs)
    .filter(v => v != null)
    .sort((a, b) => a - b);

  console.log('\n=== run_load summary ===');
  console.log(
    `mode=${QUESTION_MODE} total=${records.length} ok=${ok.length} errors=${errored.length} wallClockMs=${overallWallClockMs}`,
  );
  console.log(
    `TTFT      p50=${percentile(ttfts, 50)}ms  p95=${percentile(ttfts, 95)}ms`,
  );
  console.log(
    `duration  p50=${percentile(durations, 50)}ms  p95=${percentile(
      durations,
      95,
    )}ms`,
  );
  console.log(
    `achieved concurrency (max overlapping in-flight requests) = ${computeAchievedConcurrency(
      records,
    )}`,
  );
  console.log(`output file: ${outFile}`);
  if (errored.length) {
    console.log('--- errors (first 10) ---');
    for (const r of errored.slice(0, 10)) {
      console.log(
        `  [${r.index}] user=${r.user} httpStatus=${r.httpStatus} error=${r.error}`,
      );
    }
  }
}

async function main() {
  const users = parseUsers(USERS_RAW);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Logging in ${users.length} user(s) to ${BASE_URL}...`);
  const sessions = [];
  for (const user of users) {
    const jar = await login(BASE_URL, user.username, user.password);
    sessions.push({ username: user.username, jar });
    console.log(`  logged in: ${user.username}`);
  }
  console.log(
    `Starting load: mode=${QUESTION_MODE} concurrency=${CONCURRENCY} total=${TOTAL} providerId=${PROVIDER_ID}\n`,
  );

  const agent = new https.Agent({
    keepAlive: true,
    maxSockets: Math.max(CONCURRENCY * 2, 20),
    rejectUnauthorized: false,
  });

  const results = new Array(TOTAL);
  let nextIndex = 0;
  function takeIndex() {
    return nextIndex < TOTAL ? nextIndex++ : -1;
  }

  async function worker(workerId) {
    // Stagger each worker's first connect. Without this, all CONCURRENCY TLS handshakes hit the
    // VirtualBox NAT port-forward in the same millisecond and its accept backlog RSTs a few
    // (observed: ECONNREFUSED on ~5/50 same-instant connects; never once staggered). Real browser
    // tabs never SYN simultaneously, so the stagger removes a lab artifact, not a real signal —
    // streams still fully overlap for any stream duration >> CONCURRENCY * RAMP_MS.
    await new Promise(r => setTimeout(r, workerId * RAMP_MS));
    for (;;) {
      const i = takeIndex();
      if (i === -1) return;
      const session = sessions[i % sessions.length];
      const prompt = buildPrompt(QUESTION_MODE, i);
      const startedAtIso = new Date().toISOString();
      const timing = await chatWithTiming(
        BASE_URL,
        session.jar,
        PROVIDER_ID,
        prompt,
        agent,
        TIMEOUT_MS,
      );
      const record = {
        index: i,
        user: session.username,
        mode: QUESTION_MODE,
        startedAtIso,
        startEpochMs: timing.startedEpochMs,
        endEpochMs: timing.startedEpochMs + (timing.durationMs || 0),
        ttftMs: timing.ttftMs,
        firstDeltaMs: timing.firstDeltaMs,
        durationMs: timing.durationMs,
        sseBytes: timing.bytesReceived,
        eventsCount: timing.eventsCount,
        httpStatus: timing.httpStatus,
        sawDone: timing.sawDone,
        error: timing.error,
      };
      results[i] = record;
      console.log(
        `[${i + 1}/${TOTAL}] worker${workerId} user=${
          session.username
        } status=${timing.httpStatus} ` +
          `ttft=${timing.ttftMs}ms dur=${timing.durationMs}ms events=${timing.eventsCount} ` +
          `bytes=${timing.bytesReceived} err=${timing.error || '-'}`,
      );
    }
  }

  const workerCount = Math.max(1, Math.min(CONCURRENCY, TOTAL));
  const overallStart = Date.now();
  await Promise.all(Array.from({ length: workerCount }, (_, k) => worker(k)));
  const overallWallClockMs = Date.now() - overallStart;

  const finalRecords = results.filter(Boolean);
  const outFile = path.join(
    OUT_DIR,
    `run_${QUESTION_MODE}_${Date.now()}.jsonl`,
  );
  fs.writeFileSync(
    outFile,
    finalRecords.map(r => JSON.stringify(r)).join('\n') + '\n',
  );

  printSummary(finalRecords, overallWallClockMs, outFile);

  const errorCount = finalRecords.filter(r => r.error || !r.sawDone).length;
  process.exit(errorCount);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
