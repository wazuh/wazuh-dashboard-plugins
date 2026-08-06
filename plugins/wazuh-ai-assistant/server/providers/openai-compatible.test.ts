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
      choices: [{ index: 0, delta: { reasoning: 'The', channel: 'analysis' } }],
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
  assert.deepEqual(
    events.map(event => event.type),
    ['done'],
  );
});

// --- final-round tools/tool_choice omission (issue 03-tool-choice-none-final-round.md) --------
// chat.ts's orchestrate() now sends `{}` (no `tools` at all) instead of
// `{tools, toolChoice: 'none'}` on the final round, relying on this adapter's existing
// `if (options?.tools?.length)` guard to drop `tools`/`tool_choice` from the wire body for free.

test('chatStream: with no `tools` in options, the outbound body carries neither `tools` nor `tool_choice` (final-round shape)', async () => {
  const body = sseBody([
    { choices: [{ index: 0, delta: { content: 'Done.' } }] },
  ]);
  const capturedBodies = await withFakeFetchCapturingBody(body, () => {
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
  const capturedBodies = await withFakeFetchCapturingBody(body, () => {
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
  const capturedBodies = await withFakeFetchCapturingBody(body, () => {
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
  const capturedBodies = await withFakeFetchCapturingBody(body, () => {
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
  const capturedBodies = await withFakeFetchCapturingBody(body, () => {
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
