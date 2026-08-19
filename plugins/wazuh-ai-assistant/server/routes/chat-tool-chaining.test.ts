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
 * NOTE (running outside the OSD tree): imports `./chat`, which imports `@osd/config-schema` --
 * unresolvable outside the full wazuh-dashboard checkout this repo is normally built against.
 * Same colocated-unit-test convention as every other chat-*.test.ts file in this directory; CI
 * runs it under the platform runner. The #8935 integration pass ALSO executed this whole file
 * standalone (tsc-compiled, plain Node, `@osd/config-schema` stubbed -- route registration is
 * never invoked by these tests, so the stub is inert) against the real `orchestrate`: 27/27.
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
    // A THIRD response, same shape as the first -- used by the main end-to-end test's extra
    // duplicate get_sca_results round (workstream C: the cost-budget redesign's futility-stop
    // needs a repeated identical call to demonstrate the "duplicate query" trigger).
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
  // The sentence-level offer gate (integration review): a dismissive/negative mention must not
  // read as an offer. No OFFER_MARKER_RE marker anywhere in this text.
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
  // collapse to one candidate and be force-called -- integration review of the gate ordering.
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

// --- registry-wide coverage: nothing exempt by default (same standard as
// agg-size-coverage.test.ts / field-policy-coverage.test.ts) ------------------------------------

test('registry-wide coverage: EVERY catalog tool is detected when offered, named alone, and unexecuted — except the recorded exemption', () => {
  // Class-level guard for issue #8935 item I3: the detector must work identically for every
  // registered tool, not just the SCA pair the measured failure happened to name. Driven from the
  // REAL `listToolSpecs()` (not a hand-picked list) so a future catalog tool is covered
  // automatically -- the ONLY exemption is search_wazuh_data (FORCE_EXEMPT_TOOL_NAMES: prompts.ts
  // orders the model to offer it in prose, and it is the strictest-guardrail surface), asserted
  // here EXPLICITLY so the exemption list cannot silently grow. A tool whose name breaks the
  // `\bname\b` regex construction, or a detector that silently degraded to a hardcoded per-tool
  // allowlist instead of scanning the full offered list, fails this loop instead of shipping
  // unnoticed.
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
  // leans on tool names being a closed [a-z_]+ vocabulary; before this test no invariant enforced
  // that anywhere (integration review). A future dotted/uppercase/metacharacter name would break
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

// --- orchestrate: issue C4 -- a round's own narration must survive into the NEXT round's history
// instead of being discarded as `content: ''` on the assistant message that carries its tool_call
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
  // Adversarial-review finding: models routinely emit a bare priming newline run ("\n\n") right
  // before a tool call. The C4 slice (`roundText.slice(roundTextConsumed)`) used to carry that
  // whitespace straight into the assistant message's `content`, and anthropic.ts pushes any
  // truthy `content` as a `text` block -- Anthropic's Messages API 400s on a whitespace-only
  // text block. The fix trims the slice; this pins the orchestration-level contract the adapter
  // relies on: whitespace-only round text must become an empty string, not survive as "\n\n".
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
  // Residual gap flagged in adversarial review: the C4 fix only attributes narration that
  // arrives BEFORE each tool_call (`roundTextConsumed` slicing). Text streamed after the LAST
  // tool_call of a round -- before that round's `done` -- was still silently dropped, because the
  // 'done' handler for a tool-bearing round only accumulated usage and broke to the next round.
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
// WORKSTREAM C NOTE: under the old fixed `MAX_TOOL_ROUNDS = 3`, round index 3 was UNCONDITIONALLY
// final regardless of how much real tool work had happened. Under the cost-budget redesign, a
// round only becomes final once the budget (BASE_BUDGET_UNITS = 6) is spent or the futility stop
// fires -- and this scenario's first two real tool calls (get_sca_results cost 1, get_sca_checks
// cost 2 -- see registry.ts's `getToolCostClass`) only spend 3, leaving budget remaining. A THIRD
// round -- the model re-running get_sca_results with the SAME arguments -- is added so the
// scenario now also exercises the futility stop's "duplicate of a previous round's identical
// query" trigger (chat.ts's `isRoundFutile`): that duplicate is what makes round 4 the genuinely
// final one, not a bare round-count coincidence. This is the exact "update the script, keep what
// it proves" adjustment the redesign calls for -- the test still proves I3 (deferred-offer
// interception) and #8893 (final-round-answer instruction) compose correctly; it now ALSO proves
// the budget mechanism recognizes a real stopping point instead of guessing from round count.

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
      // round 3 (workstream C addition): the model re-runs get_sca_results with the IDENTICAL
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

  // #8893 pin: the final round's outbound messages still end with FINAL_ROUND_ANSWER_INSTRUCTION.
  // This must survive item I3 (and the budget redesign) unchanged -- the forced round and the
  // duplicate round are both normal tool rounds, not the final one, so neither carries the
  // instruction; only the genuinely last (no-tools) round does.
  const finalRoundMessages = callMessages[5];
  const lastMessage = finalRoundMessages[finalRoundMessages.length - 1];
  assert.equal(lastMessage.role, 'system');
  assert.equal(lastMessage.content, FINAL_ROUND_ANSWER_INSTRUCTION);
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
  // final round's history (integration review: without it, later rounds are authored blind of the
  // summary-plus-offer on screen, and the turn ships two independently-authored summaries).
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
// Each of these passes BOTH on base and after this change -- they exist to prove the mechanism
// does not over-fire, not to reproduce the measured defect. (The budget-gate/spent-flag test and
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
  // FENCE for integration-review hole: prompts.ts's capability-honesty block pushes the model to
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
  // FENCE for integration-review hole: openai-compatible.ts's reasoningFallback surfaces raw
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
  // FENCE for integration-review hole: prompts.ts ORDERS the model to offer search_wazuh_data in
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
// NOTE (integration review fixed the earlier mislabel): unlike the fences above, this test FAILS
// ON BASE — it asserts the one force that base never performs (callOptions[3].toolChoice) on its
// way to pinning that the SECOND offer is not forced.

test('orchestrate: a second offer after one force was already spent this turn does not force again', async () => {
  const { events, callMessages, callOptions } = await runOrchestrate(
    [
      STAGE1_SCA_SCRIPT,
      REJECTED_SCA_RESULTS_ROUND,
      // round 1: offers get_sca_checks -- forces round 2.
      offerScript('I can run get_sca_checks — want me to?'),
      // round 2 (forced): instead of complying, the model offers a DIFFERENT unexecuted tool.
      // This fences `forcedFollowUpSpent` alone (workstream C: every call in this script is
      // rejected/offer-only, so the cost budget never spends anything and never enters the
      // picture -- see chat.ts's `toolCallCostUnits` doc comment for why a validation-rejected
      // call is free against that budget) -- unlike the main end-to-end test above, this scenario
      // does not also need to fence the round-budget gate.
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

// --- orchestrate: BLOCKER FIX (backlog CV-039 + CV-017 residuals; ported from deploy commits ----
// --- 872704fd4 + ca142293c) -----------------------------------------------------------------------
//
// CV-039's live shape: the model narrates ONCE, early ("Let me check the SCA policy compliance
// for this agent"), then a LATER round in the same turn is rejected (a bad/missing parameter),
// which -- since an EARLIER round already succeeded -- forces the NEXT round to be the final
// (tools-off) round early (`shouldEnterFinalRoundEarly`). That forced-final round then ends with
// NO text and NO tool call. Before the CV-039 fix, `orchestrate` tracked "did the model ever
// produce text this turn" as a WHOLE-TURN flag (`sawAnyDelta`) that, once set by the FIRST round's
// narration, stayed `true` for the rest of the turn -- so the round that actually ends the turn
// (with a non-empty table already on screen and nothing else to say) skipped the no-text fallback
// entirely. Fixed by making the flag round-scoped (`roundSawAnyDelta`, reset every round).
//
// CV-017's live shape, layered on the same scenario: the rejected round is also the LAST call this
// turn attempted, so the fallback text must honestly say that specific, more targeted attempt
// never completed -- not just silently point at the earlier table (`describeErroredLastAttempt`,
// threaded through `noTextFallbackMessage`'s `sawNonEmptyTable === true` branch).

test(
  'orchestrate: a round that narrates early, then a later rejected round forces the final ' +
    'round early, which ends silently -> still gets closing text that both fires (CV-039) and ' +
    'names the last, unresolved attempt (CV-017)',
  async () => {
    const { context } = scaContext();
    const { events, callMessages } = await runOrchestrate(
      [
        STAGE1_SCA_SCRIPT,
        // round 0: narrates, THEN calls get_sca_results (real tool, succeeds against the canned
        // response) -- sets the whole-turn "saw text" state that used to mask everything below.
        [
          {
            type: 'delta',
            content: 'Let me check the SCA policy compliance for this agent.',
          },
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
        // round 1: get_sca_results called again, this time missing the required agent_id --
        // rejected by argument validation before any cluster access. Since round 0 already
        // succeeded, this forces round 2 to be the final (tools-off) round early
        // (`shouldEnterFinalRoundEarly`) instead of waiting for the full MAX_TOOL_ROUNDS budget.
        REJECTED_SCA_RESULTS_ROUND,
        // round 2 (forced final, no tools offered): ends with NO text and NO tool call -- the exact
        // "sweep ends silently" shape. This must still trigger the no-text fallback.
        [{ type: 'done', usage: { inputTokens: 5, outputTokens: 0 } }],
      ],
      context,
    );

    assert.equal(
      callMessages.length,
      4,
      'stage1 + the narrated success round + the rejected round + the forced-early final round',
    );

    const deltaEvents = events.filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    );
    const text = deltaEvents
      .map(e => e.content)
      .join('')
      .trim();
    assert.notEqual(
      text,
      'Let me check the SCA policy compliance for this agent.',
      'the turn must not end with ONLY the early narration and no closing text for the round that ' +
        'actually ended the turn',
    );
    assert.match(
      text,
      /analysis limit/i,
      'falls back to the truthful "see results above" copy once the forced-early final round ' +
        'ends silently (CV-039)',
    );
    assert.match(
      text,
      /did not complete/,
      'and admits the LAST, more specific attempt (the rejected get_sca_results retry) never ' +
        'completed, instead of silently standing in for it (CV-017)',
    );

    const doneEvents = events.filter(e => e.type === 'done');
    assert.equal(
      doneEvents.length,
      1,
      'the SSE stream must still close with exactly one terminating done frame',
    );
  },
);
