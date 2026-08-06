import assert from 'node:assert/strict';
import { OpenAiCompatibleAdapter } from './openai-compatible';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';

// Covers three fixes that all land on this adapter's request/response handling:
//  - the reasoning-channel fallback (issue 02-read-reasoning-delta.md): some reasoning models
//    (gpt-oss, qwen3.x) stream their entire answer on `delta.reasoning` instead of
//    `delta.content`, which this adapter previously discarded outright, producing a
//    billed-but-blank answer;
//  - the final-round tools/tool_choice omission (issue 03-tool-choice-none-final-round.md);
//  - the outbound `temperature` plumbing (issue 05-set-temperature-for-tool-calls.md).

function userMessage(content: string): ChatMessage {
  return { role: 'user', content };
}

const BASE_CONFIG: ProviderConfig = {
  id: 'oa-1',
  name: 'OpenAI-compatible',
  type: 'openai_compatible',
  // A literal loopback IP: no DNS resolution path is exercised (assertProviderUrlAllowed's
  // literal-IP branch is synchronous), so this test has no network dependency at all.
  baseUrl: 'http://127.0.0.1:19999/v1',
  model: 'gpt-oss-120b',
  apiKey: 'test-key',
};

/** Builds an SSE body out of raw JSON chunk objects, terminated with the `[DONE]` sentinel every
 * OpenAI-compatible provider sends — matches this adapter's `[DONE]`-exit path. */
function sseBody(chunks: Array<Record<string, unknown>>): string {
  return (
    chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('') +
    'data: [DONE]\n\n'
  );
}

async function drain(
  iterable: AsyncIterable<StreamEvent>,
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of iterable) {
    events.push(event);
  }
  return events;
}

function withFakeFetch<T>(
  responseBody: string,
  run: () => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    )) as unknown as typeof fetch;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

/** Same as withFakeFetch, but also captures every outbound request body -- needed to assert on
 * what the adapter actually sent (issue 03's final-round shape, issue 05's temperature). */
function withFakeFetchCapturingBody(
  responseBody: string,
  run: (capturedBodies: Array<Record<string, unknown>>) => Promise<unknown>,
): Promise<Array<Record<string, unknown>>> {
  const original = globalThis.fetch;
  const capturedBodies: Array<Record<string, unknown>> = [];
  globalThis.fetch = ((_url: string, init?: RequestInit) => {
    if (typeof init?.body === 'string') {
      capturedBodies.push(JSON.parse(init.body));
    }
    return Promise.resolve(
      new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    );
  }) as unknown as typeof fetch;
  // Resolves with the CAPTURED BODIES, not `run`'s own result: every caller writes
  // `const capturedBodies = await withFakeFetchCapturingBody(...)` and asserts on the outbound
  // request bodies. (An earlier version resolved with run()'s drained events instead, which made
  // all four body-shape assertions inspect StreamEvents -- caught by the first real jest run.)
  return run(capturedBodies)
    .then(() => capturedBodies)
    .finally(() => {
      globalThis.fetch = original;
    });
}

test('chatStream: a stream carrying only delta.reasoning (no delta.content at all) renders the accumulated reasoning as the answer', async () => {
  const body = sseBody([
    {
      choices: [
        { index: 0, delta: { reasoning: 'The', channel: 'analysis' } },
      ],
    },
    {
      choices: [
        {
          index: 0,
          delta: { reasoning: ' user asks about hosts.', channel: 'analysis' },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('what should I look at?')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
    'a reasoning-only stream must still surface non-empty text instead of an empty done',
  );
  assert.equal(
    (events[0] as { content: string }).content,
    'The user asks about hosts.',
  );
});

test('chatStream: a normal delta.content stream is unchanged (regression) — no reasoning text appended', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: { reasoning: 'thinking about it...', channel: 'analysis' },
        },
      ],
    },
    {
      choices: [{ index: 0, delta: { content: 'The cluster is healthy.' } }],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('status?')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
    'exactly one delta must reach the caller -- the reasoning text must not be appended',
  );
  assert.equal(
    (events[0] as { content: string }).content,
    'The cluster is healthy.',
    'must be the content delta only, never the reasoning text mixed in',
  );
});

test('chatStream: reasoning deltas followed by a tool call, closed only by [DONE] (no finish_reason, no content) -- must yield the tool call and NO delta text', async () => {
  // The hazard this guards against: a provider can close a tool round through the `[DONE]` exit
  // without ever sending `finish_reason: 'tool_calls'` (gpt-oss/Groq happens to send it, but
  // nothing in the wire format guarantees that). Reasoning routinely precedes a tool call on the
  // analysis channel, so `reasoningBuffer` is typically non-empty exactly when this happens --
  // without the `hadToolCalls` gate, that buffered chain-of-thought would be injected as if it
  // were the answer for what is actually a TOOL round with no answer due yet.
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            reasoning: 'I should check the agent list.',
            channel: 'analysis',
          },
        },
      ],
    },
    {
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                function: { name: 'get_agents', arguments: '{}' },
              },
            ],
          },
        },
      ],
    },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['tool_call', 'done'],
    "no delta event must be emitted -- the buffered reasoning must not leak into a tool round's answer text",
  );
});

test('chatStream: a stream with neither content nor reasoning still ends cleanly with just done (no phantom fallback text)', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: {} }] }]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(BASE_CONFIG, [userMessage('hi')], controller.signal),
    );
  });
  assert.deepEqual(events.map(event => event.type), ['done']);
});

// --- final-round tools/tool_choice omission (issue 03-tool-choice-none-final-round.md) --------
// chat.ts's orchestrate() now sends `{}` (no `tools` at all) instead of
// `{tools, toolChoice: 'none'}` on the final round, relying on this adapter's existing
// `if (options?.tools?.length)` guard to drop `tools`/`tool_choice` from the wire body for free.

test('chatStream: with no `tools` in options, the outbound body carries neither `tools` nor `tool_choice` (final-round shape)', async () => {
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'Done.' } }] },
  ]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('final answer please')],
        controller.signal,
        {},
      ),
    );
  });
  assert.equal(capturedBodies.length, 1);
  assert.ok(
    !('tools' in capturedBodies[0]),
    'tools must be entirely absent, not an empty array',
  );
  assert.ok(!('tool_choice' in capturedBodies[0]));
});

test('chatStream: with `tools` present, the outbound body still carries `tools` and `tool_choice` (regression)', async () => {
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'Done.' } }] },
  ]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
        {
          tools: [
            {
              name: 'get_agents',
              description: 'list agents',
              parameters: { type: 'object', properties: {} },
            },
          ],
          toolChoice: 'auto',
        },
      ),
    );
  });
  assert.equal(capturedBodies.length, 1);
  assert.ok('tools' in capturedBodies[0]);
  assert.equal(capturedBodies[0].tool_choice, 'auto');
});

// --- temperature plumbing (issue 05-set-temperature-for-tool-calls.md) ------------------------
// chat.ts sets 0 for the stage-1 router call and 0.2 on tool-bearing orchestrate rounds; this
// adapter's job is just to forward whatever is given, verbatim, including a literal 0.

test('chatStream: options.temperature is forwarded verbatim on the outbound body, including 0', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('route this')],
        controller.signal,
        { temperature: 0 },
      ),
    );
  });
  assert.equal(
    capturedBodies[0].temperature,
    0,
    'temperature: 0 must survive -- a truthiness check would silently drop it',
  );
});

test('chatStream: a tool-bearing request with temperature 0.2 carries it alongside tools', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
        {
          tools: [
            {
              name: 'get_agents',
              description: 'list agents',
              parameters: { type: 'object', properties: {} },
            },
          ],
          toolChoice: 'auto',
          temperature: 0.2,
        },
      ),
    );
  });
  assert.equal(capturedBodies[0].temperature, 0.2);
  assert.ok('tools' in capturedBodies[0]);
});

test('chatStream: omitting options.temperature leaves the field out of the body entirely (regression -- no default injected)', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  const capturedBodies = await withFakeFetchCapturingBody(body, async () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('plain chat, no options')],
        controller.signal,
      ),
    );
  });
  assert.ok(!('temperature' in capturedBodies[0]));
});

// --- terminal usage frame -----------------------------------------------------------------------
// The OpenAI streaming contract only sends the closing `usage` frame when `stream_options.
// include_usage` is requested. Groq sends it unprompted, so this adapter got away without asking
// for years; Amazon Bedrock's chat-completions endpoint does not, and every turn against it
// reported `usage: null`. Two separate guarantees are asserted, because the field alone is not
// enough -- the frame it unlocks arrives in a shape (empty `choices`) the per-choice handling has
// to survive.

test('chatStream: the outbound body always requests the terminal usage frame', async () => {
  const body = sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]);
  // Non-async callback: nothing to await here, it just returns drain()'s promise. The older
  // body-shape tests above spell this `async () =>` and trip `require-await` as a result.
  const capturedBodies = await withFakeFetchCapturingBody(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('plain chat')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    capturedBodies[0].stream_options,
    { include_usage: true },
    'without stream_options.include_usage, providers other than Groq never send a usage frame ' +
      'and token accounting reads blank',
  );
});

test('chatStream: a usage-only final frame (empty `choices`) is reported on the done event', async () => {
  // Exactly the shape `include_usage` produces: content frames, then a frame whose `choices` array
  // is EMPTY and which carries only `usage`. Values mirror a real observed router turn.
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'ok' } }] },
    { choices: [], usage: { prompt_tokens: 1281, completion_tokens: 636 } },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('count something')],
        controller.signal,
      ),
    );
  });
  const done = events.find(event => event.type === 'done');
  assert.ok(done, 'the stream must still terminate with a done event');
  assert.deepEqual(
    (done as Extract<StreamEvent, { type: 'done' }>).usage,
    { inputTokens: 1281, outputTokens: 636 },
    'an empty `choices` array must not stop the usage frame from being read',
  );
});

// --- terminal usage frame after a tool-call finish (issue 8875) --------------------------------
// The bug the previous two tests did not catch: `stream_options.include_usage` makes the terminal
// usage frame arrive as one more chunk AFTER the one carrying `finish_reason: 'tool_calls'`. The
// old code returned the moment it saw that finish_reason, discarding a bare `{type: 'done'}` with
// no usage and never reading the trailing frame at all -- so every tool-bearing round (and the
// stage-1 router call, which always ends in a tool call by construction) reported no usage,
// leaving only the turn's last, tool-free round for chat.ts's accumulator to sum. Fixed by letting
// the stream keep reading past `finish_reason: 'tool_calls'` instead of returning right there.

test('chatStream: a round that ends via finish_reason:"tool_calls" still reports the usage frame that follows it', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                function: { name: 'get_agents', arguments: '{}' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    },
    { choices: [], usage: { prompt_tokens: 812, completion_tokens: 41 } },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['tool_call', 'done'],
    'exactly one tool_call followed by one done -- the usage frame must not surface as its own event',
  );
  const done = events.find(event => event.type === 'done');
  assert.deepEqual(
    (done as Extract<StreamEvent, { type: 'done' }>).usage,
    { inputTokens: 812, outputTokens: 41 },
    'the usage frame arriving AFTER finish_reason:"tool_calls" must still reach the done event ' +
      '-- this is the exact defect issue 8875 describes',
  );
});

test('chatStream: a tool-call round with no trailing usage frame still terminates cleanly (provider ignores stream_options)', async () => {
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                function: { name: 'get_agents', arguments: '{}' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    },
    // No usage-only chunk here -- sseBody appends [DONE] straight after, as some providers do
    // regardless of stream_options.include_usage. Must not hang and must not duplicate the
    // tool_call event that finalizeToolCalls() already emitted once.
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['tool_call', 'done'],
    'no duplicate tool_call and no hang when the provider never sends a trailing usage frame',
  );
  const done = events.find(event => event.type === 'done');
  assert.equal(
    (done as Extract<StreamEvent, { type: 'done' }>).usage,
    undefined,
    'nothing to report when the provider never sent a usage frame at all',
  );
});

test('chatStream: buffered reasoning ahead of a finish_reason:"tool_calls" round is still suppressed once the usage frame arrives later', async () => {
  // Same invariant "Suppress reasoning fallback on tool-call exits" protects at the immediate
  // finish_reason exit -- now also checked one chunk later, at the usage-frame exit this fix
  // makes reachable for a tool-call round for the first time.
  const body = sseBody([
    {
      choices: [
        {
          index: 0,
          delta: { reasoning: 'I should check the agent list.', channel: 'analysis' },
        },
      ],
    },
    {
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_1',
                function: { name: 'get_agents', arguments: '{}' },
              },
            ],
          },
          finish_reason: 'tool_calls',
        },
      ],
    },
    { choices: [], usage: { prompt_tokens: 500, completion_tokens: 12 } },
  ]);
  const events = await withFakeFetch(body, () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        BASE_CONFIG,
        [userMessage('list active agents')],
        controller.signal,
      ),
    );
  });
  assert.deepEqual(
    events.map(event => event.type),
    ['tool_call', 'done'],
    'the buffered reasoning must not leak into a tool round just because usage now arrives later',
  );
});
