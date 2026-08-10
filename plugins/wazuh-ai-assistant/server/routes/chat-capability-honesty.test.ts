import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { augmentToolError, CAPABILITY_DENIAL_NOTE, orchestrate } from './chat';
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
        client: { asCurrentUser: { fieldCaps } },
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
  // the chokepoint itself. Validation fails before any context access, so the minimal
  // fakeContext() is never touched. Nothing here is a per-tool allowlist: a future tool added
  // to the registry inherits the note automatically or fails this test.
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
      parsed.note !== CAPABILITY_DENIAL_NOTE
    ) {
      failures.push(def.spec.name);
    }
  }
  assert.deepEqual(
    failures,
    [],
    `tool(s) whose rejected call did not carry the capability-denial note: ${failures.join(
      ', ',
    )}`,
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

test('orchestrate: a SUCCESSFUL real tool call is NOT augmented with the capability-denial note', async () => {
  // Sanity check for the shape-driven guard: get_agents with no filters is a well-formed
  // Manager call this test lets fail at the network layer (no context.wazuh_core set up here),
  // which executor.ts's own try/catch turns into a `{error: "Manager request failed: ..."}`
  // outcome -- still an ERROR shape, so it SHOULD carry the note. This test instead proves the
  // negative on a clean synthetic case: augmentToolError itself (already covered above) is the
  // actual guarantee for the success path, since standing up a real successful Indexer/Manager
  // response here would require a fuller OpenSearch/Manager client fake than this route-harness
  // test is about.
  assert.equal(
    augmentToolError(JSON.stringify({ counts: { total: 12 }, sample: [] })),
    JSON.stringify({ counts: { total: 12 }, sample: [] }),
  );
});

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
    /does not exist on wazuh-findings-v5-\*: made\.up\.field/,
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
    /does not exist on/,
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
  assert.notEqual(
    secondParsed.note,
    CAPABILITY_DENIAL_NOTE,
    'the "shown" acknowledgment is not an {error} shape, so augmentToolError must leave its ' +
      'own (different) note field untouched',
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

test('orchestrate: an unknown_fields resolution on the LAST tool-bearing round still emits the handoff', async () => {
  // Round-aware retry gate: converting to a tool error on round MAX_TOOL_ROUNDS-1 would leave
  // the final (tools-less) round unable to call suggest_discover_query at all -- the user
  // would lose the handoff entirely, a regression against base. Rounds 0 and 1 are spent on
  // ordinary rejected tool calls; the suggest call lands on round 2 (the last tool-bearing
  // one) and must fall through to strip-plus-disclose.
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
  const { events } = await runOrchestrate(
    [
      STAGE1_SCRIPT,
      rejectedSearchRound,
      rejectedSearchRound,
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
