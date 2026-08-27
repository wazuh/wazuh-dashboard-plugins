import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  augmentToolError,
  CAPABILITY_DENIAL_NOTE,
  MAX_CONSECUTIVE_REJECTED_ROUNDS,
  orchestrate,
} from './chat';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import { SUGGEST_DISCOVER_QUERY_TOOL } from '../tools/suggest-discover-query';
import { listToolDefinitions } from '../tools/registry';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * Issue #8920 items 4/9 -- the CAPABILITY-DENIAL GUARD's deterministic half (chat.ts's
 * `augmentToolError`/`CAPABILITY_DENIAL_NOTE`) and the suggest_discover_query handoff-validation
 * interception (chat.ts's `SUGGEST_DISCOVER_QUERY_TOOL.name` branch, backed by
 * suggest-discover-query.ts's `SuggestedDslResolution`).
 *
 * Drives `orchestrate` directly with a scripted fake adapter, same pattern as
 * chat-stage1-usage.test.ts's `runStage1Routing` harness — one array of `StreamEvent`s per
 * expected `chatStream` call (stage 1's forced `route_question`, then one call per tool round),
 * and captures the OUTBOUND `messages` argument of each call so the test can inspect exactly what
 * the model would have read on its NEXT round -- this is the only way to observe a `role:'tool'`
 * message's content, since neither a real-tool error nor a suggest_discover_query tool error
 * produces its own `StreamEvent`.
 *
 * NOTE (needs the OSD tree to actually run): like chat-stream-limiter.test.ts and
 * chat-stage1-usage.test.ts, this file imports `./chat`, which imports `@osd/config-schema` --
 * unresolvable outside the full wazuh-dashboard checkout this repo is normally built against.
 * Follows the same colocated-unit-test convention; needs the platform runner (or CI) to execute.
 */

function scriptedAdapter(scripts: StreamEvent[][]): {
  adapter: ProviderAdapter;
  callMessages: ChatMessage[][];
} {
  let callIndex = 0;
  const callMessages: ChatMessage[][] = [];
  return {
    callMessages,
    adapter: {
      async *chatStream(
        _config: ProviderConfig,
        messages: ChatMessage[],
        _signal: AbortSignal,
        _options?: ChatStreamOptions,
      ): AsyncIterable<StreamEvent> {
        callMessages.push(messages);
        const script = scripts[callIndex];
        callIndex += 1;
        if (!script) {
          throw new Error(
            `scriptedAdapter: chatStream called more times (${callIndex}) than scripts provided ` +
              `(${scripts.length}) -- add another script entry for this test.`,
          );
        }
        for (const event of script) {
          yield event;
        }
      },
    },
  };
}

const PROVIDER_CONFIG: ProviderConfig = {
  id: 'p-1',
  name: 'test provider',
  type: 'openai_compatible',
  baseUrl: 'http://127.0.0.1:19999/v1',
  model: 'gpt-oss-120b',
};

const INITIAL_MESSAGES: ChatMessage[] = [
  { role: 'user', content: 'what ports are open on agent 001?' },
];

const NOOP_LOGGER = {
  debug: () => {},
  error: () => {},
} as unknown as Logger;

const NOOP_REQUEST = {} as unknown as OpenSearchDashboardsRequest;

/** Stage-1's forced route_question call+done -- identical across every test here, since which
 * category is routed does not matter: `search_wazuh_data` and `suggest_discover_query` are both
 * ALWAYS available regardless of routed category (router.ts's `resolveStage2Tools` doc comment /
 * chat.ts's unconditional `SUGGEST_DISCOVER_QUERY_TOOL` append). */
const STAGE1_SCRIPT: StreamEvent[] = [
  {
    type: 'tool_call',
    toolCall: {
      id: 'route_1',
      name: ROUTE_QUESTION_TOOL.name,
      arguments: { categories: ['free_search'] },
    },
  },
  { type: 'done', usage: { inputTokens: 50, outputTokens: 5 } },
];

/** A plain-text final answer with no further tool call, so a round ends the turn. */
function textOnlyScript(text: string): StreamEvent[] {
  return [
    { type: 'delta', content: text },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
  ];
}

/** Distinctive sentinel thrown by the default `search` stub below (issue: the registry-wide note
 * sweep proved only that SOME error reached the model, not that it was the VALIDATION error --
 * executor.ts's generic "Internal tool execution error." catch-all also carries the note, so a
 * validation gate that silently stopped rejecting bad arguments would still leave the test green
 * as long as whatever came after it also failed. Asserting the caught error's text is exactly
 * this sentinel (never `/Unknown property/`) is what makes that regression visible. */
const SEARCH_SHOULD_NOT_BE_REACHED =
  'fakeContext SENTINEL: _search must not be called -- argument validation should have ' +
  'rejected this call before any context access';

function fakeContext(
  fieldCaps: (params: unknown) => Promise<unknown> = () => {
    throw new Error(
      'fakeContext: _field_caps should not be called by this test -- if it should be, pass a ' +
        'fieldCaps implementation explicitly.',
    );
  },
): RequestHandlerContext {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            fieldCaps,
            search: () => {
              throw new Error(SEARCH_SHOULD_NOT_BE_REACHED);
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
}

async function runOrchestrate(
  scripts: StreamEvent[][],
  context: RequestHandlerContext,
): Promise<{ events: StreamEvent[]; callMessages: ChatMessage[][] }> {
  const { adapter, callMessages } = scriptedAdapter(scripts);
  const controller = new AbortController();
  const events: StreamEvent[] = [];
  for await (const event of orchestrate(
    adapter,
    PROVIDER_CONFIG,
    INITIAL_MESSAGES,
    new Date().toISOString(),
    controller.signal,
    context,
    NOOP_REQUEST,
    NOOP_LOGGER,
    undefined,
  )) {
    events.push(event);
  }
  return { events, callMessages };
}

/** Reads the `role:'tool'` message content(s) appended for a given round's outbound history, i.e.
 * the messages a LATER chatStream call actually received -- `callMessages[roundIndex + 1]` is
 * what the model read AFTER `roundIndex`'s tool call resolved (roundIndex 0 is stage 1, so
 * tool-round N's result lands in `callMessages[N + 1]`). */
function toolMessagesInCall(
  callMessages: ChatMessage[][],
  callIndex: number,
): ChatMessage[] {
  return callMessages[callIndex].filter(m => m.role === 'tool');
}

// --- augmentToolError: pure-function coverage of the CHOKEPOINT shape ------------------------

test('augmentToolError: appends CAPABILITY_DENIAL_NOTE to {error} content', () => {
  const out = augmentToolError(
    JSON.stringify({ error: 'Invalid arguments: x' }),
  );
  assert.deepEqual(JSON.parse(out), {
    error: 'Invalid arguments: x',
    note: CAPABILITY_DENIAL_NOTE,
  });
});

test('augmentToolError: covers the last-resort execution-crash fallback shape too', () => {
  // chat.ts's own catch-block around executeToolCall constructs exactly this literal when
  // executeToolCall throws (which its own doc comment says it never does by design -- this proves
  // the SAME chokepoint the two reachable tests below exercise also covers that unreachable-in-
  // practice branch, since it is shape-driven, not a per-branch decision).
  const out = augmentToolError(
    JSON.stringify({ error: 'Internal tool execution error.' }),
  );
  assert.deepEqual(JSON.parse(out), {
    error: 'Internal tool execution error.',
    note: CAPABILITY_DENIAL_NOTE,
  });
});

test('augmentToolError: is a no-op for non-error content (a success digest, unparseable text)', () => {
  assert.equal(
    augmentToolError(JSON.stringify({ counts: { total: 5 } })),
    JSON.stringify({ counts: { total: 5 } }),
  );
  assert.equal(augmentToolError('not json at all'), 'not json at all');
  assert.equal(
    augmentToolError(JSON.stringify({ shown: true, note: 'x' })),
    JSON.stringify({ shown: true, note: 'x' }),
  );
});

// --- registry-wide coverage: nothing exempt by default (same standard as
// agg-size-coverage.test.ts / field-policy-coverage.test.ts) ------------------------------------

test('registry-wide coverage: EVERY catalog tool carries CAPABILITY_DENIAL_NOTE on a rejected call', async () => {
  // A property no tool's schema declares is a validation failure for EVERY tool regardless of
  // its own required/optional shape (schema-validator.ts's `validate` rejects any unknown
  // property unconditionally). Each tool is driven through the REAL orchestrate loop (not by
  // calling augmentToolError inside this test, which would stay green even if chat.ts stopped
  // applying it): what is asserted is the role:'tool' message the NEXT round actually reads --
  // the chokepoint itself. Validation fails before any context access, so fakeContext()'s
  // fieldCaps/search stubs are never touched -- and the search stub throws
  // SEARCH_SHOULD_NOT_BE_REACHED specifically so that if validation ever stopped rejecting this
  // call, execution would fall through to that sentinel instead of silently landing on some OTHER
  // error that still happens to carry the note (executor.ts's generic catch-all does too) and
  // keeping this loop green for the wrong reason. Nothing here is a per-tool allowlist: a future
  // tool added to the registry inherits the note automatically or fails this test.
  const failures: string[] = [];
  for (const def of listToolDefinitions()) {
    // eslint-disable-next-line no-await-in-loop -- short sequential registry scan, not hot code
    const { callMessages } = await runOrchestrate(
      [
        STAGE1_SCRIPT,
        [
          {
            type: 'tool_call',
            toolCall: {
              id: 'coverage-check',
              name: def.spec.name,
              arguments: { __not_a_real_property__: true },
            },
          },
          { type: 'done', usage: { inputTokens: 10, outputTokens: 2 } },
        ],
        textOnlyScript('Understood.'),
      ],
      fakeContext(),
    );
    const toolMessages = toolMessagesInCall(callMessages, 2);
    const last = toolMessages[toolMessages.length - 1];
    let parsed: { error?: unknown; note?: unknown } = {};
    try {
      parsed = last ? JSON.parse(last.content) : {};
    } catch {
      // leave parsed empty -- reported as a failure below
    }
    if (
      typeof parsed.error !== 'string' ||
      !/Unknown property/.test(parsed.error) ||
      parsed.note !== CAPABILITY_DENIAL_NOTE
    ) {
      failures.push(
        `${def.spec.name}: ${JSON.stringify(parsed)}` +
          (typeof parsed.error === 'string' &&
          parsed.error.includes(SEARCH_SHOULD_NOT_BE_REACHED)
            ? ' (validation did not reject the call -- execution reached the search stub)'
            : ''),
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    `tool(s) whose rejected call did not carry a genuine VALIDATION error with the ` +
      `capability-denial note: ${failures.join(', ')}`,
  );
});

// --- (a) a tool error reaching the model always carries the note field ------------------------

test('orchestrate: a real tool call rejected by ARGUMENT VALIDATION carries the note next round', async () => {
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      // search_wazuh_data with query_dsl missing -- buildValidatedRequest's schema validation
      // rejects this before ANY context access, so a minimal fakeContext() with no fieldCaps
      // implementation proves the point without touching it.
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: 'search_wazuh_data',
            arguments: { index_pattern: 'wazuh-findings-v5-*' },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('Let me try a different tool.'),
    ],
    fakeContext(),
  );

  const toolMessages = toolMessagesInCall(callMessages, 2);
  assert.equal(toolMessages.length, 1);
  const parsed = JSON.parse(toolMessages[0].content);
  assert.match(parsed.error, /Missing required property "query_dsl"/);
  assert.equal(
    parsed.note,
    CAPABILITY_DENIAL_NOTE,
    'a validation-rejected tool call must still carry the capability-denial note',
  );
});

test('orchestrate: a real tool call rejected by a GUARDRAIL (missing time range) carries the note', async () => {
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      // Well-formed arguments, but the query has no @timestamp range -- guardrails.ts's lintDsl
      // rejects this, again before any context access (checkIndexAllowlist/applySafetyValves/
      // lintDsl are all pure).
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: 'search_wazuh_data',
            arguments: {
              index_pattern: 'wazuh-findings-v5-*',
              query_dsl: JSON.stringify({ query: { match_all: {} } }),
            },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('Let me try a narrower query.'),
    ],
    fakeContext(),
  );

  const toolMessages = toolMessagesInCall(callMessages, 2);
  assert.equal(toolMessages.length, 1);
  const parsed = JSON.parse(toolMessages[0].content);
  assert.match(
    parsed.error,
    /must include a "range" clause on the "@timestamp" field/,
  );
  assert.equal(
    parsed.note,
    CAPABILITY_DENIAL_NOTE,
    'a guardrail-rejected tool call must still carry the capability-denial note',
  );
});

// NOTE (test-integrity pass): a test named 'orchestrate: a SUCCESSFUL real tool call is NOT
// augmented with the capability-denial note' used to live here. It never called `orchestrate` --
// it only called `augmentToolError` on a synthetic success-shaped payload, which is byte-for-byte
// the same exercise as 'augmentToolError: is a no-op for non-error content' above (just a
// different literal). A misleadingly-named duplicate is worse than no test: a reader (or a future
// diff) sees "orchestrate" and "SUCCESSFUL real tool call" and believes the success path is
// covered end-to-end, when it is not. Standing up a genuine successful real-tool call through
// `orchestrate` would need a much fuller Indexer/Manager client fake than this route-harness file
// builds elsewhere (the test's own comment already said as much), so rather than bend the name to
// fit the shallow check, or bolt on a heavier fake under time pressure, it is deleted here. The
// success-path guarantee remains covered by the two `augmentToolError: ... no-op ...` tests above,
// which test the actual chokepoint function directly and accurately describe what they check.

// --- (b) an unknown-fields handoff produces a tool error, not a suggested_query event ----------

test('orchestrate: suggest_discover_query unknown field -> bounded tool error, not suggested_query', async () => {
  const context = fakeContext(() => Promise.resolve({ body: { fields: {} } }));
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: {
              index: 'wazuh-findings-v5-*',
              query_dsl: JSON.stringify({ term: { 'made.up.field': 'x' } }),
              reason: 'This filter needs a field I could not confirm exists.',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('I could not verify that field.'),
    ],
    context,
  );

  assert.equal(
    events.filter(e => e.type === 'suggested_query').length,
    0,
    'the first unknown-fields resolution this turn must NOT emit a suggested_query event',
  );

  const toolMessages = toolMessagesInCall(callMessages, 2);
  assert.equal(toolMessages.length, 1);
  const parsed = JSON.parse(toolMessages[0].content);
  assert.match(
    parsed.error,
    // Plural-agnostic on purpose: the validator reports "field(s) that do not exist on <index>:
    // <list>" for one field or many, so pinning the singular "does not exist" made this fail on a
    // message that was strictly more correct.
    /not exist on wazuh-findings-v5-\*: made\.up\.field/,
  );
  assert.match(
    parsed.error,
    /Rewrite the suggestion with fields that exist there/,
  );
  assert.equal(
    parsed.note,
    CAPABILITY_DENIAL_NOTE,
    'the unknown-fields self-correction error is a tool error like any other and must carry ' +
      'the note',
  );
});

// --- (b2) issue C4: narration before the suggest_discover_query call must survive into the
// RETRY round's history, not be discarded as `content: ''` -- this is the exact defect review
// caught: "Let me hand you a Discover query…" repeated near-identically across rounds
// because the model could not see it had already said it.

test('orchestrate: narration before a suggest_discover_query call is carried into the retry round, not dropped', async () => {
  const context = fakeContext(() => Promise.resolve({ body: { fields: {} } }));
  const narration = 'Let me hand you a Discover query for that instead.';
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      [
        { type: 'delta', content: narration },
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: {
              index: 'wazuh-findings-v5-*',
              query_dsl: JSON.stringify({ term: { 'made.up.field': 'x' } }),
              reason: 'This filter needs a field I could not confirm exists.',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('I could not verify that field.'),
    ],
    context,
  );

  // callMessages[0] = stage1, [1] = round 0's own outbound (pre-narration), [2] = the retry
  // round's outbound -- the first call that could echo round 0's narration back as history.
  const retryRoundMessages = callMessages[2];
  const toolCallMessage = retryRoundMessages.find(
    message =>
      message.role === 'assistant' && message.toolCalls?.[0]?.id === 'call_1',
  );
  assert.ok(
    toolCallMessage,
    "expected round 0's [assistant{toolCalls}, tool{content}] pair in the retry round's history",
  );
  assert.equal(
    toolCallMessage?.content,
    narration,
    "the narration the user already read must be the assistant message's own content, so the " +
      'model does not re-narrate it on the retry',
  );
});

// --- (c) a SECOND unknown_fields failure this turn falls through to a disclosure-suffixed
// suggested_query -------------------------------------------------------------------------------

test('orchestrate: a SECOND unknown_fields resolution emits stripped DSL + disclosure reason', async () => {
  const context = fakeContext(() => Promise.resolve({ body: { fields: {} } }));
  const callArgs = {
    index: 'wazuh-findings-v5-*',
    query_dsl: JSON.stringify({ term: { 'made.up.field': 'x' } }),
    reason: 'This filter needs a field I could not confirm exists.',
  };
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: callArgs,
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_2',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: callArgs,
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('Here is what I could not check.'),
    ],
    context,
  );

  const suggestedQueryEvents = events.filter(
    (e): e is Extract<StreamEvent, { type: 'suggested_query' }> =>
      e.type === 'suggested_query',
  );
  assert.equal(
    suggestedQueryEvents.length,
    1,
    'exactly one suggested_query event -- the second failure falls through, the first did not',
  );
  const event = suggestedQueryEvents[0];
  // Stripped to index + time range only -- the field-level filter never survives an
  // unknown_fields outcome, verified or not.
  assert.deepEqual(event.dsl, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } }],
    },
  });
  assert.ok(
    event.reason.startsWith(callArgs.reason),
    'the disclosure is APPENDED to the model reason, not a replacement for it',
  );
  assert.match(
    event.reason,
    /\(Note: the suggested field filters could not be verified against this index, so the /,
  );
  assert.match(event.reason, /link opens with a time-range-only query\.\)/);
  // The model's DSL carried no readable time range, so the stripped link opens the DEFAULT
  // window -- the disclosure must say THAT too, or the strip silently replaces the promised
  // window (issue #8920 item 9's time-range half).
  assert.match(
    event.reason,
    /suggested time window could not be read either, so the link opens the last 24 hours/,
  );

  // First failure still produced a bounded tool error, not a second suggested_query.
  const firstFailureToolMessages = toolMessagesInCall(callMessages, 2);
  assert.equal(firstFailureToolMessages.length, 1);
  assert.match(
    JSON.parse(firstFailureToolMessages[0].content).error,
    // Plural-agnostic, same reason as the assertion above.
    /not exist on/,
  );

  // `messages` accumulates across rounds (chat.ts appends [assistant, tool] each round), so
  // the 4th chatStream call's outbound history carries BOTH tool messages: round 0's
  // unknown-fields error AND round 1's 'shown:true' acknowledgment. The acknowledgment is the
  // LAST one -- and it is not an {error} shape, so it must NOT carry CAPABILITY_DENIAL_NOTE
  // (augmentToolError is a no-op for non-error content).
  const secondFailureToolMessages = toolMessagesInCall(callMessages, 3);
  assert.equal(secondFailureToolMessages.length, 2);
  const secondParsed = JSON.parse(
    secondFailureToolMessages[secondFailureToolMessages.length - 1].content,
  );
  assert.equal(secondParsed.shown, true);
  // `assert.notEqual(secondParsed.note, CAPABILITY_DENIAL_NOTE)` alone would pass if `note` were
  // dropped entirely (undefined !== CAPABILITY_DENIAL_NOTE too) -- the opposite of what this
  // comment claims ("must leave its OWN note field untouched"). Assert the field is actually
  // present with chat.ts's real acknowledgment text instead of merely differing from the other
  // note -- this string is chat.ts's own suggest_discover_query success-path literal, unrelated
  // to digest.ts's breakdown-note wording.
  assert.equal(
    secondParsed.note,
    'The suggested query was shown to the user as an "Open in Discover" link, not as visible ' +
      'query text. Now tell the user plainly, in your own words, what you could not check and ' +
      'why — do not repeat the query itself, the link already shows it, and if you mention the ' +
      'handoff at all call it "the Discover link", never "the query below" or similar wording ' +
      'that implies a query block is displayed.',
    'the "shown" acknowledgment must carry its own explanatory note untouched by ' +
      'augmentToolError, not merely something different from CAPABILITY_DENIAL_NOTE',
  );
  assert.ok(
    !('error' in secondParsed),
    'the second failure is shown to the user (with the disclosure), not surfaced as an error',
  );
});

// --- (d) default-deny clause analysis, reason-vs-DSL validation, honest no-strip handling ------

test('orchestrate: a query_string clause -> bounded rewrite error, never shipped unvalidated', async () => {
  // The literal finding-16 field (wazuh.module, which does not exist in 5.0) expressed through
  // the single most likely clause for a Discover handoff: Discover's own query bar is a query
  // string. The allowlist-only walk used to collect ZERO field names from it and resolve
  // 'verified' -- shipping the invented field with an unmodified reason.
  const context = fakeContext(() => Promise.resolve({ body: { fields: {} } }));
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: {
              index: 'wazuh-findings-v5-*',
              query_dsl: JSON.stringify({
                bool: {
                  filter: [
                    {
                      query_string: {
                        query: 'wazuh.module:software_inventory',
                      },
                    },
                    {
                      range: {
                        '@timestamp': { gte: 'now-7d', lte: 'now' },
                      },
                    },
                  ],
                },
              }),
              reason: 'I cannot filter software inventory directly.',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('Let me rephrase that suggestion.'),
    ],
    context,
  );

  assert.equal(events.filter(e => e.type === 'suggested_query').length, 0);
  const toolMessages = toolMessagesInCall(callMessages, 2);
  const parsed = JSON.parse(toolMessages[toolMessages.length - 1].content);
  assert.match(
    parsed.error,
    /clause type\(s\) whose field names cannot be verified/,
  );
  assert.match(parsed.error, /query_string/);
  assert.equal(parsed.note, CAPABILITY_DENIAL_NOTE);
});

test('orchestrate: a reason naming a REAL field the DSL never filters on gains a mismatch disclosure', async () => {
  // The issue's literal witness, MODEL-authored: a range-only DSL whose prose names a field.
  // Only a token _field_caps confirms as a real index field counts as a promised filter.
  const context = fakeContext(() =>
    Promise.resolve({
      body: { fields: { 'wazuh.threat_intel': { keyword: {} } } },
    }),
  );
  const { events } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: {
              index: 'wazuh-findings-v5-*',
              query_dsl: JSON.stringify({
                bool: {
                  filter: [
                    {
                      range: {
                        '@timestamp': { gte: 'now-7d', lte: 'now' },
                      },
                    },
                  ],
                },
              }),
              reason:
                'I cannot query wazuh.threat_intel directly, so here is a query for it in ' +
                'Discover.',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('Here is the handoff.'),
    ],
    context,
  );

  const suggested = events.filter(
    (e): e is Extract<StreamEvent, { type: 'suggested_query' }> =>
      e.type === 'suggested_query',
  );
  assert.equal(suggested.length, 1);
  assert.match(
    suggested[0].reason,
    /does not itself filter on wazuh\.threat_intel/,
  );
});

test('orchestrate: a range-only suggestion on a blocked index is NOT told its filters were stripped', async () => {
  // The tool's PRIMARY documented use case: an index outside the executor's reach, with a
  // range-only suggestion. Nothing field-level exists to lose, so the old unconditional
  // "filters could not be verified" disclosure was simply false here.
  const { events } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_1',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: {
              index: 'some-external-index-*',
              query_dsl: JSON.stringify({
                bool: {
                  filter: [
                    {
                      range: {
                        '@timestamp': { gte: 'now-180d', lte: 'now' },
                      },
                    },
                  ],
                },
              }),
              reason: 'This index is outside what I can query directly.',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 3 } },
      ],
      textOnlyScript('Open it in Discover.'),
    ],
    fakeContext(),
  );

  const suggested = events.filter(
    (e): e is Extract<StreamEvent, { type: 'suggested_query' }> =>
      e.type === 'suggested_query',
  );
  assert.equal(suggested.length, 1);
  assert.equal(
    suggested[0].reason,
    'This index is outside what I can query directly.',
    'no strip happened, so no disclosure may be appended',
  );
  // And the model's own 180-day window survives into the emitted range-only DSL.
  assert.match(JSON.stringify(suggested[0].dsl), /now-180d/);
});

test('orchestrate: an unknown_fields resolution on the round the F3 rejected-round bound forces final still emits the handoff', async () => {
  // Converting to a tool error only helps if a FUTURE tool-bearing round exists to retry in.
  // There's an independent bound (`MAX_CONSECUTIVE_REJECTED_ROUNDS`) for a turn that never
  // succeeds even once -- tighter than the structural `MAX_TOOL_ROUNDS` cap: 3 consecutive
  // rejected real-tool-call rounds fires first and is what actually decides "no more tool-bearing
  // rounds" for an all-rejected turn like this one. The filler-round COUNT is derived from
  // `MAX_CONSECUTIVE_REJECTED_ROUNDS` rather than hardcoded: a literal script array encodes "the
  // bound is N" purely through array position, so a future change to that bound would silently
  // start exercising a different round while this test kept passing, proving nothing.
  const rejectedSearchRound: StreamEvent[] = [
    {
      type: 'tool_call',
      toolCall: {
        id: 'call_x',
        name: 'search_wazuh_data',
        arguments: { index_pattern: 'wazuh-findings-v5-*' },
      },
    },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 2 } },
  ];
  const context = fakeContext(() => Promise.resolve({ body: { fields: {} } }));
  const fillerRounds = Array.from(
    { length: MAX_CONSECUTIVE_REJECTED_ROUNDS },
    () => rejectedSearchRound,
  );
  const { events } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      ...fillerRounds,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_3',
            name: SUGGEST_DISCOVER_QUERY_TOOL.name,
            arguments: {
              index: 'wazuh-findings-v5-*',
              query_dsl: JSON.stringify({ term: { 'made.up.field': 'x' } }),
              reason: 'I could not verify this field.',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 10, outputTokens: 2 } },
      ],
      textOnlyScript('Here is what I could not check.'),
    ],
    context,
  );

  const suggested = events.filter(e => e.type === 'suggested_query');
  assert.equal(
    suggested.length,
    1,
    'the last tool-bearing round must strip-and-disclose, never burn the handoff on an error',
  );
});
