'use strict';

/**
 * Multi-turn eval runner for `measurement-set.json`'s `turn_based_cases`
 * (`markdown_table_suppression`, `digest_freshness_repeat` -- see `_meta.turn_based_cases`).
 *
 * WHY THIS FILE EXISTS: `sse_client.js`'s `chat()` (see its own doc comment, ~line 192) "only ever
 * sends a single fresh `user` turn per call (no multi-turn conversation replay)" -- that is exactly
 * right for `run_live.js`/`run_plumbing.js`'s single-prompt cases, but the measurement set's 2
 * `turn_based_cases` need a SECOND request whose `messages` array replays turn 1's history the same
 * way the real browser client does, so the model sees the same tool_call/digest context a live user
 * session would. This file adds that, without touching `sse_client.js`, `run_live.js`,
 * `measurement-set.json`, or any server/ code.
 *
 * THE CRUX -- reproducing `public/components/chat/chat-page.tsx`'s history reconstruction:
 *   - `buildOutgoingMessages` (chat-page.tsx ~L378-419) walks the eligible prior assistant turns
 *     (newest `TOOL_HISTORY_MAX_TURNS` turns, `TOOL_HISTORY_CHAR_BUDGET` chars of digest content
 *     total, walked newest-first, stopping the whole walk at the first turn that would exceed
 *     budget -- see chat-page.tsx L363-368) and, for each INCLUDED turn, injects
 *     `[{role:'assistant', content:'', toolCalls:[toolCall]}, {role:'tool', toolCallId, content:
 *     digestContent}]` for every tool exchange that got a `digest` event, placed immediately BEFORE
 *     that turn's own prose `assistant` message (chat-page.tsx L404-417). `toolCall` is REAL-form
 *     arguments (the `tool_call` SSE event's `toolCall`, chat-page.tsx L216-222's `ToolExchange` doc
 *     comment); `digestContent` is the correlated `digest` SSE event's `content`, matched by
 *     `toolCallId` (chat-page.tsx L829-833).
 *   - `buildOutgoingMessagesForTurn` below is a direct port of that function (same constants, same
 *     walk order, same message shape) operating on this script's own turn bookkeeping instead of
 *     React state.
 *
 * PRIVACY: matches `run_live.js`'s default -- no `privacy` key in the request body at all (privacy
 * OFF). This harness deliberately does NOT implement pseudonym-map replay
 * (`privacy.map`/`privacy_map` SSE event handling, chat-page.tsx's `pseudonymMap` state /
 * `privacyPayload` in `handleSend`) -- that is a real gap versus a privacy-mode live session, and is
 * fine for these two cases specifically since neither's rubric concerns privacy behavior. Flagged
 * here loudly: if a future turn-based case needs privacy mode, this file needs the pseudonym-map
 * bookkeeping added.
 *
 * SSE CONSUMPTION: `sse_client.js` exports only `login`/`chat`/cookie helpers -- `chat()` hardcodes
 * a single-`user`-message body and hides `iterateSseEvents` (not exported), so it cannot send an
 * arbitrary `messages` array. Rather than modifying the shared client, `postChatTurn` below
 * reimplements the same
 * frame-buffering/parsing pattern as `sse_client.js`'s `iterateSseEvents` (chat.ts's
 * `data: ${json}\n\n` frames, a trailing-partial-line buffer, tolerate-and-skip malformed frames)
 * inline, and additionally accumulates the raw SSE text for the transcript dump. This duplication
 * is intentional rather than editing `sse_client.js`.
 *
 * Env vars (mirrors `run_live.js`'s table in eval/README.md):
 *   EVAL_BASE_URL    default "https://localhost:8443"
 *   EVAL_USER        default "admin"
 *   EVAL_PASS        required
 *   EVAL_PROVIDER_ID required
 *   EVAL_FILTER      comma-separated case ids (optional; default = every turn-based case)
 *   EVAL_SLEEP_S     seconds to sleep between calls, including between turns of the SAME case
 *                    (default 30 -- free-tier quota pacing, same default as run_live.js)
 *   EVAL_OUT_DIR     directory to write per-turn SSE transcripts to (default: os.tmpdir())
 *
 * Output: a PASS/FAIL line per case with reasons indented underneath (same style as run_live.js),
 * a final `PASS: n  FAIL: m  TOTAL: t` summary line, and exit code = number of FAILs.
 *
 * Cases considered: every `measurement-set.json` case with a `turns` array (data-driven off the
 * case shape itself, not a hardcoded id list -- so this keeps working if more turn-based cases are
 * added later without editing this file).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { login, cookieHeader, API_ROOT } = require('./sse_client');
const { BASE_URL, USER, PASS, fail } = require('./cli-env');

const PROVIDER_ID = process.env.EVAL_PROVIDER_ID;
const FILTER = process.env.EVAL_FILTER
  ? new Set(
      process.env.EVAL_FILTER.split(',')
        .map(id => id.trim())
        .filter(Boolean),
    )
  : undefined;
const SLEEP_S =
  process.env.EVAL_SLEEP_S !== undefined
    ? Number(process.env.EVAL_SLEEP_S)
    : 30;
const OUT_DIR = process.env.EVAL_OUT_DIR || os.tmpdir();

const DEFAULT_TIMEOUT_MS = 240000; // matches sse_client.js's DEFAULT_TIMEOUT_MS

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (!PROVIDER_ID)
  fail(
    'EVAL_PROVIDER_ID is required (a saved-object id from GET /api/wazuh_ai_assistant/providers).',
  );

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}

/**
 * POSTs one turn's full `messages` array to server/routes/chat.ts and returns
 * `{events, raw, httpStatus}`: `events` is every parsed StreamEvent in order (stopping at the
 * terminal `done`/`error`, same as sse_client.js's `chat()`); `raw` is the verbatim SSE response
 * text (for the transcript dump); `httpStatus` is the HTTP status code (or null on a
 * network-level/timeout failure that never got a response).
 *
 * Reimplements sse_client.js's `iterateSseEvents` frame-buffering inline (see file header for why:
 * `chat()` doesn't accept an arbitrary `messages` array, and `iterateSseEvents` isn't exported).
 */
async function postChatTurn(
  baseUrl,
  cookieJar,
  providerId,
  messages,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let raw = '';
  try {
    const response = await fetch(`${baseUrl}${API_ROOT}/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true',
        Cookie: cookieHeader(cookieJar),
      },
      // No `privacy` key -- byte-identical to run_live.js's default (privacy OFF). See file header.
      body: JSON.stringify({ providerId, messages }),
    });

    if (!response.ok || !response.body) {
      const text = await safeText(response);
      raw = text;
      return {
        events: [
          {
            type: 'error',
            message: `HTTP ${response.status} from chat endpoint: ${text}`,
          },
        ],
        raw,
        httpStatus: response.status,
      };
    }

    const events = [];
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let terminal = false;
    while (!terminal) {
      if (controller.signal.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value, { stream: true });
      raw += chunkText;
      buffer += chunkText;
      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const rawFrame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        for (const line of rawFrame.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice('data:'.length).trim();
          if (!payload) continue;
          try {
            const parsed = JSON.parse(payload);
            events.push(parsed);
            if (parsed && (parsed.type === 'done' || parsed.type === 'error')) {
              terminal = true;
            }
          } catch {
            // Malformed/partial frame: skip it rather than crashing the whole eval run.
          }
        }
        separatorIndex = buffer.indexOf('\n\n');
      }
      if (terminal) break;
    }
    // Trailing frame with no final blank-line terminator (connection closed right after it).
    if (!terminal) {
      const trailing = buffer.trim();
      if (trailing.startsWith('data:')) {
        const payload = trailing.slice('data:'.length).trim();
        if (payload) {
          try {
            events.push(JSON.parse(payload));
          } catch {
            // ignore
          }
        }
      }
    }
    reader.releaseLock();
    return { events, raw, httpStatus: response.status };
  } catch (error) {
    if (controller.signal.aborted) {
      return {
        events: [
          {
            type: 'error',
            message: `Client-side timeout after ${timeoutMs}ms`,
          },
        ],
        raw,
        httpStatus: null,
      };
    }
    return {
      events: [
        {
          type: 'error',
          message: `Request failed: ${
            error && error.message ? error.message : String(error)
          }`,
        },
      ],
      raw,
      httpStatus: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** History budget -- direct port of chat-page.tsx's constants (L336-338). */
const TOOL_HISTORY_MAX_TURNS = 2;
const TOOL_HISTORY_CHAR_BUDGET = 8000;

/**
 * Direct port of chat-page.tsx's `buildOutgoingMessages` (L378-419), operating on this script's own
 * `uiMessages`/`turnRecords` bookkeeping instead of React state. See file header for the semantics;
 * kept here budget-and-all (rather than special-cased for exactly 2 turns) so this stays faithful if
 * `measurement-set.json` grows a 3+-turn case later.
 *
 * `uiMessages`: flat array of `{id, role, content}` in conversation order (one entry per user turn,
 * one per assistant turn -- mirrors the `UiChatMessage[]` chat-page.tsx passes in).
 * `turnRecords`: one entry per assistant turn so far, `{assistantMessageId, toolExchanges:
 * [{toolCall, digestContent}]}`.
 */
function buildOutgoingMessagesForTurn(uiMessages, turnRecords) {
  const eligibleTurns = turnRecords.slice(-TOOL_HISTORY_MAX_TURNS);

  const turnsToInclude = new Set();
  let runningChars = 0;
  for (const turn of [...eligibleTurns].reverse()) {
    const turnChars = turn.toolExchanges.reduce(
      (sum, exchange) =>
        sum + (exchange.digestContent ? exchange.digestContent.length : 0),
      0,
    );
    if (turnChars === 0) {
      continue;
    }
    if (runningChars + turnChars > TOOL_HISTORY_CHAR_BUDGET) {
      break;
    }
    runningChars += turnChars;
    turnsToInclude.add(turn.assistantMessageId);
  }

  const outgoing = [];
  for (const uiMessage of uiMessages) {
    if (uiMessage.role === 'assistant' && turnsToInclude.has(uiMessage.id)) {
      const turn = turnRecords.find(
        candidate => candidate.assistantMessageId === uiMessage.id,
      );
      for (const exchange of turn ? turn.toolExchanges : []) {
        if (!exchange.digestContent) {
          continue;
        }
        outgoing.push({
          role: 'assistant',
          content: '',
          toolCalls: [exchange.toolCall],
        });
        outgoing.push({
          role: 'tool',
          toolCallId: exchange.toolCall.id,
          content: exchange.digestContent,
        });
      }
    }
    outgoing.push({ role: uiMessage.role, content: uiMessage.content });
  }
  return outgoing;
}

function expectedToolList(expectedTools) {
  return Array.isArray(expectedTools) ? expectedTools : [expectedTools];
}

/** Writes one turn's raw SSE transcript to OUT_DIR/multiturn_<caseId>_turn<n>.sse. */
function writeTranscript(caseId, turnIndex, raw) {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  const filePath = path.join(
    OUT_DIR,
    `multiturn_${caseId}_turn${turnIndex + 1}.sse`,
  );
  fs.writeFileSync(filePath, raw, 'utf-8');
  return filePath;
}

/**
 * Runs every turn of one turn-based case in a single conversation, replaying tool-call/digest
 * history between turns exactly as chat-page.tsx's `buildOutgoingMessages` would, and evaluates the
 * case's assertions. Returns `{pass, reasons[]}`.
 */
async function runCase(testCase, cookies) {
  const reasons = [];
  const uiMessages = [];
  const turnRecords = [];
  /** Per-turn collected info for the assertion pass below. */
  const turnSummaries = [];

  for (let turnIndex = 0; turnIndex < testCase.turns.length; turnIndex += 1) {
    const prompt = testCase.turns[turnIndex];
    const outgoing = buildOutgoingMessagesForTurn(uiMessages, turnRecords);
    outgoing.push({ role: 'user', content: prompt });

    const { events, raw, httpStatus } = await postChatTurn(
      BASE_URL,
      cookies,
      PROVIDER_ID,
      outgoing,
    );
    const transcriptPath = writeTranscript(
      testCase.id,
      turnIndex,
      raw || JSON.stringify(events, null, 2),
    );

    const toolCallEvents = events.filter(
      event => event && event.type === 'tool_call',
    );
    const tableEvents = events.filter(event => event && event.type === 'table');
    const digestEvents = events.filter(
      event => event && event.type === 'digest',
    );
    const errorEvents = events.filter(event => event && event.type === 'error');
    const prose = events
      .filter(event => event && event.type === 'delta')
      .map(event => event.content || '')
      .join('');
    const lastEvent = events[events.length - 1];

    turnSummaries.push({
      turnIndex,
      prompt,
      toolCallEvents,
      tableEvents,
      errorEvents,
      prose,
      transcriptPath,
    });

    // HTTP failure or a stream `error` event = FAIL, surfaced immediately; conversation is broken so
    // there is no point sending a turn 2 that would replay history from a turn that never completed.
    if (httpStatus !== null && httpStatus !== 200) {
      reasons.push(
        `turn ${
          turnIndex + 1
        }: HTTP ${httpStatus} (transcript: ${transcriptPath})`,
      );
      return { pass: false, reasons };
    }
    if (errorEvents.length > 0 || !lastEvent || lastEvent.type !== 'done') {
      const message =
        errorEvents.length > 0
          ? errorEvents[0].message
          : `stream did not end with 'done' (last event: ${
              lastEvent ? lastEvent.type : '(no events)'
            })`;
      reasons.push(
        `turn ${turnIndex + 1}: ${message} (transcript: ${transcriptPath})`,
      );
      return { pass: false, reasons };
    }

    // --- bookkeeping for the NEXT turn's history reconstruction (mirrors chat-page.tsx L829-833
    // digest handling: correlate each tool_call's digest by toolCallId; a tool_call with no
    // correlated digest is kept in toolExchanges with digestContent left undefined, and
    // buildOutgoingMessagesForTurn already skips those when reconstructing history). ---
    const toolExchanges = toolCallEvents.map(toolCallEvent => {
      const digestEvent = digestEvents.find(
        digest => digest.toolCallId === toolCallEvent.toolCall.id,
      );
      return {
        toolCall: toolCallEvent.toolCall,
        digestContent: digestEvent ? digestEvent.content : undefined,
      };
    });
    const assistantMessageId = `assistant_turn_${turnIndex}`;
    uiMessages.push({
      id: `user_turn_${turnIndex}`,
      role: 'user',
      content: prompt,
    });
    uiMessages.push({
      id: assistantMessageId,
      role: 'assistant',
      content: prose,
    });
    turnRecords.push({ assistantMessageId, toolExchanges });

    if (turnIndex < testCase.turns.length - 1 && SLEEP_S > 0) {
      await sleep(SLEEP_S * 1000);
    }
  }

  // --- expected_tools assertion ---
  // requires_tool_call_each_turn (digest_freshness_repeat): assert a match on EVERY turn -- the
  // whole point of the case is confirming turn 2 fires its OWN tool_call instead of answering from
  // stale history. Otherwise (markdown_table_suppression): per that case's own rubric ("turn 1 is
  // just setup -- it should produce a real results table via get_findings_by_time"), only the FIRST
  // turn is asserted to have called it; turn 2 is legitimately allowed to reformat from history
  // without re-querying, so only its answer_must_not_match below applies. This is driven off the
  // `requires_tool_call_each_turn` case field, not a hardcoded case id, so it generalizes to future
  // turn-based cases without editing this file.
  const expectedTools = expectedToolList(testCase.expected_tools || []);
  const turnsToCheckForTools = testCase.requires_tool_call_each_turn
    ? turnSummaries.map(summary => summary.turnIndex)
    : [0];
  for (const turnIndex of turnsToCheckForTools) {
    const summary = turnSummaries[turnIndex];
    const matched = summary.toolCallEvents.filter(event =>
      expectedTools.includes(event.toolCall.name),
    );
    if (matched.length === 0) {
      reasons.push(
        `turn ${turnIndex + 1}: expected one of [${expectedTools.join(
          ', ',
        )}] to be called; saw: ` +
          `${
            summary.toolCallEvents.length
              ? summary.toolCallEvents.map(e => e.toolCall.name).join(', ')
              : '(none)'
          }`,
      );
    }
  }

  // --- answer regex assertions, applied to the FINAL turn's prose only (per measurement-set.json's
  // _meta.matching_semantics and each case's own rubric) ---
  const finalSummary = turnSummaries[turnSummaries.length - 1];
  for (const pattern of testCase.answer_must_match || []) {
    if (!new RegExp(pattern, 'i').test(finalSummary.prose)) {
      reasons.push(
        `final turn: answer_must_match /${pattern}/i did not match answer text`,
      );
    }
  }
  for (const pattern of testCase.answer_must_not_match || []) {
    if (new RegExp(pattern, 'i').test(finalSummary.prose)) {
      reasons.push(
        `final turn: answer_must_not_match /${pattern}/i matched answer text (should not have)`,
      );
    }
  }

  return { pass: reasons.length === 0, reasons };
}

async function main() {
  const measurementSet = require(path.join(__dirname, 'measurement-set.json'));
  let cases = measurementSet.cases.filter(testCase =>
    Array.isArray(testCase.turns),
  );
  if (FILTER) {
    cases = cases.filter(testCase => FILTER.has(testCase.id));
    const missing = [...FILTER].filter(
      id => !cases.some(testCase => testCase.id === id),
    );
    if (missing.length) {
      console.warn(
        `WARNING: EVAL_FILTER named unknown/non-turn-based case id(s): ${missing.join(
          ', ',
        )}`,
      );
    }
  }
  if (cases.length === 0)
    fail(
      'No turn-based cases selected (check EVAL_FILTER, or measurement-set.json has no `turns` cases).',
    );

  console.log(`Logging in to ${BASE_URL} as ${USER}...`);
  const cookies = await login(BASE_URL, USER, PASS);
  console.log('Login OK.\n');
  console.log(`Writing per-turn SSE transcripts to ${OUT_DIR}\n`);

  let passCount = 0;
  let failCount = 0;

  for (let i = 0; i < cases.length; i += 1) {
    const testCase = cases[i];
    let result;
    try {
      result = await runCase(testCase, cookies);
    } catch (error) {
      result = {
        pass: false,
        reasons: [
          `harness crashed: ${
            error && error.message ? error.message : String(error)
          }`,
        ],
      };
    }

    const label = result.pass ? 'PASS' : 'FAIL';
    if (result.pass) passCount += 1;
    else failCount += 1;

    console.log(`[${i + 1}/${cases.length}] ${label}  ${testCase.id}`);
    if (!result.pass) {
      for (const reason of result.reasons) {
        console.log(`    - ${reason}`);
      }
    }

    if (i < cases.length - 1 && SLEEP_S > 0) {
      await sleep(SLEEP_S * 1000);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`PASS: ${passCount} FAIL: ${failCount} TOTAL: ${cases.length}`);

  process.exit(failCount);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
