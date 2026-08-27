import assert from 'node:assert/strict';
import type { Logger } from '../../../../src/core/server';
import { runStage1Routing, Stage1Result } from './chat';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * Proves the wiring `chat-usage.test.ts` cannot: that `runStage1Routing`'s `Stage1Result.usage`
 * actually carries the stage-1 adapter call's `usage` out to `orchestrate`, rather than only
 * proving the pure accumulator (`addUsage`/`toStreamUsage`) sums correctly once given real
 * numbers. Stage 1 always ends in a forced tool call (`toolChoice: {name: 'route_question'}`), so
 * correctly reading the terminal usage frame after a `finish_reason: 'tool_calls'` exit matters
 * on every routed turn, not just an edge case.
 *
 * NOTE (needs the OSD tree to actually run): like chat-stream-limiter.test.ts, this file imports
 * `./chat`, which imports `@osd/config-schema` -- unresolvable outside the full wazuh-dashboard
 * checkout this repo is normally built against. Follows the same colocated-unit-test convention;
 * needs the platform runner (or CI) to actually execute.
 */

function fakeAdapter(events: StreamEvent[]): ProviderAdapter {
  return {
    async *chatStream(
      _config: ProviderConfig,
      _messages: ChatMessage[],
      _signal: AbortSignal,
      _options?: ChatStreamOptions,
    ): AsyncIterable<StreamEvent> {
      for (const event of events) {
        yield event;
      }
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
  { role: 'user', content: 'how many agents are active?' },
];

const NOOP_LOGGER = { debug: () => {} } as unknown as Logger;

async function runStage1(events: StreamEvent[]): Promise<Stage1Result> {
  const adapter = fakeAdapter(events);
  const controller = new AbortController();
  const gen = runStage1Routing(
    adapter,
    PROVIDER_CONFIG,
    INITIAL_MESSAGES,
    new Date().toISOString(),
    controller.signal,
    NOOP_LOGGER,
    undefined,
  );
  let step = await gen.next();
  // Generator steps are sequential by contract, same reasoning as chat.ts's own
  // stage-1-driving loop in `orchestrate`.
  while (!step.done) {
    // eslint-disable-next-line no-await-in-loop
    step = await gen.next();
  }
  return step.value;
}

test('runStage1Routing: threads the stage-1 call usage through to Stage1Result (tool_call then done+usage)', async () => {
  const result = await runStage1([
    {
      type: 'tool_call',
      toolCall: {
        id: 'call_1',
        name: ROUTE_QUESTION_TOOL.name,
        arguments: { categories: ['agents'] },
      },
    },
    { type: 'done', usage: { inputTokens: 760, outputTokens: 8 } },
  ]);
  assert.deepEqual(
    result.usage,
    { inputTokens: 760, outputTokens: 8 },
    'stage 1 always ends in a forced tool call -- its usage must still reach Stage1Result',
  );
  assert.ok(
    result.tools?.some(tool => tool.name === 'get_agents'),
    'sanity: the routed "agents" category must resolve to a non-empty tool list',
  );
});

test('runStage1Routing: a done with no usage (adapter never reported any) resolves usage: undefined, not a crash', async () => {
  const result = await runStage1([
    {
      type: 'tool_call',
      toolCall: {
        id: 'call_1',
        name: ROUTE_QUESTION_TOOL.name,
        arguments: { categories: ['agents'] },
      },
    },
    { type: 'done' },
  ]);
  assert.equal(
    result.usage,
    undefined,
    'no usage reported by the adapter must surface as undefined, not 0 or a thrown error',
  );
});

test('runStage1Routing: usage is still captured on the no-route_question fallback path (full-catalog degrade)', async () => {
  // No tool_call at all this stream -- the model never called route_question. This still hits a
  // 'done' with usage before the fallback-to-full-catalog return; that spend must not be
  // discarded just because the fallback path is taken (see Stage1Result.usage's doc comment).
  const result = await runStage1([
    { type: 'done', usage: { inputTokens: 300, outputTokens: 5 } },
  ]);
  assert.deepEqual(
    result.usage,
    { inputTokens: 300, outputTokens: 5 },
    'the call still happened and cost tokens even though route_question was never invoked',
  );
});
