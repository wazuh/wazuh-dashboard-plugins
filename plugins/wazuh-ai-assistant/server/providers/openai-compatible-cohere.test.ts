import assert from 'node:assert/strict';
import { OpenAiCompatibleAdapter } from './openai-compatible';
import { ProviderConfig } from '../../common/types';
import { ChatStreamOptions, ProviderStreamEvent } from './types';

// Keep the real URL guard while making hostname resolution deterministic and offline.
jest.mock('dns/promises', () => ({
  lookup: jest.fn().mockResolvedValue([{ address: '203.0.113.1', family: 4 }]),
}));

const COHERE_BASE_URL = 'https://api.cohere.ai/compatibility/v1';
const TOOLS = [
  {
    name: 'get_agents',
    description: 'List agents',
    parameters: { type: 'object' as const, properties: {} },
  },
];

async function captureRequest(baseUrl: string, options: ChatStreamOptions) {
  const config: ProviderConfig = {
    id: 'test-provider',
    name: 'Test provider',
    type: 'openai_compatible',
    baseUrl,
    model: 'test-model',
    apiKey: 'test-key',
  };
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const events: ProviderStreamEvent[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    requests.push({ url, init });
    return Promise.resolve(
      new Response(
        'data: {"choices":[{"index":0,"delta":{"content":"ok"}}]}\n\n' +
          'data: [DONE]\n\n',
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
      ),
    );
  }) as unknown as typeof fetch;
  try {
    const adapter = new OpenAiCompatibleAdapter();
    for await (const event of adapter.chatStream(
      config,
      [{ role: 'user', content: 'List agents' }],
      new AbortController().signal,
      options,
    )) {
      events.push(event);
    }
    return { requests, events };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

for (const baseUrl of [
  COHERE_BASE_URL,
  `${COHERE_BASE_URL}/`,
  'https://API.COHERE.AI/compatibility/v1',
]) {
  test(`Cohere omits parallel_tool_calls while preserving tools: ${baseUrl}`, async () => {
    const { requests, events } = await captureRequest(baseUrl, {
      tools: TOOLS,
      toolChoice: 'auto',
      temperature: 0.2,
    });
    assert.equal(requests.length, 1);
    const body = JSON.parse(requests[0].init?.body as string);
    assert.ok(!Object.prototype.hasOwnProperty.call(body, 'parallel_tool_calls'));
    assert.deepEqual(body.tools, [{ type: 'function', function: TOOLS[0] }]);
    assert.equal(body.tool_choice, 'auto');
    assert.equal(body.temperature, 0.2);
    assert.equal(body.model, 'test-model');
    assert.equal(body.stream, true);
    assert.deepEqual(body.stream_options, { include_usage: true });
    assert.equal(requests[0].init?.redirect, 'error');
    assert.ok(!events.some(event => event.type === 'error'));
    assert.equal(events[events.length - 1].type, 'done');
  });
}

for (const baseUrl of [
  'https://api.openai.com/v1',
  'https://generativelanguage.googleapis.com/v1beta/openai',
  'https://api.cohere.ai.example.test/v1',
  'https://example.api.cohere.ai/v1',
  'https://api.cohere.ai@provider.example.test/v1',
]) {
  test(`Other hostnames retain parallel_tool_calls: false: ${baseUrl}`, async () => {
    const { requests, events } = await captureRequest(baseUrl, {
      tools: TOOLS,
      toolChoice: 'auto',
    });
    assert.equal(requests.length, 1);
    const body = JSON.parse(requests[0].init?.body as string);
    assert.equal(body.parallel_tool_calls, false);
    assert.deepEqual(body.tools, [{ type: 'function', function: TOOLS[0] }]);
    assert.equal(body.tool_choice, 'auto');
    assert.ok(!events.some(event => event.type === 'error'));
  });
}

test('Cohere without tools omits all tool-related request fields', async () => {
  const { requests, events } = await captureRequest(COHERE_BASE_URL, {});
  assert.equal(requests.length, 1);
  const body = JSON.parse(requests[0].init?.body as string);
  for (const field of ['tools', 'tool_choice', 'parallel_tool_calls']) {
    assert.ok(!Object.prototype.hasOwnProperty.call(body, field));
  }
  assert.ok(!events.some(event => event.type === 'error'));
});

test('The provider URL guard still rejects metadata addresses before fetch', async () => {
  const { requests, events } = await captureRequest('http://169.254.169.254/v1', {
    tools: TOOLS,
  });
  assert.equal(requests.length, 0);
  assert.ok(events.some(event => event.type === 'error'));
});
