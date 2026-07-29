'use strict';

/**
 * Zero-token scripted OpenAI-compatible provider for plumbing regression (eval/run_plumbing.js).
 * Implements just enough of the OpenAI chat-completions wire format for
 * server/providers/openai_compatible.ts to drive a full orchestration round-trip through the
 * real server/routes/chat.ts route without spending any real LLM tokens.
 *
 * Endpoint: POST /v1/chat/completions, `stream: true` always assumed -- the adapter always sends
 * stream:true (openai_compatible.ts:39) so this mock doesn't bother branching on it.
 *
 * Behavior (see eval/README.md "Plumbing mode" for how the marker syntax is used):
 *   - Two-stage router (server/tools/router.ts) stage-1 requests: if the incoming request's
 *     `tools` array contains a function named "route_question" (the sole tool
 *     server/routes/chat.ts's runStage1Routing sends, chat.ts's stage-1 preamble), stream back a
 *     tool call to route_question whose `categories` come from a `[[route:cat1,cat2]]` marker
 *     found ANYWHERE in the last user message (comma-separated, no spaces); if no such marker is
 *     present, default to `["free_search"]`. Checked FIRST, before every other branch below, since
 *     it's a distinct wire shape (tools:[route_question] only) that always short-circuits here
 *     regardless of what other markers the prompt also carries (the 429/mock markers are matched
 *     anchored to the end of the message, so a `[[route:...]]` marker meant for this branch should
 *     be placed earlier in the prompt text, not at the end -- see run_plumbing.js).
 *   - If the conversation already contains a role:"tool" message (i.e. this is the follow-up
 *     round after chat.ts appended the tool result, chat.ts:183-187), stream back
 *     "MOCK ANSWER: " + the first 100 chars of that tool message's content, then [DONE].
 *   - Else if the last user message ends with `[[mock:stream:CHARS:MS]]`, stream a synthetic
 *     plain-text answer totalling CHARS characters as small content deltas spread out over MS
 *     milliseconds wall-clock time (not sent all at once), then a normal finish_reason:"stop" +
 *     [DONE]. Added for eval/run_load.js's concurrent-stream load testing -- it needs SSE
 *     connections that stay open for a controllable duration under load, unlike every other branch
 *     here which resolves as fast as Node can flush. Checked BEFORE the generic TOOLNAME marker
 *     below since "stream" would otherwise itself parse as a tool name with non-JSON args.
 *   - Else if the last user message ends with `[[mock:stall:MS]]`, respond HTTP 200 with SSE
 *     headers, stream exactly ONE content delta chunk, then go silent (no more chunks, no [DONE])
 *     for MS milliseconds before closing the connection. Added to live-test the provider stall
 *     watchdog (server/providers/sse-utils.ts's `iterateSseLines` per-read timeout +
 *     server/providers/retry.ts's `fetchWithHeaderTimeout`): a real stall is "connects, sends
 *     something, then never sends anything else again," which is exactly what this simulates. Set
 *     MS comfortably larger than whatever `WZ_AI_PROVIDER_IDLE_TIMEOUT_MS` override the dashboard
 *     process is running with, so the watchdog's own timeout fires (and the client disconnects)
 *     well before this marker's own silence timer would otherwise close the connection first.
 *     Checked BEFORE the generic TOOLNAME marker below for the same reason as "stream" above --
 *     "stall" would otherwise itself parse as a tool name with a bare numeric "argument".
 *   - Else if the last user message ends with `[[mock:TOOLNAME:{json args}]]`, stream a tool
 *     call for TOOLNAME with those args, split across 2 delta chunks to exercise
 *     openai_compatible.ts's accumulateToolCallDeltas (openai_compatible.ts:187-211), finishing
 *     with finish_reason:"tool_calls" (triggers finalizeToolCalls + the tool_call StreamEvent,
 *     openai_compatible.ts:110-117).
 *   - Else if the last user message ends with `[[mock:429-once]]`: the FIRST time this exact
 *     request body is seen, respond HTTP 429 with a body containing "try again in 1s" and a
 *     `retry-after: 1` header -- server/providers/retry.ts:15,21-35,80-104 retries on 429,
 *     honoring Retry-After / the "try again in Xs" text, and yields a `status` StreamEvent whose
 *     message contains "retrying" (retry.ts:94-100) before retrying the identical request. The
 *     second time the same body is seen, it succeeds normally (falls through to the plain-text
 *     branch below, since no tool marker follows).
 *   - Else: stream "MOCK ANSWER: no tool" then [DONE].
 *
 * All of the above works identically whether the real router is enabled or disabled
 * (server/tools/router.ts's ROUTER_ENABLED): when disabled, chat.ts never sends a
 * `tools:[route_question]` request at all, so the stage-1 branch here simply never triggers and
 * every case falls through to the pre-existing behavior unchanged.
 *
 * Debug endpoints (privacy pipeline eval, eval/run_plumbing.js's privacy checks + eval/README.md):
 *   - GET /debug/requests: returns a JSON array of every raw (parsed) request body this process
 *     has received on POST .../chat/completions since startup, oldest first, capped at the last
 *     `DEBUG_LOG_CAP` (a ring buffer -- pushing past the cap drops the oldest entry). Lets the eval
 *     harness assert what the "model" actually saw on the wire (e.g. that no request body leaked a
 *     real, un-pseudonymized value) without needing its own separate request-sniffing layer.
 *   - DELETE /debug/requests: clears the ring buffer and returns `{cleared: true, previousCount}`.
 *     Intended to be called right before a privacy assertion so earlier (unrelated) calls in the
 *     same run don't produce false positives/negatives.
 *   These two routes are checked before the POST/chat-completions branch below, so they work
 *   regardless of what that branch's own method/path matching would otherwise do with them.
 */

const http = require('http');

const PORT = Number(process.env.MOCK_PORT || 9876);

/** Ring buffer of every raw (parsed) request body POSTed to /chat/completions, oldest first. */
const debugLog = [];
const DEBUG_LOG_CAP = 50;

/** Bodies (exact JSON text) that have already been given their one 429. Keyed per exact request
 * so retries of the SAME attempt (server/providers/retry.ts re-invokes the same fetch closure
 * with the same body) succeed the second time, while a different case/round is independently
 * "first-seen". */
const seen429 = new Set();

const TOOL_MARKER_RE = /\[\[mock:([A-Za-z0-9_]+):([\s\S]+?)\]\]\s*$/;
const RATE_LIMIT_MARKER_RE = /\[\[mock:429-once\]\]\s*$/;
// Checked before TOOL_MARKER_RE (see the file-header comment's "stream" bullet) since that regex's
// generic `[A-Za-z0-9_]+` name group would otherwise also match the literal word "stream" here,
// with "CHARS:MS" then failing JSON.parse as "malformed marker args".
const STREAM_MARKER_RE = /\[\[mock:stream:(\d+):(\d+)\]\]\s*$/;
// Checked before TOOL_MARKER_RE for the same reason as STREAM_MARKER_RE above (see the file-header
// comment's "stall" bullet) -- otherwise TOOL_MARKER_RE's generic `[A-Za-z0-9_]+` name group would
// match name="stall" with a bare number as its "JSON args", which happens to parse fine as a JSON
// number, so it would silently be misrouted into streamToolCall's tool-call path instead.
const STALL_MARKER_RE = /\[\[mock:stall:(\d+)\]\]\s*$/;
// Not anchored to the end (unlike the two above): run_plumbing.js prepends this marker so the
// existing end-anchored markers above still work in the SAME prompt for stage-2 rounds.
const ROUTE_MARKER_RE = /\[\[route:([A-Za-z_]+(?:,[A-Za-z_]+)*)\]\]/;

function lastMessageWithRole(messages, role) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i] && messages[i].role === role) {
      return messages[i];
    }
  }
  return undefined;
}

function sseChunk(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

/**
 * Streams one tool call, arguments split into 2 chunks across the `index`-keyed delta shape
 * openai_compatible.ts's accumulateToolCallDeltas expects (openai_compatible.ts:188-211):
 * frame 1 carries `id`+`function.name`+first half of `function.arguments`, frame 2 carries the
 * rest of `function.arguments` only, frame 3 closes with finish_reason:"tool_calls".
 */
function streamToolCall(res, toolName, args) {
  const argsJson = JSON.stringify(args);
  const mid = Math.ceil(argsJson.length / 2);
  const firstHalf = argsJson.slice(0, mid);
  const secondHalf = argsJson.slice(mid);

  sseChunk(res, {
    choices: [
      {
        delta: {
          tool_calls: [
            {
              index: 0,
              id: 'mock-1',
              function: { name: toolName, arguments: firstHalf },
            },
          ],
        },
        finish_reason: null,
      },
    ],
  });
  sseChunk(res, {
    choices: [
      {
        delta: {
          tool_calls: [{ index: 0, function: { arguments: secondHalf } }],
        },
        finish_reason: null,
      },
    ],
  });
  sseChunk(res, { choices: [{ delta: {}, finish_reason: 'tool_calls' }] });
  res.write('data: [DONE]\n\n');
  res.end();
}

/** Streams a plain text answer as several small delta chunks, then [DONE]. */
function streamTextAnswer(res, fullText) {
  const chunkSize = 24;
  for (let i = 0; i < fullText.length; i += chunkSize) {
    sseChunk(res, {
      choices: [
        {
          delta: { content: fullText.slice(i, i + chunkSize) },
          finish_reason: null,
        },
      ],
    });
  }
  sseChunk(res, { choices: [{ delta: {}, finish_reason: 'stop' }] });
  res.write('data: [DONE]\n\n');
  res.end();
}

/** Deterministic, human-eyeballable filler text truncated/repeated to exactly `chars` length. */
const FILLER_SENTENCE = 'The quick brown fox jumps over the lazy dog. ';
function buildFillerText(chars) {
  if (chars <= 0) {
    return '';
  }
  const repeats = Math.ceil(chars / FILLER_SENTENCE.length);
  return FILLER_SENTENCE.repeat(repeats).slice(0, chars);
}

/**
 * Streams `totalChars` characters of synthetic plain text as small content deltas spread evenly
 * over `totalMs` milliseconds (real wall-clock time, via setTimeout), instead of flushing them all
 * immediately like `streamTextAnswer` -- this is the whole point of the `[[mock:stream:...]]`
 * marker (see file header): it lets eval/run_load.js hold many concurrent SSE connections open at
 * once to measure the dashboard's footprint under sustained concurrency, rather than every mock
 * response completing near-instantly regardless of load.
 *
 * Stops early (without erroring) if the client disconnects mid-stream (`res` 'close'), so an
 * aborted load-test request doesn't leave a dangling timer.
 */
function streamTimedTextAnswer(res, totalChars, totalMs) {
  const text = buildFillerText(totalChars);
  const chunkSize = 20; // small deltas, matching streamTextAnswer's granularity
  const totalChunks = Math.max(1, Math.ceil(text.length / chunkSize) || 1);
  const intervalMs = Math.max(1, Math.floor(totalMs / totalChunks));

  let chunkIndex = 0;
  let stopped = false;
  let timer = null;

  res.on('close', () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
    }
  });

  function finish() {
    if (stopped) {
      return;
    }
    sseChunk(res, { choices: [{ delta: {}, finish_reason: 'stop' }] });
    res.write('data: [DONE]\n\n');
    res.end();
  }

  function sendNext() {
    if (stopped) {
      return;
    }
    if (chunkIndex >= totalChunks || text.length === 0) {
      finish();
      return;
    }
    const start = chunkIndex * chunkSize;
    const piece = text.slice(start, start + chunkSize);
    sseChunk(res, {
      choices: [{ delta: { content: piece }, finish_reason: null }],
    });
    chunkIndex += 1;
    if (chunkIndex >= totalChunks) {
      finish();
      return;
    }
    timer = setTimeout(sendNext, intervalMs);
  }

  sendNext();
}

/**
 * Streams exactly ONE content delta chunk, then goes silent for `stallMs` before closing the
 * connection without a [DONE] frame -- see the file-header comment's "stall" bullet for why
 * (live-testing server/providers/sse-utils.ts's stall watchdog). Mirrors
 * `streamTimedTextAnswer`'s "stop on client disconnect" cleanup so an aborted request (the
 * dashboard's own watchdog cancelling the reader once ITS shorter timeout fires, well before this
 * function's own `stallMs` elapses in the intended usage) doesn't leave a dangling timer here.
 */
function streamThenStall(res, stallMs) {
  let stopped = false;
  let timer = null;
  res.on('close', () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
    }
  });

  sseChunk(res, {
    choices: [{ delta: { content: 'stalling...' }, finish_reason: null }],
  });

  timer = setTimeout(() => {
    if (stopped) {
      return;
    }
    res.end();
  }, stallMs);
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/debug/requests') {
    sendJson(res, 200, debugLog);
    return;
  }
  if (req.method === 'DELETE' && req.url === '/debug/requests') {
    const previousCount = debugLog.length;
    debugLog.length = 0;
    sendJson(res, 200, { cleared: true, previousCount });
    return;
  }

  if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) {
    sendJson(res, 404, {
      error: {
        message: `mock_provider: no route for ${req.method} ${req.url}`,
      },
    });
    return;
  }

  let raw = '';
  req.on('data', chunk => {
    raw += chunk;
  });
  req.on('end', () => {
    let body;
    try {
      body = JSON.parse(raw);
    } catch (error) {
      sendJson(res, 400, {
        error: {
          message: `mock_provider: invalid JSON body (${error.message})`,
        },
      });
      return;
    }

    // Recorded for GET /debug/requests BEFORE any branching below, regardless of which reply this
    // request ends up getting -- the eval harness needs to see every body a real provider would
    // have received, including 429-then-retry pairs and stage-1 route_question calls.
    debugLog.push(body);
    if (debugLog.length > DEBUG_LOG_CAP) {
      debugLog.shift();
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUser = lastMessageWithRole(messages, 'user');
    const lastTool = lastMessageWithRole(messages, 'tool');

    // Two-stage router stage-1 request: server/routes/chat.ts's runStage1Routing sends exactly
    // one tool, route_question. Detected purely from the wire shape (not a text marker), since
    // it's chat.ts itself (not the test prompt) that decides when stage 1 runs.
    const isRouteQuestionRequest =
      Array.isArray(body.tools) &&
      body.tools.some(
        tool =>
          tool && tool.function && tool.function.name === 'route_question',
      );
    if (isRouteQuestionRequest) {
      const routeMatch = lastUser
        ? ROUTE_MARKER_RE.exec(lastUser.content || '')
        : null;
      const categories = routeMatch
        ? routeMatch[1].split(',')
        : ['free_search'];
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      });
      streamToolCall(res, 'route_question', { categories });
      return;
    }

    // 429-once: gate on the exact request body so each independent case/round gets its own
    // "first time" -- retries of the SAME round resend an identical body (retry.ts re-invokes the
    // same doFetch closure), so the second attempt for that exact body succeeds.
    if (lastUser && RATE_LIMIT_MARKER_RE.test(lastUser.content || '')) {
      if (!seen429.has(raw)) {
        seen429.add(raw);
        res.writeHead(429, {
          'Content-Type': 'text/plain',
          'retry-after': '1',
        });
        res.end('rate limited, try again in 1s');
        return;
      }
      // Second time around: fall through to the normal (no-tool-marker) plain-text reply below.
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });

    // Checked before `lastTool`/TOOL_MARKER_RE for the same reason as STREAM_MARKER_RE just below
    // (a stall-marker prompt never triggers a tool call either).
    const stallMatch = lastUser
      ? STALL_MARKER_RE.exec(lastUser.content || '')
      : null;
    if (stallMatch) {
      const stallMs = Number(stallMatch[1]);
      streamThenStall(res, stallMs);
      return;
    }

    // Checked before `lastTool`/TOOL_MARKER_RE (see file header): a stream-marker prompt never
    // triggers a tool call in the first place, but checking it first keeps this branch's precedence
    // simple and independent of whichever other markers might also be present in the message.
    const streamMatch = lastUser
      ? STREAM_MARKER_RE.exec(lastUser.content || '')
      : null;
    if (streamMatch) {
      const totalChars = Number(streamMatch[1]);
      const totalMs = Number(streamMatch[2]);
      streamTimedTextAnswer(res, totalChars, totalMs);
      return;
    }

    if (lastTool) {
      const toolContent =
        typeof lastTool.content === 'string'
          ? lastTool.content
          : JSON.stringify(lastTool.content);
      streamTextAnswer(res, `MOCK ANSWER: ${toolContent.slice(0, 100)}`);
      return;
    }

    const marker = lastUser
      ? TOOL_MARKER_RE.exec(lastUser.content || '')
      : null;
    if (marker) {
      const toolName = marker[1];
      let args;
      try {
        args = JSON.parse(marker[2]);
      } catch (error) {
        streamTextAnswer(
          res,
          `MOCK ANSWER: malformed marker args JSON (${error.message})`,
        );
        return;
      }
      streamToolCall(res, toolName, args);
      return;
    }

    streamTextAnswer(res, 'MOCK ANSWER: no tool');
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(
      `mock_provider listening on http://0.0.0.0:${PORT}/v1/chat/completions`,
    );
    console.log(
      'Register it as a provider (type "openai_compatible") before running run_plumbing.js -- see eval/README.md.',
    );
  });
}

module.exports = { server, PORT };
