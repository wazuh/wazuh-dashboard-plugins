import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { MAX_CONSECUTIVE_REJECTED_ROUNDS, orchestrate } from './chat';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import {
  ChatMessage,
  ProviderConfig,
  StreamEvent,
  TurnStatusStep,
} from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * The progressive turn-status steps a turn emits (`StreamEvent`'s `status.step`), asserted as a
 * SEQUENCE rather than per-event.
 *
 * This asserts an ordering invariant: `writing` is only emitted at the end of the FINAL round,
 * decided by `willBeFinalRound` (chat.ts) — not at the end of every tool round, which would make a
 * turn running several rounds walk the label backwards ("Writing the answer…" then "Querying …"
 * again, once per round), reading as the assistant changing its mind rather than as progress.
 *
 * Same harness pattern and the same platform-runner caveat as
 * chat-capability-honesty.test.ts/chat-stage1-usage.test.ts: this file imports `./chat`, which
 * imports `@osd/config-schema`, so it needs the full wazuh-dashboard checkout to run.
 */

function scriptedAdapter(scripts: StreamEvent[][]): ProviderAdapter {
  let callIndex = 0;
  return {
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
          `scriptedAdapter: chatStream called more times (${callIndex}) than scripts provided ` +
            `(${scripts.length}) -- add another script entry for this test.`,
        );
      }
      for (const event of script) {
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

/** A tool call the argument validator rejects (no `query_dsl`), so the round runs a REAL tool call
 * — which is what gates the `writing` emission — without ever succeeding. */
const REJECTED_SEARCH_ROUND: StreamEvent[] = [
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

function fakeContext(): RequestHandlerContext {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            fieldCaps: () => Promise.resolve({ body: { fields: {} } }),
            search: () => {
              throw new Error('search must not be reached in this test');
            },
          },
        },
      },
    },
  } as unknown as RequestHandlerContext;
}

async function runOrchestrate(
  scripts: StreamEvent[][],
): Promise<StreamEvent[]> {
  const controller = new AbortController();
  const events: StreamEvent[] = [];
  for await (const event of orchestrate(
    scriptedAdapter(scripts),
    PROVIDER_CONFIG,
    [{ role: 'user', content: 'what ports are open on agent 001?' }],
    new Date().toISOString(),
    controller.signal,
    fakeContext(),
    NOOP_REQUEST,
    NOOP_LOGGER,
    undefined,
  )) {
    events.push(event);
  }
  return events;
}

/** Every emitted step, in emission order. */
function stepsOf(events: StreamEvent[]): TurnStatusStep[] {
  return events.flatMap(event =>
    event.type === 'status' && event.step ? [event.step] : [],
  );
}

const STEP_RANK: Record<TurnStatusStep, number> = {
  understanding: 0,
  querying: 1,
  writing: 2,
};

test('orchestrate: a multi-round turn never walks its status step backwards, and only says "writing" once', async () => {
  // Round count derived from the bound, not hardcoded: a literal array length would encode "the
  // bound is N" purely through array position, so a future change to the bound would silently
  // exercise a different round while this test kept passing.
  const fillerRounds = Array.from(
    { length: MAX_CONSECUTIVE_REJECTED_ROUNDS },
    () => REJECTED_SEARCH_ROUND,
  );
  const events = await runOrchestrate([
    STAGE1_SCRIPT,
    ...fillerRounds,
    [
      { type: 'delta', content: 'Could not determine that.' },
      { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
    ],
  ]);

  const steps = stepsOf(events);
  // Sanity: the turn really did run several tool rounds, so the ordering assertion below is
  // exercising the multi-round case rather than passing vacuously on a single-round turn.
  assert.ok(
    steps.filter(step => step === 'querying').length > 1,
    `expected more than one querying step, got ${JSON.stringify(steps)}`,
  );
  assert.equal(steps[0], 'understanding');
  for (let index = 1; index < steps.length; index += 1) {
    assert.ok(
      STEP_RANK[steps[index]] >= STEP_RANK[steps[index - 1]],
      `status step went backwards at index ${index}: ${JSON.stringify(steps)}`,
    );
  }
  assert.equal(
    steps.filter(step => step === 'writing').length,
    1,
    `expected exactly one writing step, got ${JSON.stringify(steps)}`,
  );
  assert.equal(steps[steps.length - 1], 'writing');
});

test('orchestrate: a turn that answers without calling any tool never claims to be querying or writing', async () => {
  // `writing` is gated on a round having run a real tool call: there is nothing to narrate the
  // results of, and the answer's own tokens are the only progress signal that turn needs.
  const events = await runOrchestrate([
    STAGE1_SCRIPT,
    [
      { type: 'delta', content: 'Six findings today.' },
      { type: 'done', usage: { inputTokens: 10, outputTokens: 5 } },
    ],
  ]);

  assert.deepEqual(stepsOf(events), ['understanding']);
});
