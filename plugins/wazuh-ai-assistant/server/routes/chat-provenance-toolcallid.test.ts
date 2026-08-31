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
 * Issue #9008 rework, end-to-end: `TableSpec.provenance` is populated in
 * server/tools/executor.ts (index/requestedRange/effectiveRange/clamped — pure facts about the
 * query it ran), and `toolCallId` is attached separately in this file's own `orchestrate` loop
 * (the one place the streaming tool call's own id is in scope). This test drives a real turn
 * through `orchestrate` end to end — stage-1 routing, the actual `get_critical_findings` call
 * against an over-90-day request, the final answer round — and asserts the yielded `table` event
 * carries BOTH: the server's clamp facts (blocker 1/2) and the producing call's id (blocker 3),
 * matching this same scenario's coverage at the executor level (executor.test.ts) and the
 * client-rendering level (message-bubble.test.tsx).
 */

const NOOP_LOGGER = { debug: () => {}, error: () => {} } as unknown as Logger;
const NOOP_REQUEST = {} as unknown as OpenSearchDashboardsRequest;

const PROVIDER_CONFIG: ProviderConfig = {
  id: 'p-1',
  name: 'test provider',
  type: 'openai_compatible',
  baseUrl: 'http://127.0.0.1:19999/v1',
  model: 'gpt-oss-120b',
};

function scriptedAdapter(scripts: StreamEvent[][]): {
  adapter: ProviderAdapter;
} {
  let callIndex = 0;
  return {
    adapter: {
      async *chatStream(
        _config: ProviderConfig,
        _messages: ChatMessage[],
        _signal: AbortSignal,
        _options?: ChatStreamOptions,
      ): AsyncIterable<StreamEvent> {
        const script = scripts[callIndex];
        callIndex += 1;
        if (!script) {
          throw new Error(
            `scriptedAdapter: chatStream called more times (${callIndex}) than scripts ` +
              `provided (${scripts.length}).`,
          );
        }
        for (const event of script) {
          yield event;
        }
      },
    },
  };
}

/** Same shape as executor.test.ts's `fakeSearchContext`: only
 * `context.core.opensearch.client.asCurrentUser.search` is read for a `get_critical_findings`
 * call. */
function fakeFindingsContext(): RequestHandlerContext {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: () =>
              Promise.resolve({
                body: {
                  hits: {
                    total: { value: 1 },
                    hits: [
                      {
                        _source: {
                          'wazuh.rule.level': 'critical',
                          '@timestamp': '2026-08-01T00:00:00.000Z',
                        },
                      },
                    ],
                  },
                },
              }),
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
}

test('orchestrate: a clamped get_critical_findings call yields a table event whose provenance carries BOTH the clamp facts and the producing call id', async () => {
  const scripts: StreamEvent[][] = [
    // Stage 1: routing round.
    [
      {
        type: 'tool_call',
        toolCall: {
          id: 'route_1',
          name: ROUTE_QUESTION_TOOL.name,
          arguments: { categories: ['findings'] },
        },
      },
      { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
    ],
    // Stage 2: the real call, requesting a 2-year lookback -- "now-2y" is not accepted by the
    // server's own `validateTimeBound` (only "now-N[dhm]" or ISO-8601); "now-720d" is the
    // reachable equivalent, same fixture as executor.test.ts's clamp coverage.
    [
      {
        type: 'tool_call',
        toolCall: {
          id: 'call_1',
          name: 'get_critical_findings',
          arguments: { time_range_gte: 'now-720d' },
        },
      },
      { type: 'done', usage: { inputTokens: 20, outputTokens: 8 } },
    ],
    // Final round: plain text answer, no further tool calls.
    [
      { type: 'delta', content: 'One critical finding in the capped window.' },
      { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
    ],
  ];

  const { adapter } = scriptedAdapter(scripts);
  const controller = new AbortController();
  const events: StreamEvent[] = [];
  for await (const event of orchestrate(
    adapter,
    PROVIDER_CONFIG,
    [{ role: 'user', content: 'Critical findings in the last 2 years?' }],
    new Date().toISOString(),
    controller.signal,
    fakeFindingsContext(),
    NOOP_REQUEST,
    NOOP_LOGGER,
    undefined,
  )) {
    events.push(event);
  }

  const tableEvent = events.find(
    (e): e is Extract<StreamEvent, { type: 'table' }> => e.type === 'table',
  );
  assert.ok(tableEvent, 'expected a table event for the successful call');

  const provenance = tableEvent!.spec.provenance;
  assert.ok(provenance, 'expected a provenance object on the table event');
  // Blocker 3: attributed to the exact call that produced it.
  assert.equal(provenance!.toolCallId, 'call_1');
  // Blockers 1/2: the server's own clamp facts, not a client-side guess.
  assert.equal(provenance!.clamped, true);
  assert.deepEqual(provenance!.requestedRange, {
    gte: 'now-720d',
    lte: 'now',
  });
  assert.ok(provenance!.effectiveRange);
  const spanMs =
    Date.parse(provenance!.effectiveRange!.lte) -
    Date.parse(provenance!.effectiveRange!.gte);
  assert.equal(spanMs, 90 * 24 * 60 * 60 * 1000);
});
