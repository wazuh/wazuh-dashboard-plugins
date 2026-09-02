import assert from 'node:assert/strict';
import { WazuhBrainAdapter, deriveSessionId } from './wazuh-brain';
import { ChatMessage, ProviderConfig, StreamEvent } from '../../common/types';
import { setOutOfCreditsMessage } from '../plugin-services';

// Covers sessionId collision, response
// size cap, and runtime shape validation for the hosted-brain adapter.

function userMessage(content: string): ChatMessage {
  return { role: 'user', content };
}

// --- deriveSessionId: session-id collision surface -----------------------------------------------

test('deriveSessionId: two conversations with different first messages get different ids even at the same length', () => {
  const a = deriveSessionId([userMessage('What is happening on host A?')]);
  const b = deriveSessionId([userMessage('What is happening on host B?')]);
  assert.notEqual(a, b);
});

test('deriveSessionId: the same conversation (same first message, growing length) keeps the length component visibly changing but the hash stable', () => {
  const first = userMessage('Investigate the finding on agent 042');
  const turn1 = deriveSessionId([first]);
  const turn2 = deriveSessionId([
    first,
    { role: 'assistant', content: 'Looking into it.' },
    userMessage('Any updates?'),
  ]);
  const hashOf = (id: string) => id.split('-').slice(0, -1).join('-');
  assert.equal(
    hashOf(turn1),
    hashOf(turn2),
    'the hash component (derived from the first user message) must stay stable across turns',
  );
  assert.notEqual(
    turn1,
    turn2,
    'the length suffix must still differ between a 1-message and a 3-message conversation',
  );
});

test('deriveSessionId: two DIFFERENT users whose conversations happen to have the same length do not collide, as long as their first message differs', () => {
  const userOne = deriveSessionId([
    userMessage('host-alpha status?'),
    { role: 'assistant', content: 'ok' },
  ]);
  const userTwo = deriveSessionId([
    userMessage('host-beta status?'),
    { role: 'assistant', content: 'ok' },
  ]);
  assert.notEqual(
    userOne,
    userTwo,
    'without the length-plus-hash derivation, both would collide as "wazuh-ai-assistant-2" ' +
      'regardless of content',
  );
});

test('deriveSessionId: an empty messages array (no user message yet) does not throw', () => {
  assert.doesNotThrow(() => deriveSessionId([]));
});

// --- chatStream: response size cap + shape validation ---------------------------------------------

const BASE_CONFIG: ProviderConfig = {
  id: 'brain-1',
  name: 'Hosted Brain',
  type: 'wazuh_brain',
  // A literal loopback IP: no DNS resolution path is exercised, so this test has no network
  // dependency at all (assertProviderUrlAllowed's literal-IP branch is synchronous).
  baseUrl: 'http://127.0.0.1:19999/webhook',
  model: 'brain-v1',
  apiKey: 'test-key',
};

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
  fakeFetch: typeof fetch,
  run: () => Promise<T>,
): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = fakeFetch;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test('WazuhBrainAdapter.chatStream: a normal string answer field still streams a delta + done (regression guard)', async () => {
  const events = await withFakeFetch(
    (() =>
      Promise.resolve(
        new Response(JSON.stringify({ answer: 'The cluster is healthy.' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
  );
  assert.equal(
    (events[0] as { content: string }).content,
    'The cluster is healthy.',
  );
});

test('WazuhBrainAdapter.chatStream: a non-string content field (object) is rejected with a clear error instead of violating the StreamEvent contract', async () => {
  const events = await withFakeFetch(
    (() =>
      Promise.resolve(
        new Response(JSON.stringify({ output: { nested: 'not a string' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.match(
    (events[0] as { message: string }).message,
    /unexpected \(non-string\)/i,
  );
});

test('WazuhBrainAdapter.chatStream: a non-string content field (number) is also rejected', async () => {
  const events = await withFakeFetch(
    (() =>
      Promise.resolve(
        new Response(JSON.stringify({ text: 12345 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.match(
    (events[0] as { message: string }).message,
    /unexpected \(non-string\)/i,
  );
});

test('WazuhBrainAdapter.chatStream: an oversized 200-OK response body is rejected instead of being buffered/parsed in full', async () => {
  // One byte over the adapter's 128KB cap -- constructed as a technically-valid JSON string value
  // so this test exercises the SIZE check, not a JSON.parse failure.
  const oversizedValue = 'x'.repeat(128 * 1024 + 1);
  const oversizedBody = JSON.stringify({ answer: oversizedValue });
  const events = await withFakeFetch(
    (() =>
      Promise.resolve(
        new Response(oversizedBody, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.match(
    (events[0] as { message: string }).message,
    /exceeded the maximum allowed size/i,
  );
});

test('WazuhBrainAdapter.chatStream: a within-cap body just under the limit still parses normally', async () => {
  // Comfortably under 128KB after JSON-encoding overhead.
  const value = 'y'.repeat(1000);
  const events = await withFakeFetch(
    (() =>
      Promise.resolve(
        new Response(JSON.stringify({ answer: value }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.deepEqual(
    events.map(event => event.type),
    ['delta', 'done'],
  );
  assert.equal((events[0] as { content: string }).content, value);
});

test('WazuhBrainAdapter.chatStream: an HTTP error response redacts the configured API key from an echoed JSON body (redaction wired through the wazuh_brain adapter)', async () => {
  const events = await withFakeFetch(
    (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: 'bad request',
            echoed_body: { api_key: BASE_CONFIG.apiKey },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  const message = (events[0] as { message: string }).message;
  assert.doesNotMatch(message, new RegExp(BASE_CONFIG.apiKey as string));
  assert.match(message, /\[redacted\]/);
});

// --- Out-of-credits override: same detection/precedence as retry.ts's SSE adapters -- reuses ----
// --- describeOutOfCreditsMessage's plugin-services singleton, not a per-call option. -------------

function outOfCreditsResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'invalid_request_error',
      message: 'Your credit balance is too low to access the API.',
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
}

afterEach(() => {
  setOutOfCreditsMessage(undefined);
});

test('WazuhBrainAdapter.chatStream: an out-of-credits response with no override configured keeps the raw provider text (no behavior change)', async () => {
  const events = await withFakeFetch(
    (() => Promise.resolve(outOfCreditsResponse())) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.equal(events.length, 1);
  const message = (events[0] as { message: string }).message;
  assert.match(message, /Provider responded with HTTP 400/);
  assert.match(message, /credit balance is too low/i);
});

test('WazuhBrainAdapter.chatStream: an out-of-credits response with an override configured yields the configured message', async () => {
  setOutOfCreditsMessage(
    'Your organization is out of credits. [Add credits](https://example.com/billing).',
  );
  const events = await withFakeFetch(
    (() => Promise.resolve(outOfCreditsResponse())) as unknown as typeof fetch,
    () => {
      const adapter = new WazuhBrainAdapter();
      const controller = new AbortController();
      return drain(
        adapter.chatStream(
          BASE_CONFIG,
          [userMessage('status?')],
          controller.signal,
        ),
      );
    },
  );
  assert.equal(events.length, 1);
  const message = (events[0] as { message: string }).message;
  assert.equal(
    message,
    'Your organization is out of credits. [Add credits](https://example.com/billing).',
  );
  assert.doesNotMatch(
    message,
    /credit balance is too low/i,
    'must not leak the raw provider text once an override is configured',
  );
});
