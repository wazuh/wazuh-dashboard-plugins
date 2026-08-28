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
  FINAL_ROUND_CONTINUATION_INSTRUCTION,
  orchestrate,
  shouldConsiderDeferredOffer,
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
 * DEFERRED-OFFER INTERCEPTION (chat.ts's `findOfferedFollowUpTool` and the
 * `forcedFollowUpTool`/`forcedFollowUpSpent` state in `orchestrate`'s round loop).
 *
 * The failure this pins: a turn correctly summarizes get_sca_results, then ENDS the turn asking
 * permission for an obvious next tool ("I can run get_sca_checks to list the failing checks —
 * want me to?") instead of just calling it, even though tool rounds remain unspent (chat.ts's
 * `done` branch terminates on `sawToolCall===false` unconditionally). This file drives the REAL
 * `orchestrate` (not a reimplementation) with a scripted fake adapter, same pattern as
 * chat-capability-honesty.test.ts, extended to also capture each call's `options` (that file's
 * harness discards them -- the whole point here is asserting `options.toolChoice` on the FORCED
 * round).
 *
 * NOTE (running outside the OSD tree): imports `./chat`, which imports `@osd/config-schema` --
 * unresolvable outside the full wazuh-dashboard checkout this repo is normally built against.
 * Same colocated-unit-test convention as every other chat-*.test.ts file in this directory; CI
 * runs it under the platform runner.
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
 * `done` with NO tool call -- the exact shape the interception targets. */
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
    // A THIRD response, same shape as the first -- used by the main end-to-end test's extra
    // duplicate get_sca_results round: the cost-budget futility-stop needs a repeated identical
    // call to demonstrate the "duplicate query" trigger.
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

test('findOfferedFollowUpTool: an already-executed tool is excluded even from an offer-shaped sentence', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can run get_sca_results again — want me to?',
      SCA_TOOLS,
      new Set(['get_sca_results']),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: a NON-offer sentence never matches, even naming one unexecuted tool', () => {
  // The sentence-level offer gate: a dismissive/negative mention must not read as an offer.
  // No OFFER_MARKER_RE marker anywhere in this text.
  assert.equal(
    findOfferedFollowUpTool(
      'get_sca_checks would not answer a hardening question, so this summary covers only SCA.',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: marker and name in DIFFERENT sentences do not combine into an offer', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can dig further if you want. get_sca_checks was not appropriate here.',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: search_wazuh_data (the escape hatch) is never returned, even offered alone', () => {
  // prompts.ts orders the model to offer this exact tool in prose -- see FORCE_EXEMPT_TOOL_NAMES.
  assert.equal(
    findOfferedFollowUpTool(
      'I can query the source IPs with search_wazuh_data — want me to?',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: a listing where one option is exempt is STILL a listing (mention count precedes exclusions)', () => {
  // If exclusions ran before the exactly-one count, "get_sca_checks or search_wazuh_data" would
  // collapse to one candidate and be force-called -- this pins the gate ordering.
  assert.equal(
    findOfferedFollowUpTool(
      'I can also run get_sca_checks or search_wazuh_data if that would help — want me to?',
      SCA_TOOLS,
      new Set(),
    ),
    undefined,
  );
});

test('shouldConsiderDeferredOffer: pins every gate, including the once-per-turn spent flag', () => {
  const base = {
    isFinalRound: false,
    round: 1,
    maxRounds: 3,
    toolUsedThisTurn: true,
    forcedFollowUpSpent: false,
  };
  assert.equal(shouldConsiderDeferredOffer(base), true);
  // The spent flag: unreachable-as-true under MAX_TOOL_ROUNDS=3 (only round 1 can intercept), so
  // this pure-function pin is the ONLY executable witness of its bound -- see the state doc
  // comment in chat.ts's orchestrate.
  assert.equal(
    shouldConsiderDeferredOffer({ ...base, forcedFollowUpSpent: true }),
    false,
  );
  assert.equal(
    shouldConsiderDeferredOffer({ ...base, toolUsedThisTurn: false }),
    false,
  );
  assert.equal(shouldConsiderDeferredOffer({ ...base, round: 2 }), false);
  assert.equal(
    shouldConsiderDeferredOffer({ ...base, isFinalRound: true }),
    false,
  );
  // A raised round budget re-opens later rounds -- the flag becomes load-bearing exactly then.
  assert.equal(
    shouldConsiderDeferredOffer({ ...base, round: 2, maxRounds: 4 }),
    true,
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

// --- metadata fallback: CHAIN_PAIRS keyed by the last successful summary tool, for an offer that
// never names a tool at all ----------------------------------------------------------------

test('findOfferedFollowUpTool: metadata fallback -- an offer naming no tool chains via CHAIN_PAIRS', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'CIS Ubuntu: 95 passed, 102 failed. I can pull the specific failing checks if you would ' +
        'like.',
      SCA_TOOLS,
      new Set(),
      'get_sca_results',
    ),
    'get_sca_checks',
  );
});

test('findOfferedFollowUpTool: metadata fallback -- no lastSuccessfulToolName -> undefined', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can pull more detail if you would like.',
      SCA_TOOLS,
      new Set(),
      undefined,
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: metadata fallback -- lastSuccessfulToolName has no CHAIN_PAIRS entry -> undefined', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can pull more detail if you would like.',
      SCA_TOOLS,
      new Set(),
      'search_wazuh_data',
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: metadata fallback -- the chained detail tool must actually be OFFERED this turn', () => {
  // get_sca_results chains to get_sca_checks, but this turn's offered list does not include it --
  // the fallback must not name a tool the model could not have called anyway.
  assert.equal(
    findOfferedFollowUpTool(
      'I can pull more detail if you would like.',
      [tool('get_sca_results'), tool('search_wazuh_data')],
      new Set(),
      'get_sca_results',
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: metadata fallback -- the chained detail tool already executed is excluded', () => {
  assert.equal(
    findOfferedFollowUpTool(
      'I can pull more detail if you would like.',
      SCA_TOOLS,
      new Set(['get_sca_checks']),
      'get_sca_results',
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: metadata fallback -- ordinary closing boilerplate is NOT force-called', () => {
  // "Let me know if you need anything else." matches OFFER_MARKER_RE ("let me know") and names
  // no tool, so without the relevance gate this force-calls
  // CHAIN_PAIRS['get_sca_results'][0] (get_sca_checks) on every turn that ran get_sca_results and
  // ended with this near-universal closer. The sentence has no more/specific/further/detail
  // vocabulary, so the relevance gate must degrade this to base behaviour.
  assert.equal(
    findOfferedFollowUpTool(
      'CIS Ubuntu: 95 passed, 102 failed. Let me know if you need anything else.',
      SCA_TOOLS,
      new Set(),
      'get_sca_results',
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: metadata fallback -- "happy to help with anything else" is NOT force-called', () => {
  // Same false-positive class, different closer from the same OFFER_MARKER_RE vocabulary
  // ("happy to"), also lacking any more/specific/further vocabulary.
  assert.equal(
    findOfferedFollowUpTool(
      'CIS Ubuntu: 95 passed, 102 failed. Happy to help with anything else.',
      SCA_TOOLS,
      new Set(),
      'get_sca_results',
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: metadata fallback -- a paraphrased search_wazuh_data offer is NOT force-called into an unrelated tool', () => {
  // prompts.ts orders the model to offer search_wazuh_data in prose for a field a typed result
  // lacks; FORCE_EXEMPT_TOOL_NAMES only protects that offer when it NAMES the
  // tool. A paraphrase ("a custom query for those fields") matches the detail-vocabulary gate (it
  // says "those fields") but must still be excluded by the escape-hatch exclusion, or it would be
  // force-called into get_sca_checks -- a tool the offer was never about.
  assert.equal(
    findOfferedFollowUpTool(
      'CIS Ubuntu: 95 passed, 102 failed. The result does not include the exact remediation ' +
        'text -- I can run a custom query for those fields if you would like.',
      SCA_TOOLS,
      new Set(),
      'get_sca_results',
    ),
    undefined,
  );
});

test('findOfferedFollowUpTool: a NON-offer round (no OFFER_MARKER_RE marker) is untouched by the fallback', () => {
  // No offer-shaped sentence at all -- the metadata fallback must never fire just because a
  // chained summary tool ran; the offer-shape gate is checked FIRST, same as the name-based path.
  assert.equal(
    findOfferedFollowUpTool(
      'CIS Ubuntu: 95 passed, 102 failed, 10 not applicable.',
      SCA_TOOLS,
      new Set(),
      'get_sca_results',
    ),
    undefined,
  );
});

// --- registry-wide coverage: nothing exempt by default (same standard as
// agg-size-coverage.test.ts / field-policy-coverage.test.ts) ------------------------------------

test('registry-wide coverage: EVERY catalog tool is detected when offered, named alone, and unexecuted — except the recorded exemption', () => {
  // Class-level guard: the detector must work identically for every registered tool, not just
  // the SCA pair. Driven from the REAL `listToolSpecs()` (not a hand-picked list) so a future
  // catalog tool is covered automatically -- the ONLY exemption is search_wazuh_data
  // (FORCE_EXEMPT_TOOL_NAMES: prompts.ts orders the model to offer it in prose, and it is the
  // strictest-guardrail surface), asserted here EXPLICITLY so the exemption list cannot silently
  // grow. A tool whose name breaks the `\bname\b` regex construction, or a detector that silently
  // degraded to a hardcoded per-tool allowlist instead of scanning the full offered list, fails
  // this loop instead of shipping unnoticed.
  const allTools = listToolSpecs();
  const offered = [...allTools, SUGGEST_DISCOVER_QUERY_TOOL];
  const failures: string[] = [];
  for (const spec of allTools) {
    const result = findOfferedFollowUpTool(
      `I can run ${spec.name} to look into that further — want me to?`,
      offered,
      new Set(),
    );
    const expected = spec.name === 'search_wazuh_data' ? undefined : spec.name;
    if (result !== expected) {
      failures.push(
        `${spec.name}: got ${JSON.stringify(result)}, expected ${JSON.stringify(
          expected,
        )}`,
      );
    }
  }
  assert.deepEqual(
    failures,
    [],
    `tool(s) with the wrong offer-detection outcome: ${failures.join(', ')}`,
  );
});

test('registry-wide coverage: every tool name is the documented [a-z_]+ shape the detector depends on', () => {
  // The detector's privacy- and regex-safety argument (see findOfferedFollowUpTool's doc comment)
  // leans on tool names being a closed [a-z_]+ vocabulary; this is the only place that invariant
  // is enforced. A future dotted/uppercase/metacharacter name would break
  // the \b word-boundary construction silently -- it breaks here loudly instead.
  const names = [...listToolSpecs(), SUGGEST_DISCOVER_QUERY_TOOL].map(
    spec => spec.name,
  );
  for (const name of names) {
    assert.match(name, /^[a-z_]+$/);
  }
  // And the recorded force-exemption still names a REAL registry tool -- a rename would otherwise
  // void the exemption without failing anything.
  assert.ok(
    names.includes('search_wazuh_data'),
    'FORCE_EXEMPT_TOOL_NAMES names a tool that no longer exists in the registry',
  );
});

test('registry-wide coverage: no catalog tool is ever returned when it is the ONLY thing already executed this turn', () => {
  // The mirror image of the detection sweep above: every tool, when offered alone but ALSO the
  // only tool successfully executed this turn, must be excluded -- "the model is summarizing its
  // own work", never "deferring a new call to itself". Guards the `executedToolNames` exclusion
  // against a future tool silently bypassing it (e.g. a name comparison that stopped being
  // exact-match). Offer-shaped text on purpose: with a non-offer sentence the marker gate would
  // short-circuit first and this sweep would prove nothing about the exclusion.
  const allTools = listToolSpecs();
  const offered = [...allTools, SUGGEST_DISCOVER_QUERY_TOOL];
  const failures: string[] = [];
  for (const spec of allTools) {
    const result = findOfferedFollowUpTool(
      `I can run ${spec.name} again — want me to?`,
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

// --- orchestrate: a round's own narration must survive into the NEXT round's history instead of
// being discarded as `content: ''` on the assistant message that carries its tool_call
// (otherwise the model has no record of having already said it and re-narrates on a later round).

test("orchestrate: a round's streamed prose is carried into the NEXT round's history on the assistant message that made the tool_call", async () => {
  const { context } = scaContext();
  const narration = 'Let me check the SCA results for agent 001.';
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      // round 0: narrates, THEN calls get_sca_results -- on base this narration is dropped
      // (the pushed assistant message used `content: ''`).
      [
        { type: 'delta', content: narration },
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
      // round 1: closes out with no further tool call.
      textOnlyScript('CIS Ubuntu: 95 passed, 102 failed, 10 N/A.'),
    ],
    context,
  );

  // callMessages[0] = stage1, [1] = round 0's own outbound (only INITIAL_MESSAGES, pre-narration),
  // [2] = round 1's outbound -- the first call that could possibly see round 0's narration echoed
  // back as history.
  const round1Messages = callMessages[2];
  const toolCallMessage = round1Messages.find(
    message =>
      message.role === 'assistant' &&
      message.toolCalls?.[0]?.id === 'call_sca_results',
  );
  assert.ok(
    toolCallMessage,
    "expected round 0's [assistant{toolCalls}, tool{content}] pair in round 1's history",
  );
  assert.equal(
    toolCallMessage?.content,
    narration,
    "round 0's already-streamed narration must be the assistant message's own content, not " +
      'discarded as an empty string',
  );
});

test('orchestrate: two tool_calls in the SAME round each get only the narration that preceded them, not the whole round repeated twice', async () => {
  // Guards the `roundTextConsumed` slicing (chat.ts): a round with narration, a tool_call, MORE
  // narration, then a second tool_call must attribute each slice once, not double-attribute the
  // first slice to the second message too.
  const context = rejectingContext();
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      [
        { type: 'delta', content: 'First, checking SCA. ' },
        {
          type: 'tool_call',
          toolCall: { id: 'call_1', name: 'get_sca_results', arguments: {} },
        },
        { type: 'delta', content: 'Now checking a second thing.' },
        {
          type: 'tool_call',
          toolCall: { id: 'call_2', name: 'search_wazuh_data', arguments: {} },
        },
        { type: 'done', usage: { inputTokens: 10, outputTokens: 4 } },
      ],
      textOnlyScript('Done.'),
    ],
    context,
  );

  const round1Messages = callMessages[2];
  const firstToolMessage = round1Messages.find(
    m => m.role === 'assistant' && m.toolCalls?.[0]?.id === 'call_1',
  );
  const secondToolMessage = round1Messages.find(
    m => m.role === 'assistant' && m.toolCalls?.[0]?.id === 'call_2',
  );
  // Trimmed, not the raw streamed slice with its trailing space: per-tool-call slices are now
  // trimmed before being attributed (a later, deliberate fix — a whitespace-padded/whitespace-
  // only content string is a 400 on the Anthropic API).
  assert.equal(firstToolMessage?.content, 'First, checking SCA.');
  assert.equal(secondToolMessage?.content, 'Now checking a second thing.');
});

test('orchestrate: a round that streams only whitespace before its tool_call produces content: "" in history, never a whitespace string', async () => {
  // Models routinely emit a bare priming newline run ("\n\n") right before a tool call. If the
  // slice (`roundText.slice(roundTextConsumed)`) carried that whitespace straight into the
  // assistant message's `content`, anthropic.ts would push any truthy `content` as a `text`
  // block -- Anthropic's Messages API 400s on a whitespace-only text block. Trimming the slice
  // pins the orchestration-level contract the adapter relies on: whitespace-only round text must
  // become an empty string, not survive as "\n\n".
  const { context } = scaContext();
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      [
        { type: 'delta', content: '\n\n' },
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
      textOnlyScript('CIS Ubuntu: 95 passed, 102 failed, 10 N/A.'),
    ],
    context,
  );

  const round1Messages = callMessages[2];
  const toolCallMessage = round1Messages.find(
    message =>
      message.role === 'assistant' &&
      message.toolCalls?.[0]?.id === 'call_sca_results',
  );
  assert.ok(toolCallMessage);
  assert.equal(
    toolCallMessage?.content,
    '',
    'whitespace-only round text preceding a tool_call must be trimmed to an empty string, not ' +
      'passed through as "\\n\\n"',
  );
});

// --- orchestrate: round-tail narration -- text streamed AFTER a round's LAST tool_call ---------

test("orchestrate: text streamed AFTER a round's last tool_call is carried into history as its own assistant message", async () => {
  // Narration attribution (`roundTextConsumed` slicing) only covers text that arrives BEFORE
  // each tool_call. Text streamed after the LAST tool_call of a round -- before that round's
  // `done` -- must not be silently dropped: the 'done' handler for a tool-bearing round
  // accumulates usage and breaks to the next round, so trailing narration needs its own capture.
  const { context } = scaContext();
  const { callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_sca_results',
            name: 'get_sca_results',
            arguments: { agent_id: '001' },
          },
        },
        { type: 'delta', content: 'That query is running now.' },
        { type: 'done', usage: { inputTokens: 20, outputTokens: 10 } },
      ],
      textOnlyScript('CIS Ubuntu: 95 passed, 102 failed, 10 N/A.'),
    ],
    context,
  );

  const round1Messages = callMessages[2];
  const tailMessage = round1Messages.find(
    message =>
      message.role === 'assistant' &&
      !message.toolCalls?.length &&
      message.content === 'That query is running now.',
  );
  assert.ok(
    tailMessage,
    "text streamed after a round's last tool_call must be appended to history as its own " +
      'assistant message, not silently dropped',
  );
});

// --- orchestrate: main end-to-end case -- FAILS ON BASE -----------------------------------------
//
// A round only becomes final once the budget (BASE_BUDGET_UNITS = 6) is spent or the futility
// stop fires -- and this scenario's first two real tool calls (get_sca_results cost 1,
// get_sca_checks cost 2 -- see registry.ts's `getToolCostClass`) only spend 3, leaving budget
// remaining. A THIRD round -- the model re-running get_sca_results with the SAME arguments -- is
// added so the scenario also exercises the futility stop's "duplicate of a previous round's
// identical query" trigger (chat.ts's `isRoundFutile`): that duplicate is what makes round 4 the
// genuinely final one, not a bare round-count coincidence. The test proves deferred-offer
// interception and the final-round-answer instruction compose correctly, and that the budget
// mechanism recognizes a real stopping point instead of guessing from round count.

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
      // round 1: correct summary, then a deferred single-tool offer, no tool call, done. On base
      // this 'done' ends the turn right here.
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
      // round 3: the model re-runs get_sca_results with the IDENTICAL
      // arguments as round 0 -- a duplicate query, cost-budget-wise still charged (cost 1, running
      // total 1+2+1=4, still under BASE_BUDGET_UNITS=6) but flagged futile by `isRoundFutile`
      // (every successful call this round is a duplicate), which forces round 4 to be the final
      // (tools-off) round regardless of the 2 units of budget still nominally left.
      [
        {
          type: 'tool_call',
          toolCall: {
            id: 'call_sca_results_repeat',
            name: 'get_sca_results',
            arguments: { agent_id: '001' },
          },
        },
        { type: 'done', usage: { inputTokens: 15, outputTokens: 6 } },
      ],
      // round 4: final (no-tools) round closes out the answer.
      textOnlyScript(
        'The three highest-impact failed checks are SSH root login, password expiration, ' +
          'and (see table above).',
      ),
    ],
    context,
  );

  // On base: orchestrate yields 'done' immediately after round 1 (3 chatStream calls total:
  // stage1, round0, round1) -- this turn instead runs all 6 scripted calls.
  assert.equal(
    callMessages.length,
    6,
    'expected stage1 + 5 rounds (get_sca_results, the offer, the forced get_sca_checks, the ' +
      `duplicate get_sca_results, the final round) -- got ${callMessages.length} chatStream calls`,
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
  // Round 3 (the duplicate query, index 4) is an ordinary round, not a forced one -- 'auto'.
  assert.equal(callOptions[4]?.toolChoice, 'auto');

  // All three real tool calls actually ran (forwarded as tool_call StreamEvents with the
  // reversed/real args -- privacy is off in this test, so real args are the only form).
  const toolCallEvents = events.filter(
    (e): e is Extract<StreamEvent, { type: 'tool_call' }> =>
      e.type === 'tool_call',
  );
  assert.deepEqual(
    toolCallEvents.map(e => e.toolCall.name),
    ['get_sca_results', 'get_sca_checks', 'get_sca_results'],
  );

  // The final round's outbound messages still end with a final-round instruction, and the forced
  // round and the duplicate round -- both ordinary tool rounds, not the final one -- still carry
  // none; only the genuinely last (no-tools) round does.
  //
  // WHICH instruction depends on context: this turn IS the interception turn. Round 1 streamed a
  // complete answer to the screen and the deferred-offer interception extended the turn anyway,
  // so the final round is told to CONTINUE that answer instead of being told "Now answer the
  // user's question directly" -- being given the latter here would ship two complete answers.
  // The anti-fabrication grounding body is shared verbatim between the two instructions, asserted
  // below.
  const finalRoundMessages = callMessages[5];
  const lastMessage = finalRoundMessages[finalRoundMessages.length - 1];
  // 'user', not 'system' -- a system-role message is hoisted out of `messages` into the request's
  // top-level `system` field by providers/anthropic.ts, so it never reaches the conversation tail at
  // all. See withFinalRoundAnswerInstruction's doc comment.
  assert.equal(lastMessage.role, 'user');
  assert.equal(lastMessage.content, FINAL_ROUND_CONTINUATION_INSTRUCTION);
  assert.ok(
    (lastMessage.content as string).includes(
      'must come from the tool results already gathered in this conversation',
    ),
    'the final round lost the grounding clauses',
  );
  // And the FORCED round's outbound messages do NOT carry it (it is not the final round).
  const forcedRoundMessages = callMessages[3];
  assert.notEqual(
    forcedRoundMessages[forcedRoundMessages.length - 1].content,
    FINAL_ROUND_ANSWER_INSTRUCTION,
  );
  // Nor does the duplicate round's -- it is the round whose OWN futility forces the round AFTER
  // it, never itself.
  const duplicateRoundMessages = callMessages[4];
  assert.notEqual(
    duplicateRoundMessages[duplicateRoundMessages.length - 1].content,
    FINAL_ROUND_ANSWER_INSTRUCTION,
  );

  // The offer text the user already read is IN the forced round's, the duplicate round's, and the
  // final round's history: without it, later rounds are authored blind of the summary-plus-offer
  // on screen, and the turn ships two independently-authored summaries.
  const offerText =
    'CIS Ubuntu: 95 passed, 102 failed, 10 N/A. I can run get_sca_checks to list the ' +
    'failing checks — want me to?';
  const hasOfferMessage = (history: ChatMessage[]): boolean =>
    history.some(
      message => message.role === 'assistant' && message.content === offerText,
    );
  assert.ok(
    hasOfferMessage(callMessages[3]),
    "the forced round's history must carry the already-streamed offer text",
  );
  assert.ok(
    hasOfferMessage(callMessages[4]),
    "the duplicate round's history must carry the already-streamed offer text",
  );
  assert.ok(
    hasOfferMessage(callMessages[5]),
    "the final round's history must carry the already-streamed offer text",
  );
  assert.ok(
    !hasOfferMessage(callMessages[2]),
    'the offer round itself is authored before its own text exists',
  );
});

test('orchestrate: an unnamed offer is forced via the CHAIN_PAIRS metadata fallback', async () => {
  // Failure B's un-named shape: the offer never says "get_sca_checks" at all, so the name-based
  // gate above sees zero mentions -- only the metadata fallback (keyed by the last SUCCESSFUL
  // tool this turn, get_sca_results) can force this one.
  const { context } = scaContext();
  const { events, callMessages, callOptions } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
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
      offerScript(
        'CIS Ubuntu: 95 passed, 102 failed, 10 N/A. I can pull the specific failing checks if ' +
          'you would like.',
      ),
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
      textOnlyScript(
        'The three highest-impact failed checks are listed above.',
      ),
    ],
    context,
  );

  assert.equal(
    callMessages.length,
    5,
    'the un-named offer must still be forced into a chained get_sca_checks round',
  );
  assert.deepEqual(callOptions[3]?.toolChoice, { name: 'get_sca_checks' });
  const toolCallEvents = events.filter(
    (e): e is Extract<StreamEvent, { type: 'tool_call' }> =>
      e.type === 'tool_call',
  );
  assert.deepEqual(
    toolCallEvents.map(e => e.toolCall.name),
    ['get_sca_results', 'get_sca_checks'],
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: an unnamed offer on the LAST tool-bearing round is not forced (round budget respected)', async () => {
  // Same budget fence as the name-based path's own test, but for the metadata fallback: an
  // unnamed offer landing on the last tool-bearing round must not spend a round the budget does
  // not have. A script filled entirely with REJECTED_SEARCH_ROUND never sets
  // `lastSuccessfulToolName` (rejected calls never reach the executed/success site), so that
  // version of this test would pass identically even with the round-budget gate deleted -- it
  // never gives the fallback a chance to fire in the first place. The LAST filler round here is
  // instead a SUCCESSFUL get_sca_results call (a real CHAIN_PAIRS summary key), so the fallback
  // has a genuine chain to key off and the round-budget gate is what must stop it from firing.
  const { context } = scaContext();
  const fillerRounds = Array.from(
    { length: MAX_TOOL_ROUNDS - 2 },
    () => REJECTED_SEARCH_ROUND,
  );
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      ...fillerRounds,
      // The last tool-bearing round: a SUCCESSFUL get_sca_results call, so
      // `lastSuccessfulToolName` is genuinely set going into the offer round below.
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
      offerScript('I can pull the specific failing checks if you would like.'),
    ],
    context,
  );

  assert.equal(callMessages.length, MAX_TOOL_ROUNDS + 1);
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: an unnamed offer with no chained summary tool this turn is not forced', async () => {
  // No tool ran this turn at all (rejected call only), so `lastSuccessfulToolName` is never set --
  // the metadata fallback must not fire off a stale/absent summary tool.
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      offerScript('I can pull more detail if you would like.'),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    3,
    'no chained tool was successfully run this turn, so nothing should be forced',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: an offer to RETRY a rejected tool IS forced (a failed call must not immunize the tool)', async () => {
  // FAILS ON BASE and against this item's first cut: executedToolNames was populated on the
  // ATTEMPT, so one rejected call permanently immunized the tool and the reported failure shape
  // ("that call needs a policy_id -- I can retry, want me to?") terminated on the offer.
  const { events, callMessages, callOptions } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      // round 0: get_sca_results with NO arguments -- rejected by argument validation before any
      // cluster access (rejectingContext's sentinel would throw otherwise).
      REJECTED_SCA_RESULTS_ROUND,
      // round 1: the retry offer, naming the tool whose call was just rejected.
      offerScript(
        'That call needs an agent_id. I can retry get_sca_results with it — want me to?',
      ),
      // round 2 (forced): complies -- and is rejected again (still no cluster access needed).
      REJECTED_SCA_RESULTS_ROUND,
      // round 3: final (no-tools) round closes out.
      textOnlyScript('I could not retrieve the SCA summary for that agent.'),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    5,
    'the retry offer must be forced into a real retry round',
  );
  assert.deepEqual(callOptions[3]?.toolChoice, { name: 'get_sca_results' });
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

// --- orchestrate: forced-round failure must terminate no worse than base ------------------------
// Both FAIL against this item's first cut: the interception suppressed the offer round's clean
// 'done' and stashed nothing, so a forced-round provider error surfaced as an SSE error frame and
// a forced-round dead stream closed the SSE stream with no terminating frame at all -- on base the
// same turn ended cleanly right after the offer.

test('orchestrate: a provider ERROR on the forced round is swallowed into a clean done', async () => {
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      offerScript('I can run get_sca_checks — want me to?'),
      // round 2 (forced): the provider 400s/429s instead of complying.
      [{ type: 'error', message: 'upstream provider rejected the request' }],
    ],
    rejectingContext(),
  );

  assert.equal(callMessages.length, 4);
  assert.equal(
    events.filter(e => e.type === 'error').length,
    0,
    'a forced-round failure must not surface as an error frame the user never caused',
  );
  const doneEvents = events.filter(e => e.type === 'done');
  assert.equal(doneEvents.length, 1, 'the turn must still terminate cleanly');
});

test('orchestrate: a DEAD adapter stream on the forced round still emits a terminating done', async () => {
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      offerScript('I can run get_sca_checks — want me to?'),
      // round 2 (forced): the stream closes with no events at all.
      [],
    ],
    rejectingContext(),
  );

  assert.equal(callMessages.length, 4);
  const doneEvents = events.filter(e => e.type === 'done');
  assert.equal(
    doneEvents.length,
    1,
    'the SSE stream must not close without a terminating frame',
  );
});

// --- orchestrate: negative / regression fences --------------------------------------------------
// Each of these passes BOTH on base and with the interception enabled -- they exist to prove the
// mechanism does not over-fire. (The budget-gate/spent-flag test and
// the retry-offer test live under their own headers further down: those FAIL on base, because
// they assert a force that base never performs.)

test('orchestrate: an offer naming a SUCCESSFULLY-executed tool does not force a repeat call', async () => {
  // get_sca_results executes for real (scaContext's canned aggregation response), then the next
  // round OFFERS the same tool again. A succeeding tool is excluded by name -- the model is
  // summarizing its own work (or proposing a rerun this mechanism deliberately does not force,
  // see the executedToolNames add-site comment in chat.ts).
  const { context } = scaContext();
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
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
      offerScript(
        'CIS Ubuntu: 95 passed, 102 failed. I can run get_sca_results again — want me to?',
      ),
    ],
    context,
  );

  assert.equal(
    callMessages.length,
    3,
    'no forced 4th round should be introduced',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: a DISMISSIVE mention of an unexecuted tool does not force a call', async () => {
  // FENCE: prompts.ts's capability-honesty block pushes the model to
  // NAME what it could not check -- a negative mention ("would not answer this") must not be
  // hijacked into running the very tool the model ruled out. The sentence-level offer gate in
  // findOfferedFollowUpTool is what this pins.
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SEARCH_ROUND,
      offerScript(
        'get_sca_checks would not answer a vulnerability question, so I am reporting only ' +
          'what the search covered.',
      ),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    3,
    'a dismissive mention must terminate the turn normally, not force the dismissed tool',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: a reasoning-fallback round never triggers the interception', async () => {
  // FENCE: openai-compatible.ts's reasoningFallback surfaces raw
  // deliberation as one delta when a model streams only on the reasoning channel (gpt-oss/qwen3.x
  // -- the very model family in PROVIDER_CONFIG). Deliberation routinely names one tool the model
  // decided AGAINST; the flagged delta must disqualify the round from interception.
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      [
        {
          type: 'delta',
          content:
            'The user wants the failing checks; I can use get_sca_checks but I am not certain ' +
            'of the policy_id, so I will just summarize.',
          reasoningFallback: true,
        },
        { type: 'done', usage: { inputTokens: 15, outputTokens: 8 } },
      ],
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    3,
    'reasoning-channel deliberation must never be read as an offer',
  );
  assert.equal(events.filter(e => e.type === 'done').length, 1);
});

test('orchestrate: an offer naming search_wazuh_data (the escape hatch) is never forced', async () => {
  // FENCE: prompts.ts ORDERS the model to offer search_wazuh_data in
  // prose for fields a typed result lacks -- that designed behaviour must not become a forced
  // call into the strictest-guardrail surface (FORCE_EXEMPT_TOOL_NAMES in chat.ts).
  const { events, callMessages } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      offerScript(
        'The result does not include source IPs — I can query them with search_wazuh_data. ' +
          'Want me to?',
      ),
    ],
    rejectingContext(),
  );

  assert.equal(
    callMessages.length,
    3,
    'the prompt-mandated search_wazuh_data offer must terminate the turn normally',
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

// --- orchestrate: budget/spent-gate pin ----------------------------------------------------------
// NOTE: unlike the fences above, this test FAILS ON BASE — it asserts the one force that base
// never performs (callOptions[3].toolChoice) on its way to pinning that the SECOND offer is not
// forced.

test('orchestrate: a second offer after one force was already spent this turn does not force again', async () => {
  const { events, callMessages, callOptions } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      // round 1: offers get_sca_checks -- forces round 2.
      offerScript('I can run get_sca_checks — want me to?'),
      // round 2 (forced): instead of complying, the model offers a DIFFERENT unexecuted tool.
      // This fences `forcedFollowUpSpent` alone: every call in this script is rejected/offer-only,
      // so the cost budget never spends anything and never enters the picture -- see chat.ts's
      // `toolCallCostUnits` doc comment for why a validation-rejected call is free against that
      // budget -- unlike the main end-to-end test above, this scenario does not also need to
      // fence the round-budget gate.
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
