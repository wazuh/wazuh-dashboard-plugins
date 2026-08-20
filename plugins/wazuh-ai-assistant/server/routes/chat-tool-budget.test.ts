import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  BASE_BUDGET_UNITS,
  extractEnumeratedTargets,
  FINAL_ROUND_ANSWER_INSTRUCTION,
  HARD_CEILING_UNITS,
  isRoundFutile,
  MAX_TOOL_ROUNDS,
  noTextFallbackMessage,
  orchestrate,
  shouldGrantBudgetExtension,
  toolCallCostUnits,
} from './chat';
import { getToolCostClass } from '../tools/registry';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * Workstream C -- the tool-round COST BUDGET redesign (replaces the old fixed
 * `MAX_TOOL_ROUNDS = 3` count with cost-unit accounting; see chat.ts's `BASE_BUDGET_UNITS`,
 * `HARD_CEILING_UNITS`, `toolCallCostUnits`, `isRoundFutile`, `extractEnumeratedTargets`, and
 * `shouldGrantBudgetExtension` doc comments for the full design). This file pins the pure pieces
 * of that mechanism plus one full end-to-end "budget stress" scenario (the CV-069 battery item:
 * a 5-agent SCA sweep that must complete without ever asking the user to continue).
 *
 * NOTE (needs the OSD tree to actually run): like every other chat-*.test.ts file here, this
 * imports `./chat`, which imports `@osd/config-schema` -- unresolvable outside the full
 * wazuh-dashboard checkout this repo is normally built against. Same colocated-unit-test
 * convention; CI runs it under the platform runner.
 */

// --- cost classification: registry-level ---------------------------------------------------

test('getToolCostClass: aggregation-only tools (size:0, no hit documents) are class 1', () => {
  for (const name of [
    'get_top_rules',
    'get_top_agents',
    'get_security_summary',
    'get_mitre_summary',
    'get_compliance_summary',
    'get_sca_results',
    // ADAPTATION (branch 8998): 'get_field_values' is workstream B's tool
    // (enhancement/8997-ai-assistant-data-coverage-wave) and does not exist on this branch's
    // registry -- dropped from this list; see this file's header note.
  ]) {
    assert.equal(getToolCostClass(name), 1, `${name} should be cost class 1`);
  }
});

test('getToolCostClass: the escape hatch (search_wazuh_data) is class 3', () => {
  assert.equal(getToolCostClass('search_wazuh_data'), 3);
});

test('getToolCostClass: an ordinary typed hits tool defaults to class 2', () => {
  for (const name of [
    'get_agents',
    'get_critical_findings',
    'search_findings_by_agent',
    'get_sca_checks',
    'get_vulnerabilities',
    'get_agent_inventory',
  ]) {
    assert.equal(getToolCostClass(name), 2, `${name} should default to class 2`);
  }
});

test('getToolCostClass: an unknown/pseudo-tool name (never executed via executeToolCall) still defaults to 2, never throws', () => {
  assert.equal(getToolCostClass(ROUTE_QUESTION_TOOL.name), 2);
  assert.equal(getToolCostClass('suggest_discover_query'), 2);
  assert.equal(getToolCostClass('totally_unknown_tool_name'), 2);
});

// --- toolCallCostUnits: charged only on success ---------------------------------------------

test('toolCallCostUnits: a rejected/errored call costs 0 regardless of its class', () => {
  assert.equal(toolCallCostUnits('search_wazuh_data', false), 0);
  assert.equal(toolCallCostUnits('get_top_rules', false), 0);
  assert.equal(toolCallCostUnits('get_agents', false), 0);
});

test('toolCallCostUnits: a successful call costs exactly its registry class', () => {
  assert.equal(toolCallCostUnits('get_top_rules', true), 1);
  assert.equal(toolCallCostUnits('get_agents', true), 2);
  assert.equal(toolCallCostUnits('search_wazuh_data', true), 3);
});

// --- isRoundFutile: the early futility stop (product design item 4) ------------------------

test('isRoundFutile: no successful calls this round -- not this mechanism's concern (returns false)', () => {
  // An all-rejected round is #8911's (shouldEnterFinalRoundEarly) territory, never this one's --
  // see the function's own doc comment for why the two must not overlap.
  assert.equal(isRoundFutile([]), false);
});

test('isRoundFutile: every successful call returned zero rows -- futile', () => {
  assert.equal(
    isRoundFutile([
      { hadRows: false, isDuplicate: false },
      { hadRows: false, isDuplicate: false },
    ]),
    true,
  );
});

test('isRoundFutile: every successful call was a duplicate of an earlier query -- futile even with rows', () => {
  assert.equal(
    isRoundFutile([{ hadRows: true, isDuplicate: true }]),
    true,
  );
});

test('isRoundFutile: at least one successful call had new, non-duplicate rows -- not futile', () => {
  assert.equal(
    isRoundFutile([
      { hadRows: false, isDuplicate: false },
      { hadRows: true, isDuplicate: false },
    ]),
    false,
  );
});

// --- extractEnumeratedTargets: the enumerable-remaining heuristic ---------------------------

test('extractEnumeratedTargets: an explicit comma-separated agent list is detected', () => {
  assert.deepEqual(
    extractEnumeratedTargets(
      'Please run the SCA hardening check for agents 001, 002, 003, 004 and 005.',
    ),
    ['001', '002', '003', '004', '005'],
  );
});

test('extractEnumeratedTargets: a host list with the "and" conjunction is detected', () => {
  assert.deepEqual(
    extractEnumeratedTargets('Check hosts web-01, web-02 and db-01 for FIM drift.'),
    ['web-01', 'web-02', 'db-01'],
  );
});

test('extractEnumeratedTargets: a single named agent (no list) is NOT enumerable', () => {
  assert.equal(
    extractEnumeratedTargets('What SCA checks are failing on agent 001?'),
    undefined,
  );
});

test('extractEnumeratedTargets: a range expression is NOT detected (documented scope limit)', () => {
  // Deliberately out of scope -- see the function's doc comment: this heuristic only reads an
  // explicit literal, comma/"and"-separated list, never a range.
  assert.equal(
    extractEnumeratedTargets('Check agents 001-010 for compliance drift.'),
    undefined,
  );
});

test('extractEnumeratedTargets: no cue word at all is NOT enumerable', () => {
  assert.equal(
    extractEnumeratedTargets('Summarize critical findings from the last 24 hours.'),
    undefined,
  );
});

// --- shouldGrantBudgetExtension: the silent-extension gate (product design item 3) ----------

const ENUMERATED = ['001', '002', '003', '004', '005'];

test('shouldGrantBudgetExtension: granted -- new info, enumerable, partially covered, ceiling not yet raised', () => {
  assert.equal(
    shouldGrantBudgetExtension({
      roundHadNewInfo: true,
      enumeratedTargets: ENUMERATED,
      coveredTargets: new Set(['001', '002', '003']),
      currentCeiling: BASE_BUDGET_UNITS,
    }),
    true,
  );
});

test('shouldGrantBudgetExtension: denied -- the finishing round produced no new information', () => {
  assert.equal(
    shouldGrantBudgetExtension({
      roundHadNewInfo: false,
      enumeratedTargets: ENUMERATED,
      coveredTargets: new Set(['001', '002', '003']),
      currentCeiling: BASE_BUDGET_UNITS,
    }),
    false,
  );
});

test('shouldGrantBudgetExtension: denied -- not confidently enumerable (no list found)', () => {
  assert.equal(
    shouldGrantBudgetExtension({
      roundHadNewInfo: true,
      enumeratedTargets: undefined,
      coveredTargets: new Set(),
      currentCeiling: BASE_BUDGET_UNITS,
    }),
    false,
  );
});

test('shouldGrantBudgetExtension: denied -- zero targets covered yet (nothing proves this IS the sweep)', () => {
  assert.equal(
    shouldGrantBudgetExtension({
      roundHadNewInfo: true,
      enumeratedTargets: ENUMERATED,
      coveredTargets: new Set(),
      currentCeiling: BASE_BUDGET_UNITS,
    }),
    false,
  );
});

test('shouldGrantBudgetExtension: denied -- every target already covered (nothing left to extend for)', () => {
  assert.equal(
    shouldGrantBudgetExtension({
      roundHadNewInfo: true,
      enumeratedTargets: ENUMERATED,
      coveredTargets: new Set(ENUMERATED),
      currentCeiling: BASE_BUDGET_UNITS,
    }),
    false,
  );
});

test('shouldGrantBudgetExtension: HARD CEILING is absolute -- denied once already at it, no exceptions', () => {
  assert.equal(
    shouldGrantBudgetExtension({
      roundHadNewInfo: true,
      enumeratedTargets: ENUMERATED,
      coveredTargets: new Set(['001']),
      currentCeiling: HARD_CEILING_UNITS,
    }),
    false,
  );
});

test('HARD_CEILING_UNITS is exactly 3x BASE_BUDGET_UNITS', () => {
  assert.equal(HARD_CEILING_UNITS, BASE_BUDGET_UNITS * 3);
});

test('MAX_TOOL_ROUNDS is a structural backstop, deliberately independent of the cost budget', () => {
  // MAX_TOOL_ROUNDS (8) is NOT sized to guarantee the hard ceiling (18) is reachable -- it exists
  // to bound a PATHOLOGICAL loop of free (cost-0, rejected/errored) calls, which never spends the
  // cost budget at all (see BASE_BUDGET_UNITS's doc comment). A turn doing genuine cost-2 work can
  // hit this round cap before HARD_CEILING_UNITS is spent (8 rounds x 2 units = 16 < 18) -- that is
  // an accepted, deliberate tradeoff of "e.g. 8" per the product design, not a bug; this test just
  // pins the constants so a future edit to either one is a conscious choice.
  assert.equal(MAX_TOOL_ROUNDS, 8);
  assert.ok(MAX_TOOL_ROUNDS * 2 < HARD_CEILING_UNITS);
});

// --- mechanism silence: no user-visible string ever names the internal cost-budget machinery -

test('mechanism silence: every no-text fallback message is free of round/budget/limit/unit wording', () => {
  const messages = [
    noTextFallbackMessage(false, false, false),
    noTextFallbackMessage(true, false, false),
    noTextFallbackMessage(true, true, false),
    noTextFallbackMessage(true, true, true),
    noTextFallbackMessage(true, false, true),
  ];
  for (const message of messages) {
    assert.doesNotMatch(
      message,
      /\b(round|budget|limit|unit|threshold|quota|cost)\b/i,
      `fallback copy leaked internal mechanism wording: ${message}`,
    );
  }
});

test('mechanism silence: FINAL_ROUND_ANSWER_INSTRUCTION never names the internal mechanism, even while asking for a coverage statement', () => {
  assert.doesNotMatch(
    FINAL_ROUND_ANSWER_INSTRUCTION,
    /\b(round|budget|limit|unit|threshold|quota|cost)\b/i,
  );
  // And the coverage-statement clause (product design item 5) is actually present.
  assert.match(FINAL_ROUND_ANSWER_INSTRUCTION, /do and do not cover/i);
});

// --- CV-069 budget-stress battery item: a 5-agent SCA sweep completes without user interaction

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
            `scriptedAdapter: chatStream called more times (${callIndex}) than scripts ` +
              `provided (${scripts.length}) -- add another script entry for this test.`,
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

const NOOP_LOGGER = {
  debug: () => {},
  error: () => {},
} as unknown as Logger;

const NOOP_REQUEST = {} as unknown as OpenSearchDashboardsRequest;

/** One SCA-failing-checks row per agent -- enough for `outcome.tableEvent.spec.rows.length > 0`
 * (`hadRows`) on every call, so the sweep's progress is genuine, never a 0-row grind. */
function scaChecksContext(agentIds: string[]): RequestHandlerContext {
  let callIndex = 0;
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: () => {
              const agentId = agentIds[callIndex] ?? agentIds[agentIds.length - 1];
              callIndex += 1;
              return Promise.resolve({
                body: {
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
                          agent: { id: agentId },
                        },
                      },
                    ],
                    total: { value: 1 },
                  },
                  aggregations: {
                    results: { buckets: [{ key: 'Failed', doc_count: 1 }] },
                  },
                },
              });
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
}

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

function scaCheckCallScript(id: string, agentId: string): StreamEvent[] {
  return [
    {
      type: 'tool_call',
      toolCall: {
        id,
        name: 'get_sca_checks',
        // policy_id is required by get_sca_checks' own argument validation (catalog/
        // get-sca-checks.ts) -- omitting it would reject the call before it ever reaches the
        // (mocked) backend, which would make every round in this sweep cost 0 and never exercise
        // the budget extension this test exists to prove.
        arguments: {
          agent_id: agentId,
          policy_id: 'cis_ubuntu_2004',
          result: 'failed',
        },
      },
    },
    { type: 'done', usage: { inputTokens: 20, outputTokens: 8 } },
  ];
}

function textOnlyScript(text: string): StreamEvent[] {
  return [
    { type: 'delta', content: text },
    { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
  ];
}

test('CV-069 budget stress: a 5-agent SCA sweep spends past the base budget via silent extension and completes without any user interaction', async () => {
  // get_sca_checks is cost class 2 (default) -- 5 successful calls cost 10 units total, which
  // exceeds BASE_BUDGET_UNITS (6) but stays comfortably under HARD_CEILING_UNITS (18). The user's
  // first message lists the 5 agent ids explicitly, so `extractEnumeratedTargets` finds them, and
  // each successful call's `agent_id` argument covers one more of them -- exactly the shape
  // `shouldGrantBudgetExtension` is built to recognize.
  const agentIds = ['001', '002', '003', '004', '005'];
  const initialMessages: ChatMessage[] = [
    {
      role: 'user',
      content:
        `List the failing SCA hardening checks for agents ${agentIds.join(', ')}.`,
    },
  ];

  const scripts: StreamEvent[][] = [
    STAGE1_SCA_SCRIPT,
    ...agentIds.map((agentId, i) =>
      scaCheckCallScript(`call_${i}`, agentId),
    ),
    textOnlyScript(
      'Agents 001-005 each have at least one failing SCA check (SSH root login enabled); ' +
        'see the tables above for detail.',
    ),
  ];

  const { adapter, callMessages } = scriptedAdapter(scripts);
  const controller = new AbortController();
  const events: StreamEvent[] = [];
  for await (const event of orchestrate(
    adapter,
    PROVIDER_CONFIG,
    initialMessages,
    new Date().toISOString(),
    controller.signal,
    scaChecksContext(agentIds),
    NOOP_REQUEST,
    NOOP_LOGGER,
    undefined,
  )) {
    events.push(event);
  }

  // Every scripted call was consumed: stage1 + 5 sweep rounds + the final text round, with NO
  // clarifying question or early termination in between -- the silent extension is what makes
  // this possible; without it, the base budget (6) would force a tools-off final round after the
  // 3rd agent (cost 2 x 3 = 6) and the sweep would end incomplete.
  assert.equal(callMessages.length, scripts.length);

  const toolCallEvents = events.filter(
    (e): e is Extract<StreamEvent, { type: 'tool_call' }> =>
      e.type === 'tool_call',
  );
  assert.deepEqual(
    toolCallEvents.map(e => e.toolCall.arguments.agent_id),
    agentIds,
    'every listed agent must actually have been queried, in order',
  );

  // Exactly one 'done' event -- the turn never asked the user to continue or confirm anything;
  // it drove the whole sweep to completion on its own.
  assert.equal(events.filter(e => e.type === 'done').length, 1);
  assert.equal(events.filter(e => e.type === 'error').length, 0);

  // No user-visible text anywhere in the turn names the internal mechanism.
  const deltaText = events
    .filter((e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta')
    .map(e => e.content)
    .join('');
  assert.doesNotMatch(deltaText, /\b(round|budget|limit|unit|threshold|quota)\b/i);
});
