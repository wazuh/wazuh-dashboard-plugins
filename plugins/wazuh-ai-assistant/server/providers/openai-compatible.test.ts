import { OpenAiCompatibleAdapter } from './openai-compatible';
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
      adapter.chatStream(config, [], controller.signal),
    );
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('error');
    expect((events[0] as { message: string }).message).toBe(rawMessage);
  } finally {
    global.fetch = originalFetch;
  }
});
