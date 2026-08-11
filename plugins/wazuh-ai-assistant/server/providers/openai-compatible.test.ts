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

// --- in-stream tool_use_failed classification (issue #8855) ------------------------------------
// Groq (and OpenAI-compatible providers with a similar contract) sometimes report a malformed
// tool call as an in-stream SSE `error` frame on HTTP 200, rather than a pre-stream HTTP 400 --
// this must be classified the same way the HTTP-400 path already is.

/** Builds a fetch Response whose body streams the given SSE `data:` lines. */
function sseResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`data: ${line}\n`));
      }
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    body,
    headers: { get: () => null } as unknown as Headers,
    text: () => Promise.resolve(''),
  } as unknown as Response;
}

const IN_STREAM_ERROR_CONFIG: ProviderConfig = {
  baseUrl: 'https://api.example.com/v1',
  model: 'test-model',
  apiKey: 'test-key',
} as ProviderConfig;

test('OpenAiCompatibleAdapter: an in-stream error frame containing failed_generation yields the friendly message, not the raw text', async () => {
  const adapter = new OpenAiCompatibleAdapter();
  const rawMessage =
    "Failed to call a function. Please adjust your prompt. See 'failed_generation' for more details.";
  const originalFetch = global.fetch;
  global.fetch = (() =>
    Promise.resolve(
      sseResponse([JSON.stringify({ error: { message: rawMessage } })]),
    )) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    const events = await drain(
      adapter.chatStream(IN_STREAM_ERROR_CONFIG, [], controller.signal),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    const message = (events[0] as { message: string }).message;
    expect(message).not.toBe(rawMessage);
    expect(message).not.toContain('failed_generation');
    expect(message).toMatch(/couldn't get a valid tool call/i);
  } finally {
    global.fetch = originalFetch;
  }
});

test('OpenAiCompatibleAdapter: an in-stream error frame with no marker passes through unchanged', async () => {
  const adapter = new OpenAiCompatibleAdapter();
  const rawMessage = 'rate limit exceeded';
  const originalFetch = global.fetch;
  global.fetch = (() =>
    Promise.resolve(
      sseResponse([JSON.stringify({ error: { message: rawMessage } })]),
    )) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    const events = await drain(
      adapter.chatStream(IN_STREAM_ERROR_CONFIG, [], controller.signal),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    expect((events[0] as { message: string }).message).toBe(rawMessage);
  } finally {
    global.fetch = originalFetch;
  }
});

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

// --- temperature rejection: retry-once + per-process cache (issue seen live against a Bedrock
// `openai_compatible` gateway serving `openai.gpt-oss-120b`, which answers HTTP 400
// "`temperature` is deprecated for this model" whenever the stage-1 router's `temperature: 0` is
// forwarded). The fix must retry the SAME turn once without `temperature` instead of dying, and
// remember the finding for that provider+model so every later call -- including every stage-1
// router call -- skips straight to omitting it. -------------------------------------------------

/** Builds a fetch mock that returns each entry of `responses` in order (the last entry repeats
 * once exhausted) and records every outbound request body it was called with. */
function withFakeFetchSequence<T>(
  responses: Response[],
  run: (capturedBodies: Array<Record<string, unknown>>) => Promise<T>,
): Promise<{ result: T; capturedBodies: Array<Record<string, unknown>> }> {
  const original = globalThis.fetch;
  const capturedBodies: Array<Record<string, unknown>> = [];
  let callIndex = 0;
  globalThis.fetch = ((_url: string, init?: RequestInit) => {
    if (typeof init?.body === 'string') {
      capturedBodies.push(JSON.parse(init.body));
    }
    const response = responses[Math.min(callIndex, responses.length - 1)];
    callIndex += 1;
    return Promise.resolve(response);
  }) as unknown as typeof fetch;
  return run(capturedBodies)
    .then(result => ({ result, capturedBodies }))
    .finally(() => {
      globalThis.fetch = original;
    });
}

/** A fresh `ProviderConfig` per test -- the temperature-rejection cache is keyed by
 * `baseUrl::model`, so reusing `BASE_CONFIG` across these tests would let one test's cached
 * rejection leak into the next. */
function uniqueTemperatureTestConfig(id: string): ProviderConfig {
  return {
    ...BASE_CONFIG,
    // Literal loopback address, NOT a real hostname: the provider-URL guard resolves real
    // hostnames via live DNS on first sight (see BASE_CONFIG's own comment), and these tests
    // must not depend on the network. Unique per test via the path segment only.
    baseUrl: `http://127.0.0.1:19999/${id}/v1`,
    model: 'openai.gpt-oss-120b',
  };
}

/** A fresh streaming success Response per use — Response bodies are one-shot streams, so
 * sharing a single object across fetch-mock sequences leaves later reads on a consumed body. */
function freshSuccessResponse(): Response {
  return new Response(
    sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  );
}

test('chatStream: a 400 mentioning temperature is retried once without it and the retry succeeds', async () => {
  const config = uniqueTemperatureTestConfig('retry-success');
  const rejection = new Response(
    JSON.stringify({
      error: { message: '`temperature` is deprecated for this model.' },
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
  const success = new Response(
    sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  );
  const { result: events, capturedBodies } = await withFakeFetchSequence(
    [rejection, success],
    () => {
      const adapter = new OpenAiCompatibleAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          config,
          [userMessage('route this')],
          controller.signal,
          { temperature: 0 },
        ),
      );
    },
  );
  assert.equal(capturedBodies.length, 2, 'must have retried exactly once');
  assert.equal(
    capturedBodies[0].temperature,
    0,
    'the first attempt must still send the configured temperature',
  );
  assert.ok(
    !('temperature' in capturedBodies[1]),
    'the retry must omit temperature entirely',
  );
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
    'the turn must succeed via the retried request, not surface the 400 to the caller',
  );
});

test('chatStream: an unrelated 400 does not trigger a temperature retry', async () => {
  const config = uniqueTemperatureTestConfig('unrelated-400');
  const rejection = new Response(
    JSON.stringify({ error: { message: 'Invalid model identifier.' } }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
  const { result: events, capturedBodies } = await withFakeFetchSequence(
    [rejection],
    () => {
      const adapter = new OpenAiCompatibleAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          config,
          [userMessage('route this')],
          controller.signal,
          { temperature: 0 },
        ),
      );
    },
  );
  assert.equal(
    capturedBodies.length,
    1,
    'an unrelated 400 must not spend a retry attempt',
  );
  assert.deepEqual(
    events.map(event => event.type),
    ['error'],
    'the unrelated 400 must still surface as a terminal error',
  );
});

test('chatStream: a second call against the same provider+model omits temperature immediately (no repeated 400)', async () => {
  const config = uniqueTemperatureTestConfig('cached-decision');
  const rejection = new Response(
    JSON.stringify({
      error: { message: '`temperature` is deprecated for this model.' },
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
  // First call: pays for the discovery (400 then a successful retry).
  await withFakeFetchSequence([rejection, freshSuccessResponse()], () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        config,
        [userMessage('first call')],
        controller.signal,
        { temperature: 0 },
      ),
    );
  });
  // Second call against the SAME provider+model: must go straight to a single, temperature-free
  // request -- no repeated 400 round-trip.
  const { capturedBodies } = await withFakeFetchSequence(
    [freshSuccessResponse()],
    () => {
      const adapter = new OpenAiCompatibleAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          config,
          [userMessage('second call, same provider+model')],
          controller.signal,
          { temperature: 0 },
        ),
      );
    },
  );
  assert.equal(
    capturedBodies.length,
    1,
    'the cached decision must skip straight to the temperature-free request',
  );
  assert.ok(
    !('temperature' in capturedBodies[0]),
    'temperature must be omitted immediately once cached as rejected',
  );
});

test('chatStream: a provider that accepts temperature keeps receiving it (regression)', async () => {
  const config = uniqueTemperatureTestConfig('accepts-temperature');
  const success = new Response(
    sseBody([{ choices: [{ index: 0, delta: { content: 'ok' } }] }]),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  );
  const { capturedBodies } = await withFakeFetchSequence([success], () => {
    const adapter = new OpenAiCompatibleAdapter();
    const controller = new AbortController();
    return drain(
      adapter.chatStream(
        config,
        [userMessage('route this')],
        controller.signal,
        { temperature: 0 },
      ),
    );
  });
  assert.equal(capturedBodies.length, 1);
  assert.equal(
    capturedBodies[0].temperature,
    0,
    'a provider that never rejected temperature must keep receiving it, including a literal 0',
  );
});

test('chatStream: a 400 mentioning temperature on a temperature-FREE call is not retried and not cached', async () => {
  const config = uniqueTemperatureTestConfig('no-temperature-sent');
  const rejection = new Response(
    // The body mentions "temperature" but this call never sent the parameter, so treating it
    // as a temperature rejection would spend a byte-identical retry AND poison the cache.
    JSON.stringify({
      error: { message: 'Model overloaded; try lowering temperature or retrying later.' },
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
  const { result: events, capturedBodies } = await withFakeFetchSequence(
    [rejection],
    () => {
      const adapter = new OpenAiCompatibleAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          config,
          [userMessage('route this')],
          controller.signal,
          // no options.temperature at all
        ),
      );
    },
  );
  assert.equal(
    capturedBodies.length,
    1,
    'a temperature-free call must never spend a temperature retry',
  );
  assert.deepEqual(
    events.map(event => event.type),
    ['error'],
    'the 400 must surface as a terminal error, untouched',
  );
  // And the cache must NOT have been poisoned: a follow-up call that DOES send temperature
  // must still include it on its first attempt.
  const { capturedBodies: followUpBodies } = await withFakeFetchSequence(
    [freshSuccessResponse()],
    () => {
      const adapter = new OpenAiCompatibleAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          config,
          [userMessage('follow-up with temperature')],
          controller.signal,
          { temperature: 0 },
        ),
      );
    },
  );
  assert.equal(
    followUpBodies[0].temperature,
    0,
    'the earlier temperature-free 400 must not have cached a rejection for this provider+model',
  );
});
