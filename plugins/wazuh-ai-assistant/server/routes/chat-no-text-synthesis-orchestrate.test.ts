import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { orchestrate } from './chat';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * FORCED SYNTHESIS (measured design) -- orchestrate-LEVEL gating: proves the retry fires only
 * for the exact `toolUsedThisTurn && sawNonEmptyTable` case, through the REAL `orchestrate` loop
 * (not a reimplementation), same harness pattern as chat-capability-honesty.test.ts /
 * chat-tool-chaining.test.ts. The mechanism's own contract (scrub pipeline, deterministic
 * fallback, hard bounds) is unit-tested directly against `synthesizeNoTextFallback` in
 * chat-no-text-synthesis.test.ts; this file only exercises the GATE that decides whether it runs
 * at all.
 *
 * NOTE (needs the OSD tree to actually run): imports `./chat`, which imports
 * `@osd/config-schema` -- unresolvable outside the full wazuh-dashboard checkout this repo is
 * normally built against. Same colocated-unit-test convention as every other chat-*.test.ts file.
 */

function scriptedAdapter(scripts: StreamEvent[][]): {
  adapter: ProviderAdapter;
  callOptions: (ChatStreamOptions | undefined)[];
} {
  let callIndex = 0;
  const callOptions: (ChatStreamOptions | undefined)[] = [];
  return {
    callOptions,
    adapter: {
      async *chatStream(
        _config: ProviderConfig,
        _messages: ChatMessage[],
        _signal: AbortSignal,
        options?: ChatStreamOptions,
      ): AsyncIterable<StreamEvent> {
        callOptions.push(options);
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

const INITIAL_MESSAGES: ChatMessage[] = [
  { role: 'user', content: 'what changed on agent 001 in the last week?' },
];

const NOOP_LOGGER = {
  debug: () => {},
  error: () => {},
} as unknown as Logger;

const NOOP_REQUEST = {} as unknown as OpenSearchDashboardsRequest;

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

/** A round that calls `search_wazuh_data` with well-formed arguments and no narration. */
const SEARCH_TOOL_CALL_ROUND: StreamEvent[] = [
  {
    type: 'tool_call',
    toolCall: {
      id: 'call_1',
      name: 'search_wazuh_data',
      arguments: {
        index_pattern: 'wazuh-findings-v5-*',
        query_dsl: JSON.stringify({
          query: {
            bool: {
              filter: [
                { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
              ],
            },
          },
          size: 20,
        }),
      },
    },
  },
  { type: 'done', usage: { inputTokens: 20, outputTokens: 5 } },
];

/** A round that ends with NO delta text and NO tool call -- the exact live failure's shape. */
const NO_TEXT_ROUND: StreamEvent[] = [
  { type: 'done', usage: { inputTokens: 10, outputTokens: 0 } },
];

/** search_wazuh_data's mocked OpenSearch response, with `hitCount` controlling whether the
 * resulting table (and `sawNonEmptyTable`) is empty or not. */
function fakeSearchContext(hitCount: number): RequestHandlerContext {
  const hits =
    hitCount > 0
      ? [
          {
            _source: {
              '@timestamp': '2026-08-10T00:00:00Z',
              'wazuh.rule.title': 'test rule',
            },
          },
        ]
      : [];
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: () =>
              Promise.resolve({
                body: { hits: { hits, total: { value: hitCount } } },
              }),
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
}

async function runOrchestrate(
  scripts: StreamEvent[][],
  context: RequestHandlerContext,
): Promise<{
  events: StreamEvent[];
  callCount: number;
  callOptions: (ChatStreamOptions | undefined)[];
}> {
  const { adapter, callOptions } = scriptedAdapter(scripts);
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
  return { events, callCount: callOptions.length, callOptions };
}

function deltaText(events: StreamEvent[]): string {
  return events
    .filter(
      (e): e is Extract<StreamEvent, { type: 'delta' }> => e.type === 'delta',
    )
    .map(e => e.content)
    .join('');
}

// --- the exact-condition gate -------------------------------------------------------------------

test('orchestrate: a tool ran and produced a non-empty table with no narration -> ONE extra retry call, no tools offered', async () => {
  const retryScript: StreamEvent[] = [
    {
      type: 'delta',
      content: 'The search returned 1 matching event from the last week.',
    },
    { type: 'done', usage: { inputTokens: 30, outputTokens: 12 } },
  ];
  const { events, callCount, callOptions } = await runOrchestrate(
    [STAGE1_SCRIPT, SEARCH_TOOL_CALL_ROUND, NO_TEXT_ROUND, retryScript],
    fakeSearchContext(1),
  );

  assert.equal(
    callCount,
    4,
    'stage1 + the tool round + the no-text round + exactly one retry call',
  );
  assert.deepEqual(
    callOptions[3],
    {},
    'the retry call offers no tools -- it cannot re-enter the tool loop',
  );

  const text = deltaText(events);
  assert.match(text, /The search returned 1 matching event/);
  assert.doesNotMatch(
    text,
    /No additional analysis/,
    'the layout-lying fallback must never reach the client for this case',
  );

  const doneEvent = events.find(
    (e): e is Extract<StreamEvent, { type: 'done' }> => e.type === 'done',
  );
  assert.ok(doneEvent);
  // Usage is the SUM of every call this turn made, including the retry's.
  assert.deepEqual(doneEvent.usage, { inputTokens: 110, outputTokens: 22 });
});

test('orchestrate: no tool ran this turn -> NO_ANSWER_MESSAGE, unaffected, no extra retry call', async () => {
  const { events, callCount } = await runOrchestrate(
    [STAGE1_SCRIPT, NO_TEXT_ROUND],
    fakeSearchContext(0),
  );

  assert.equal(callCount, 2, 'no extra retry call is ever attempted');
  const text = deltaText(events);
  assert.equal(
    text,
    'I was not able to come up with an answer for that. Try rephrasing your question.',
  );
});

test('orchestrate: a tool ran but returned zero rows -> NO_MATCHING_RESULTS_MESSAGE, unaffected, no extra retry call', async () => {
  const { events, callCount } = await runOrchestrate(
    [STAGE1_SCRIPT, SEARCH_TOOL_CALL_ROUND, NO_TEXT_ROUND],
    fakeSearchContext(0),
  );

  assert.equal(
    callCount,
    3,
    'no extra retry call: a genuinely empty result has nothing to synthesize',
  );
  const text = deltaText(events);
  // N1 fix (AI/plan/qa-battery-v31.md): the zero-row fallback is enriched with what was actually
  // searched (data domain + caller-supplied filters, derived from the last attempted tool call) --
  // see noTextFallbackMessage's `lastToolCall` param and buildNoMatchingResultsMessage. This test
  // predates that enrichment; it now asserts the enriched shape instead of the bare sentence.
  assert.match(text, /^No matching results were found for that query\./);
  assert.match(
    text,
    /\(Searched: wazuh data, filtered to index pattern wazuh-findings-v5-\*/,
  );
});

test('orchestrate: the forced-synthesis retry errors -> falls back to a truthful digest sentence, never the layout-lying copy', async () => {
  const erroringRetryScript: StreamEvent[] = [
    { type: 'error', message: 'upstream 500' },
  ];
  const { events, callCount } = await runOrchestrate(
    [STAGE1_SCRIPT, SEARCH_TOOL_CALL_ROUND, NO_TEXT_ROUND, erroringRetryScript],
    fakeSearchContext(1),
  );

  assert.equal(callCount, 4);
  const text = deltaText(events);
  assert.match(text, /returned 1 row/);
  assert.doesNotMatch(text, /No additional analysis/);
});
