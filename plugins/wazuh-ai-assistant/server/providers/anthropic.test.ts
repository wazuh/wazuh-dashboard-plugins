import { AnthropicAdapter } from './anthropic';
import { StreamEvent, ProviderConfig } from '../../common/types';

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

async function drain(gen: AsyncIterable<StreamEvent>): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  for await (const event of gen) {
    events.push(event);
  }
  return events;
}

const config: ProviderConfig = {
  baseUrl: 'https://api.example.com',
  model: 'claude-test',
  apiKey: 'test-key',
} as ProviderConfig;

test('AnthropicAdapter: an in-stream error frame containing tool_use_failed yields the friendly message, not the raw text', async () => {
  const adapter = new AnthropicAdapter();
  const rawMessage = 'tool_use_failed: model produced an invalid call';
  const originalFetch = global.fetch;
  global.fetch = (() =>
    Promise.resolve(
      sseResponse([
        JSON.stringify({ type: 'error', error: { message: rawMessage } }),
      ]),
    )) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    const events = await drain(
      adapter.chatStream(config, [], controller.signal),
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

test('AnthropicAdapter: an in-stream error frame with no marker passes through unchanged', async () => {
  const adapter = new AnthropicAdapter();
  const rawMessage = 'authentication failed';
  const originalFetch = global.fetch;
  global.fetch = (() =>
    Promise.resolve(
      sseResponse([
        JSON.stringify({ type: 'error', error: { message: rawMessage } }),
      ]),
    )) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    const events = await drain(
      adapter.chatStream(config, [], controller.signal),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    expect((events[0] as { message: string }).message).toBe(rawMessage);
  } finally {
    global.fetch = originalFetch;
  }
});

// --- temperature rejection: retry-once + per-process cache ------------------------------------
// `temperature` was REMOVED from the Anthropic Messages API on Claude Opus 4.7 and later (Opus
// 4.7/4.8, Opus 5, Sonnet 5, Fable 5) and is answered with a 400. routes/chat.ts sends
// `temperature: 0` on EVERY stage-1 router call and 0.2 on every tool-bearing round, so before the
// shared fallback in temperature-fallback.ts an Anthropic provider on any current Claude model
// could not complete a single turn: the 400 ended the turn and the UI rendered nothing but
// "Response interrupted". These tests pin the recovery on the Anthropic side specifically -- the
// openai-compatible adapter has its own copies against a Bedrock gateway's wording, and the point
// here is that BOTH adapters route through the same helper.

/** A rejected (non-streaming) Response whose body is readable exactly once, like the real thing. */
function rejectedResponse(status: number, body: unknown): Response {
  let consumed = false;
  return {
    ok: false,
    status,
    statusText: 'Bad Request',
    body: null,
    headers: { get: () => null } as unknown as Headers,
    text: () => {
      if (consumed) {
        return Promise.reject(new Error('body already consumed'));
      }
      consumed = true;
      return Promise.resolve(JSON.stringify(body));
    },
  } as unknown as Response;
}

/** Anthropic's real wording when a removed parameter is sent to a model that dropped it. */
const ANTHROPIC_TEMPERATURE_400 = {
  type: 'error',
  error: {
    type: 'invalid_request_error',
    message: 'temperature: Extra inputs are not permitted',
  },
};

/** A minimal successful Anthropic stream: one text delta then a terminal message_stop. */
const OK_STREAM = [
  JSON.stringify({
    type: 'content_block_delta',
    index: 0,
    delta: { type: 'text_delta', text: 'hello' },
  }),
  JSON.stringify({ type: 'message_stop' }),
];

/** A fresh config per test -- the rejection cache is keyed by `baseUrl::model`, so reusing one
 * would leak an earlier test's discovered rejection into a later test's first attempt. */
function freshConfig(model: string): ProviderConfig {
  return {
    baseUrl: 'https://api.anthropic.example',
    model,
    apiKey: 'test-key',
  } as ProviderConfig;
}

test('AnthropicAdapter: a 400 rejecting temperature is retried once without it, and the retry succeeds', async () => {
  const adapter = new AnthropicAdapter();
  const bodies: Array<Record<string, unknown>> = [];
  const originalFetch = global.fetch;
  global.fetch = ((_url: string, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return Promise.resolve(
      bodies.length === 1
        ? rejectedResponse(400, ANTHROPIC_TEMPERATURE_400)
        : sseResponse(OK_STREAM),
    );
  }) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    const events = await drain(
      adapter.chatStream(
        freshConfig('claude-opus-4-8'),
        [{ role: 'user', content: 'hi' }] as never,
        controller.signal,
        { temperature: 0 },
      ),
    );
    expect(bodies).toHaveLength(2);
    expect(bodies[0].temperature).toBe(0);
    expect('temperature' in bodies[1]).toBe(false);
    // The turn must actually deliver an answer, not merely avoid an error.
    expect(events.some(event => event.type === 'delta')).toBe(true);
    expect(events.some(event => event.type === 'error')).toBe(false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('AnthropicAdapter: a second turn on the same provider+model omits temperature immediately', async () => {
  const adapter = new AnthropicAdapter();
  const config = freshConfig('claude-sonnet-5');
  const bodies: Array<Record<string, unknown>> = [];
  const originalFetch = global.fetch;
  global.fetch = ((_url: string, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    const isRejection =
      bodies.length === 1 && 'temperature' in bodies[bodies.length - 1];
    return Promise.resolve(
      isRejection
        ? rejectedResponse(400, ANTHROPIC_TEMPERATURE_400)
        : sseResponse(OK_STREAM),
    );
  }) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    await drain(
      adapter.chatStream(config, [] as never, controller.signal, {
        temperature: 0,
      }),
    );
    const afterFirstTurn = bodies.length;
    await drain(
      adapter.chatStream(config, [] as never, controller.signal, {
        temperature: 0,
      }),
    );
    // Exactly ONE request for the second turn, and it never carried temperature: the cached
    // rejection is what stops every later turn paying for the doomed first attempt again.
    expect(bodies.length - afterFirstTurn).toBe(1);
    expect('temperature' in bodies[bodies.length - 1]).toBe(false);
  } finally {
    global.fetch = originalFetch;
  }
});

// --- wire shape: assistant messages carrying both narration text and tool calls ---------------
// History carries the round's own narration alongside its tool call instead of discarding it as
// `content: ''`. An assistant ChatMessage with non-empty `content` AND `toolCalls` must become a
// `text` block ahead of the `tool_use` block(s) (Anthropic requires blocks in emission order), and
// a whitespace-only `content` (e.g. a bare "\n\n" a model streams as priming text right before a
// tool call) must never become a text block at all -- Anthropic 400s on a whitespace-only text
// block. chat.ts trims before writing history, but this adapter guards independently (defense in
// depth) since it is the actual point where a `content: ''`/whitespace value would otherwise
// reach the wire.

test('AnthropicAdapter: an assistant message with narration text and a tool call emits a text block before the tool_use block', async () => {
  const adapter = new AnthropicAdapter();
  const bodies: Array<Record<string, unknown>> = [];
  const originalFetch = global.fetch;
  global.fetch = ((_url: string, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return Promise.resolve(sseResponse(OK_STREAM));
  }) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    await drain(
      adapter.chatStream(
        freshConfig('claude-sonnet-5'),
        [
          { role: 'user', content: 'check the rules' },
          {
            role: 'assistant',
            content: 'Let me check that for you.',
            toolCalls: [{ id: 'call-1', name: 'get_rules', arguments: {} }],
          },
          { role: 'tool', toolCallId: 'call-1', content: '{"rows":[]}' },
        ] as never,
        controller.signal,
      ),
    );
    const messages = bodies[0].messages as Array<{
      role: string;
      content: Array<{ type: string; text?: string }>;
    }>;
    const assistantMessage = messages.find(
      message => message.role === 'assistant',
    );
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.content[0]).toMatchObject({
      type: 'text',
      text: 'Let me check that for you.',
    });
    expect(assistantMessage!.content[1]).toMatchObject({ type: 'tool_use' });
  } finally {
    global.fetch = originalFetch;
  }
});

test('AnthropicAdapter: an assistant message with whitespace-only content emits no text block', async () => {
  const adapter = new AnthropicAdapter();
  const bodies: Array<Record<string, unknown>> = [];
  const originalFetch = global.fetch;
  global.fetch = ((_url: string, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return Promise.resolve(sseResponse(OK_STREAM));
  }) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    await drain(
      adapter.chatStream(
        freshConfig('claude-sonnet-5'),
        [
          { role: 'user', content: 'check the rules' },
          {
            role: 'assistant',
            content: '\n\n',
            toolCalls: [{ id: 'call-1', name: 'get_rules', arguments: {} }],
          },
          { role: 'tool', toolCallId: 'call-1', content: '{"rows":[]}' },
        ] as never,
        controller.signal,
      ),
    );
    const messages = bodies[0].messages as Array<{
      role: string;
      content: Array<{ type: string }>;
    }>;
    const assistantMessage = messages.find(
      message => message.role === 'assistant',
    );
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.content).toHaveLength(1);
    expect(assistantMessage!.content[0].type).toBe('tool_use');
  } finally {
    global.fetch = originalFetch;
  }
});

test('AnthropicAdapter: an unrelated 400 is not treated as a temperature rejection', async () => {
  const adapter = new AnthropicAdapter();
  const bodies: Array<Record<string, unknown>> = [];
  const originalFetch = global.fetch;
  global.fetch = ((_url: string, init: { body: string }) => {
    bodies.push(JSON.parse(init.body));
    return Promise.resolve(
      rejectedResponse(400, {
        type: 'error',
        error: {
          type: 'invalid_request_error',
          message: 'credit balance too low',
        },
      }),
    );
  }) as unknown as typeof fetch;
  try {
    const controller = new AbortController();
    const events = await drain(
      adapter.chatStream(
        freshConfig('claude-opus-4-7'),
        [] as never,
        controller.signal,
        { temperature: 0 },
      ),
    );
    // One attempt only, and the real error must reach the user rather than being masked by a
    // pointless byte-identical retry.
    expect(bodies).toHaveLength(1);
    expect(events.some(event => event.type === 'error')).toBe(true);
  } finally {
    global.fetch = originalFetch;
  }
});
