import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  findOfferedFollowUpTool,
  MAX_TOOL_ROUNDS,
  FINAL_ROUND_ANSWER_INSTRUCTION,
  orchestrate,
} from './chat';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import { SUGGEST_DISCOVER_QUERY_TOOL } from '../tools/suggest-discover-query';
import { listToolSpecs } from '../tools/registry';
import {
  ChatMessage,
  ProviderConfig,
  StreamEvent,
  ToolSpec,
} from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * Issue #8935 item I3 -- DEFERRED-OFFER INTERCEPTION (chat.ts's `findOfferedFollowUpTool` and the
 * `forcedFollowUpTool`/`forcedFollowUpSpent` state in `orchestrate`'s round loop).
 *
 * The measured failure this pins: a turn correctly summarizes get_sca_results, then ENDS the turn
 * asking permission for an obvious next tool ("I can run get_sca_checks to list the failing
 * checks — want me to?") instead of just calling it, even though tool rounds remain unspent
 * (chat.ts's `done` branch at the time of writing, ~1378-1414, terminates on `sawToolCall===false`
 * unconditionally). This file drives the REAL `orchestrate` (not a reimplementation) with a
 * scripted fake adapter, same pattern as chat-capability-honesty.test.ts, extended to also capture
 * each call's `options` (that file's harness discards them -- the whole point here is asserting
 * `options.toolChoice` on the FORCED round).
 *
 * NOTE (needs the OSD tree to actually run): imports `./chat`, which imports
 * `@osd/config-schema` -- unresolvable outside the full wazuh-dashboard checkout this repo is
 * normally built against. Same colocated-unit-test convention as every other chat-*.test.ts file
 * in this directory; needs the platform runner (or CI) to execute. This was traced by hand against
 * the implementation (see the PR/handoff notes) but NOT executed, per the environment's
 * constraints -- stated explicitly rather than claimed as passing.
 */

// --- scriptedAdapter, extended to capture `options` -------------------------------------------

function scriptedAdapter(scripts: StreamEvent[][]): {
  adapter: ProviderAdapter;
  callMessages: ChatMessage[][];
  callOptions: (ChatStreamOptions | undefined)[];
} {
  let callIndex = 0;
  const callMessages: ChatMessage[][] = [];
  const callOptions: (ChatStreamOptions | undefined)[] = [];
  return {
    callMessages,
    callOptions,
    adapter: {
      async *chatStream(
        _config: ProviderConfig,
        messages: ChatMessage[],
        _signal: AbortSignal,
        options?: ChatStreamOptions,
      ): AsyncIterable<StreamEvent> {
        callMessages.push(messages);
        callOptions.push(options);
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
  {
    role: 'user',
    content:
      'Give me the three failed hardening checks that matter most for agent 001.',
  },
];

const NOOP_LOGGER = {
  debug: () => {},
  error: () => {},
} as unknown as Logger;

const NOOP_REQUEST = {} as unknown as OpenSearchDashboardsRequest;

/** Stage-1's forced route_question call+done, routed to the 'sca' category so the resolved
 * stage-2 tool list is exactly [get_sca_results, get_sca_checks, search_wazuh_data] plus chat.ts's
 * unconditional SUGGEST_DISCOVER_QUERY_TOOL append -- a small, known-exact `tools` list the offer
 * text can be scripted against without ambiguity. */
const STAGE1_SCA_SCRIPT: StreamEvent[] = [
  {
    type: 'tool_call',
    toolCall: {
      id: 'route_1',
      name: ROUTE_QUESTION_TOOL.name,
      arguments: { categories: ['sca'] },
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

/** An offer-shaped round: some narration, then a deferred-permission question naming a tool, then
 * `done` with NO tool call -- the exact shape of the measured failure. */
function offerScript(text: string): StreamEvent[] {
  return [
    { type: 'delta', content: text },
    { type: 'done', usage: { inputTokens: 15, outputTokens: 8 } },
  ];
}

/** A rejected, argument-invalid search_wazuh_data call -- cheap way to make a round a REAL tool
 * round (sets `toolUsedThisTurn`, adds to `executedToolNames`) without needing any OpenSearch
 * mocking: schema validation rejects it before any context access (same trick
 * chat-capability-honesty.test.ts uses for its coverage sweep). */
const REJECTED_SEARCH_ROUND: StreamEvent[] = [
  {
    type: 'tool_call',
    toolCall: {
      id: 'call_reject',
      name: 'search_wazuh_data',
      arguments: { index_pattern: 'wazuh-findings-v5-*' },
    },
  },
  { type: 'done', usage: { inputTokens: 10, outputTokens: 2 } },
];

/** A rejected, argument-invalid get_sca_results call -- same trick as REJECTED_SEARCH_ROUND, used
 * where the test specifically needs get_sca_results (not search_wazuh_data) recorded as executed. */
const REJECTED_SCA_RESULTS_ROUND: StreamEvent[] = [
  {
    type: 'tool_call',
    toolCall: {
      id: 'call_reject_sca',
      name: 'get_sca_results',
      arguments: {},
    },
  },
  { type: 'done', usage: { inputTokens: 10, outputTokens: 2 } },
];

/** Minimal `context` stub matching chat-capability-honesty.test.ts's `fakeContext` -- used for
 * every test EXCEPT the main end-to-end one, which needs real SCA responses instead (see
 * `scaContext` below). `search` throws a distinctive sentinel so a validation-gate regression
 * (a call that should have been rejected before reaching the client) fails loudly rather than
 * silently landing on some other error. */
const SEARCH_SHOULD_NOT_BE_REACHED =
  'chat-tool-chaining SENTINEL: _search must not be called for a validation-rejected call';

function rejectingContext(): RequestHandlerContext {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: () => {
              throw new Error(SEARCH_SHOULD_NOT_BE_REACHED);
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
}

/**
 * Canned SCA responses for the main end-to-end test (executor.test.ts's mocked-client pattern):
 * the FIRST real `_search` call is get_sca_results' aggregation query (size:0, `policies` terms
 * agg over policy.id with passed/failed/not_applicable filter sub-aggs -- see
 * catalog/get-sca-results.ts), the SECOND is get_sca_checks' hits+aggs query (see
 * catalog/get-sca-checks.ts). Ordering is what this fake keys off, same as
 * executor.test.ts's `fakeContext`.
 */
function scaContext(): {
  context: RequestHandlerContext;
  calls: Array<{ index: string; body: Record<string, unknown> }>;
} {
  const calls: Array<{ index: string; body: Record<string, unknown> }> = [];
  const responses: Record<string, unknown>[] = [
    // get_sca_results: one policy bucket, 95 passed / 102 failed / 10 not_applicable.
    {
      hits: { hits: [], total: { value: 207 } },
      aggregations: {
        policies: {
          buckets: [
            {
              key: 'cis_ubuntu_2004',
              doc_count: 207,
              policy_sample: {
                hits: {
                  hits: [
                    { _source: { policy: { name: 'CIS Ubuntu Linux 20.04' } } },
                  ],
                },
              },
              passed: { doc_count: 95 },
              failed: { doc_count: 102 },
              not_applicable: { doc_count: 10 },
            },
          ],
        },
      },
    },
    // get_sca_checks: two failed checks returned, aggs confirm 102 failed overall.
    {
      hits: {
        hits: [
          {
            _source: {
              check: {
                id: '4113',
                name: 'Ensure SSH root login is disabled',
                result: 'Failed',
                reason: 'PermitRootLogin is set to yes',
              },
            },
          },
          {
            _source: {
              check: {
                id: '4114',
                name: 'Ensure password expiration is 365 days or fewer',
                result: 'Failed',
                reason: 'PASS_MAX_DAYS is not set',
              },
            },
          },
        ],
        total: { value: 102 },
      },
      aggregations: {
        results: { buckets: [{ key: 'Failed', doc_count: 102 }] },
      },
    },
  ];
  const context = {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: (params: {
              index: string;
              body: Record<string, unknown>;
            }) => {
              const i = calls.length;
              calls.push(params);
              return Promise.resolve({ body: responses[i] });
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
  return { context, calls };
}

async function runOrchestrate(
  scripts: StreamEvent[][],
  context: RequestHandlerContext,
): Promise<{
  events: StreamEvent[];
  callMessages: ChatMessage[][];
  callOptions: (ChatStreamOptions | undefined)[];
}> {
  const { adapter, callMessages, callOptions } = scriptedAdapter(scripts);
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
  return { events, callMessages, callOptions };
}

// --- findOfferedFollowUpTool: pure-function table test -----------------------------------------

function tool(name: string): ToolSpec {
  return {
    name,
    description: 'test tool',
    parameters: { type: 'object', properties: {} },
  };
}

const SCA_TOOLS: ToolSpec[] = [
  tool('get_sca_results'),
  tool('get_sca_checks'),
  tool('search_wazuh_data'),
  SUGGEST_DISCOVER_QUERY_TOOL,
];

test('findOfferedFollowUpTool: a bare offered, unexecuted tool name matches', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can run get_sca_checks to list the failing checks — want me to?',
      SCA_TOOLS,
      new Set(),
    ),
    'get_sca_checks',
  );
});

test('findOfferedFollowUpTool: a trailing comma/punctuation still matches (word boundary)', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I could run get_sca_checks, if you want more detail.',
      SCA_TOOLS,
      new Set(),
    ),
    'get_sca_checks',
  );
});

test('findOfferedFollowUpTool: a longer name sharing the prefix does NOT match (word boundary)', () => {
  // "get_sca_checks_v2" is not "get_sca_checks" -- \b must not fire mid-identifier (underscore is
  // a \w character, so a naive substring match would wrongly fire here).
  assert.equal(
    findOfferedFollowUpTool(
      'I can run get_sca_checks_v2 next.',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: two candidates named -> undefined (capability listing, not an offer)', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can also run get_sca_checks or search_wazuh_data if that would help.',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: an already-executed tool is excluded even if named alone', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'That used get_sca_results.',
      SCA_TOOLS,
      new Set(['get_sca_results']),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: SUGGEST_DISCOVER_QUERY_TOOL is never returned even if named alone', () => {
  assert.equal(
    findOfferedFollowUpTool(
      `I could use ${SUGGEST_DISCOVER_QUERY_TOOL.name} to hand this off.`,
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: no name mentioned at all -> undefined', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'Here is a summary with no tool mentioned.',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

// --- registry-wide coverage: nothing exempt by default (same standard as
// agg-size-coverage.test.ts / field-policy-coverage.test.ts) ------------------------------------

test('registry-wide coverage: EVERY catalog tool is detected when offered, named alone, and unexecuted', () => {
  // Class-level guard for issue #8935 item I3: the detector must work identically for every
  // registered tool, not just the SCA pair the measured failure happened to name. Driven from the
  // REAL `listToolSpecs()` (not a hand-picked list) so a future catalog tool is covered
  // automatically -- nothing is exempt by default. A tool whose name breaks the `\bname\b` regex
  // construction (e.g. a future name containing a regex metacharacter, which would violate the
  // documented `[a-z_]+` tool-name shape), or a detector that silently degraded to a hardcoded
  // per-tool allowlist instead of scanning the full offered list, fails this loop instead of
  // shipping unnoticed.
  const allTools = listToolSpecs();
  const offered = [...allTools, SUGGEST_DISCOVER_QUERY_TOOL];
  const failures: string[] = [];
  for (const spec of allTools) {
    const result = findOfferedFollowUpTool(
      `I can run ${spec.name} to look into that further — want me to?`,
      offered,
      new Set(),
    );
    if (result !== spec.name) {
      failures.push(`${spec.name}: got ${JSON.stringify(result)}`);
    }
  }
  assert.deepEqual(
    failures,
    [],
    `tool(s) not detected as the sole offered candidate when named alone: ${failures.join(
      ', ',
    )}`,
  );
});

test('registry-wide coverage: no catalog tool is ever returned when it is the ONLY thing already executed this turn', () => {
  // The mirror image of the sweep above: every tool, when it is the ONLY name in the text but was
  // ALSO the only tool executed this turn, must be excluded -- "the model is summarizing its own
  // work", never "deferring a new call to itself". Guards the `executedToolNames` exclusion against
  // a future tool silently bypassing it (e.g. a name comparison that stopped being exact-match).
  const allTools = listToolSpecs();
  const offered = [...allTools, SUGGEST_DISCOVER_QUERY_TOOL];
  const failures: string[] = [];
  for (const spec of allTools) {
    const result = findOfferedFollowUpTool(
      `That already ran ${spec.name} earlier this turn.`,
      offered,
      new Set([spec.name]),
    );
    if (result !== undefined) {
      failures.push(`${spec.name}: got ${JSON.stringify(result)}`);
    }
  }
  assert.deepEqual(
    failures,
    [],
    `tool(s) wrongly returned despite being the only EXECUTED tool named: ${failures.join(
      ', ',
    )}`,
  );
});

// --- orchestrate: main end-to-end case -- FAILS ON BASE -----------------------------------------

test('orchestrate: an unprompted single-tool offer with rounds remaining is forced into a chained call, not left to end the turn', async () => {
  const { context } = scaContext();
  const { events, callMessages, callOptions } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      // round 0: get_sca_results (real tool, executes against the canned response above).
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_sca_results',
            name: 'get_sca_results',
            arguments: { agent_id: '001' },
          },
        },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 10 } },
      ],
      // round 1: the MEASURED failure shape -- correct summary, then a deferred single-tool offer,
      // no tool call, done. On base this 'done' ends the turn right here.
      offerScript(
        'CIS Ubuntu: 95 passed, 102 failed, 10 N/A. I can run get_sca_checks to list the ' +
          'failing checks — want me to?',
      ),
      // round 2 (forced by the mechanism): get_sca_checks, real tool, executes against the
      // second canned response.
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_sca_checks',
            name: 'get_sca_checks',
            arguments: {
              agent_id: '001',
              policy_id: 'cis_ubuntu_2004',
              result: 'failed',
            },
          },
        },
        { type: 'done', usage: { inputTokens: 25, outputTokens: 12 } },
      ],
      // round 3: final (no-tools) round closes out the answer.
      textOnlyScript(
        'The three highest-impact failed checks are SSH root login, password expiration, ' +
          'and (see table above).',
      ),
    ],
    context,
  );

  // On base: orchestrate yields 'done' immediately after round 1 (3 chatStream calls total:
  // stage1, round0, round1) -- this turn instead runs all 5 scripted calls.
  assert.equal(
    callMessages.length,
    5,
    'expected stage1 + 4 rounds (get_sca_results, the offer, the forced get_sca_checks, the ' +
      `final round) -- got ${callMessages.length} chatStream calls`,
  );

  // Exactly one 'done' StreamEvent ends the turn -- the round-1 offer's 'done' must be suppressed,
  // not forwarded (on base it IS forwarded and ends the stream right there).
  const doneEvents = events.filter(e => e.type === 'done');
  assert.equal(
    doneEvents.length,
    1,
    "exactly one done event should reach the client -- the offer round's done must be suppressed",
  );

  // The 4th chatStream call (0-indexed 3: stage1=0, round0=1, offer=2, forced=3) is the forced
  // round, and its options.toolChoice names get_sca_checks specifically -- not 'auto'.
  assert.deepEqual(callOptions[3]?.toolChoice, { name: 'get_sca_checks' });

  // Both real tools actually ran (forwarded as tool_call StreamEvents with the reversed/real args
  // -- privacy is off in this test, so real args are the only form).
  const toolCallEvents = events.filter(
    (e): e is Extract<StreamEvent, { type: 'tool_call' }> =>
      e.type === 'tool_call',
  );
  assert.deepEqual(
    toolCallEvents.map(e => e.toolCall.name),
    ['get_sca_results', 'get_sca_checks'],
  );

  // #8893 pin: the final round's outbound messages still end with FINAL_ROUND_ANSWER_INSTRUCTION.
  // This must survive item I3 unchanged -- the forced round is a normal tool round, not the final
  // one, so it does NOT carry the instruction; only the genuinely last (no-tools) round does.
  const finalRoundMessages = callMessages[4];
  const lastMessage = finalRoundMessages[finalRoundMessages.length - 1];
  assert.equal(lastMessage.role, 'system');
  assert.equal(lastMessage.content, FINAL_ROUND_ANSWER_INSTRUCTION);
  // And the FORCED round's outbound messages do NOT carry it (it is not the final round).
  const forcedRoundMessages = callMessages[3];
  assert.notEqual(
    forcedRoundMessages[forcedRoundMessages.length - 1].content,
    FINAL_ROUND_ANSWER_INSTRUCTION,
  );
});

// --- orchestrate: negative / regression fences --------------------------------------------------
// Each of these passes BOTH on base and after this change -- they exist to prove the mechanism
// does not over-fire, not to reproduce the measured defect.

test('orchestrate: naming an ALREADY-EXECUTED tool alone does not force a chained call', async () => {
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      // Names get_sca_results (already "executed" this turn, even though its call was rejected --
      // executedToolNames is populated regardless of outcome, see chat.ts's own doc comment).
      offerScript('That used get_sca_results earlier in this turn.'),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    3,
    'no forced 4th round should be introduced',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: naming two unexecuted tools (capability listing) does not force a chained call', async () => {
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      offerScript(
        'I can also run get_sca_checks or search_wazuh_data if that would help — want me to?',
      ),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    3,
    'a listing of multiple tools must never be force-called into an arbitrary one',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: an offer on the LAST tool-bearing round is not forced (no budget for a next tool round)', async () => {
  // Filler-round COUNT derived from MAX_TOOL_ROUNDS, same technique as
  // chat-capability-honesty.test.ts's "last tool-bearing round" test: the offer must land on round
  // MAX_TOOL_ROUNDS - 1 regardless of what the round budget happens to be, not via a hardcoded
  // script-array position.
  const fillerRounds = Array.from(
    { length: MAX_TOOL_ROUNDS - 1 },
    () => REJECTED_SEARCH_ROUND,
  );
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      ...fillerRounds,
      offerScript('I can run get_sca_checks — want me to?'),
    ],
    rejectingContext(),
  );

  // stage1 + (MAX_TOOL_ROUNDS - 1) fillers + the offer round = MAX_TOOL_ROUNDS + 1 calls, and no
  // forced round beyond that (the final no-tools round is never reached either, because the offer
  // round's own done -- unforced -- ends the turn normally).
  assert.equal(callMessages.length, MAX_TOOL_ROUNDS + 1);
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: no tool ran this turn -- a mentioned tool name never forces a call', async () => {
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      // round 0 itself is the offer -- no tool has run yet this turn.
      offerScript('I could run get_sca_checks for you — want me to?'),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    2,
    'a no-tool conversational turn must terminate normally, not be hijacked into calling one',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: a second offer after one force was already spent this turn does not force again', async () => {
  const { events, callMessages, callOptions } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      // round 1: offers get_sca_checks -- forces round 2.
      offerScript('I can run get_sca_checks — want me to?'),
      // round 2 (forced): instead of complying, the model offers a DIFFERENT unexecuted tool.
      // Round 2 also happens to be the last tool-bearing round at MAX_TOOL_ROUNDS=3, so this
      // fences BOTH forcedFollowUpSpent and the round-budget gate at once -- see this file's own
      // header note on why the fixed round budget makes the two impossible to isolate cleanly in
      // one scripted scenario.
      offerScript('I could also run search_wazuh_data — want me to?'),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    4,
    'no 5th chatStream call should be introduced by the second offer',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
  // The one force that DID happen (round 1's offer forces round 2) is still visible in the
  // captured options: stage1=index0, round0=index1, round1(the offer)=index2, round2(the FORCED
  // round, carrying the toolChoice round1's interception set)=index3.
  assert.deepEqual(callOptions[3]?.toolChoice, { name: 'get_sca_checks' });
  // And round1's OWN call (before any force applied) used the default 'auto', confirming the
  // force is delivered to the round AFTER detection, never the detecting round itself.
  assert.equal(callOptions[2]?.toolChoice, 'auto');
});
