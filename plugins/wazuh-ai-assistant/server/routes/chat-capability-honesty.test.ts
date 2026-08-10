import assert from 'node:assert/strict';
import type {
  Logger,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';
import { orchestrate } from './chat';
import { ROUTE_QUESTION_TOOL } from '../tools/router';
import { SUGGEST_DISCOVER_QUERY_TOOL } from '../tools/suggest-discover-query';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { ChatStreamOptions, ProviderAdapter } from '../providers/types';

/**
 * Issue #8920 item 9 -- the suggest_discover_query handoff-validation interception (chat.ts's
 * `SUGGEST_DISCOVER_QUERY_TOOL.name` branch, backed by suggest-discover-query.ts's
 * `SuggestedDslResolution`): an invented field name gets ONE bounded self-correction retry instead
 * of a silent strip, and any emitted `suggested_query` whose DSL actually lost field filters
 * carries a disclosure appended to its `reason` -- the emitted artifact can never silently promise
 * a filter it does not contain.
 *
 * Drives `orchestrate` directly with a scripted fake adapter, same pattern as
 * chat-stage1-usage.test.ts's `runStage1Routing` harness — one array of `StreamEvent`s per
 * expected `chatStream` call (stage 1's forced `route_question`, then one call per tool round),
 * and captures the OUTBOUND `messages` argument of each call so the test can inspect exactly what
 * the model would have read on its NEXT round -- this is the only way to observe a `role:'tool'`
 * message's content, since a suggest_discover_query tool error produces no `StreamEvent` of its
 * own.
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

// --- an unknown-fields handoff produces a tool error, not a suggested_query event --------------

test(
  'orchestrate: suggest_discover_query unknown field -> bounded tool error, not suggested_query',
  async () => {
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
    assert.match(parsed.error, /Rewrite the suggestion with fields that exist there/);
  },
);

// --- a SECOND unknown_fields failure this turn falls through to a disclosure-suffixed
// suggested_query -------------------------------------------------------------------------------

test(
  'orchestrate: a SECOND unknown_fields resolution emits stripped DSL + disclosure reason',
  async () => {
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
    assert.match(event.reason, /link opens with a time-range-only query\.\)$/);

    // First failure still produced a bounded tool error, not a second suggested_query.
    const firstFailureToolMessages = toolMessagesInCall(callMessages, 2);
    assert.equal(firstFailureToolMessages.length, 1);
    assert.match(
      JSON.parse(firstFailureToolMessages[0].content).error,
      /does not exist on/,
    );

    // Second failure's tool message is the 'shown:true' acknowledgment, not an error.
    const secondFailureToolMessages = toolMessagesInCall(callMessages, 3);
    assert.equal(secondFailureToolMessages.length, 1);
    const secondParsed = JSON.parse(secondFailureToolMessages[0].content);
    assert.equal(secondParsed.shown, true);
    assert.ok(
      !('error' in secondParsed),
      'the second failure is shown to the user (with the disclosure), not surfaced as an error',
    );
  },
);
