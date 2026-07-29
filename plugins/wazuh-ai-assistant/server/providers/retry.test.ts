import assert from 'node:assert/strict';
import { fetchProviderWithRetry, sanitizeProviderErrorBody } from './retry';
import { StreamEvent } from '../../common/types';

/** Minimal fake fetch Response covering everything retry.ts touches: `.ok`, `.status`, `.body`,
 * `.headers.get()`, `.text()`. `body` is an opaque non-null marker (never read by these tests —
 * a real SSE body is only consumed by the adapters, not by fetchProviderWithRetry itself). */
function fakeResponse(
  status: number,
  bodyText: string,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    body:
      status >= 200 && status < 300 ? ({} as ReadableStream<Uint8Array>) : null,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    } as Headers,
    text: () => Promise.resolve(bodyText),
  } as unknown as Response;
}

async function drain(
  gen: AsyncGenerator<StreamEvent, unknown>,
): Promise<{ events: StreamEvent[]; result: unknown }> {
  const events: StreamEvent[] = [];
  let step = await gen.next();
  while (!step.done) {
    events.push(step.value);
    // eslint-disable-next-line no-await-in-loop -- generator steps are sequential by contract
    step = await gen.next();
  }
  return { events, result: step.value };
}

const GROQ_TOOL_USE_FAILED_BODY = JSON.stringify({
  error: {
    message:
      "Failed to call a function. Please adjust your prompt. See 'failed_generation' for more details.",
    code: 'tool_use_failed',
    failed_generation: '{"name": "get_active_agents", "arguments": "{bad json',
  },
});

test('fetchProviderWithRetry: tool_use_failed 400 succeeds on the one-shot retry', async () => {
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    if (calls === 1) {
      return Promise.resolve(fakeResponse(400, GROQ_TOOL_USE_FAILED_BODY));
    }
    return Promise.resolve(fakeResponse(200, ''));
  };
  const controller = new AbortController();
  const { events, result } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(
    calls,
    2,
    'expected exactly one retry (two total fetch attempts)',
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'status');
  assert.match(
    (events[0] as { message: string }).message,
    /invalid tool call/i,
  );
  assert.ok(result, 'expected the successful response to be returned');
});

test('fetchProviderWithRetry: tool_use_failed 400 twice yields our own terminal message with a failed_generation snippet', async () => {
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    return Promise.resolve(fakeResponse(400, GROQ_TOOL_USE_FAILED_BODY));
  };
  const controller = new AbortController();
  const { events, result } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(
    calls,
    2,
    'expected exactly one retry before giving up (two total fetch attempts)',
  );
  assert.equal(result, undefined);
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'status');
  assert.equal(events[1].type, 'error');
  const message = (events[1] as { message: string }).message;
  assert.match(message, /could not generate a valid tool call/i);
  assert.doesNotMatch(
    message,
    /adjust your prompt/i,
    "must not be Groq's raw developer-facing text",
  );
  assert.match(message, /Details \(failed_generation\):/);
  assert.match(message, /get_active_agents/);
});

test('fetchProviderWithRetry: tool_use_failed 400 with an unparseable body still gives the terminal message, no snippet', async () => {
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    return Promise.resolve(
      fakeResponse(400, 'tool_use_failed but not valid JSON at all'),
    );
  };
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(calls, 2);
  const errorEvent = events.find(event => event.type === 'error');
  assert.ok(errorEvent);
  const message = (errorEvent as { message: string }).message;
  assert.match(message, /could not generate a valid tool call/i);
  assert.doesNotMatch(message, /Details \(failed_generation\)/);
});

test('fetchProviderWithRetry: a plain 400 (not tool_use_failed) is not retried and keeps the old raw-body message shape', async () => {
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    return Promise.resolve(
      fakeResponse(400, '{"error":{"message":"bad request: missing field"}}'),
    );
  };
  const controller = new AbortController();
  const { events, result } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(
    calls,
    1,
    'a non-tool_use_failed 400 must not consume the tool_use_failed retry budget',
  );
  assert.equal(result, undefined);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.match(
    (events[0] as { message: string }).message,
    /Provider responded with HTTP 400/,
  );
});

test('fetchProviderWithRetry: 429 retries still work unchanged alongside the new tool_use_failed branch', async () => {
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    if (calls === 1) {
      return Promise.resolve(
        fakeResponse(429, 'try again in 10ms', { 'retry-after': '' }),
      );
    }
    return Promise.resolve(fakeResponse(200, ''));
  };
  const controller = new AbortController();
  const { events, result } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(calls, 2);
  assert.ok(result);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'status');
  assert.match((events[0] as { message: string }).message, /rate limit/i);
});

test('sanitizeProviderErrorBody: redacts a bearer token', () => {
  const out = sanitizeProviderErrorBody(
    'upstream said: Bearer sk-abc123def456ghi789 was rejected',
  );
  assert.doesNotMatch(out, /sk-abc123def456ghi789/);
  assert.match(out, /\[redacted\]/);
});

// sanitizeProviderErrorBody
// must redact the JSON `api_key` shape as well as the header shapes: a pattern requiring `\s*[:=]`
// directly after the key name never matches when a `"` sits between them (`{"api_key":"..."}`),
// which is exactly how wazuh-brain.ts sends the key. Six cases: three JSON-body key shapes, the
// two header shapes, and an exact-value case proving the `secret` parameter (layer 1) catches a
// short or oddly-shaped key the regex layer (layer 2) cannot recognize on its own.

test('sanitizeProviderErrorBody: redacts a JSON api_key field (short self-hosted-style key) -- shape 1', () => {
  const out = sanitizeProviderErrorBody('{"api_key":"sk-1234567890abcd"}');
  assert.doesNotMatch(out, /sk-1234567890abcd/);
  assert.match(out, /\[redacted\]/);
});

test('sanitizeProviderErrorBody: redacts a JSON api_key field (Anthropic-style hyphenated key) -- shape 2', () => {
  const out = sanitizeProviderErrorBody(
    '{"api_key":"sk-ant-api03-AbCdEfGh-IjKlMnOp_QrStUvWx-Yz01"}',
  );
  assert.doesNotMatch(out, /sk-ant-api03-AbCdEfGh-IjKlMnOp_QrStUvWx-Yz01/);
  assert.match(out, /\[redacted\]/);
});

test('sanitizeProviderErrorBody: redacts a JSON api_key field (Groq gsk_ key) -- shape 3', () => {
  const out = sanitizeProviderErrorBody(
    '{"api_key":"gsk_AbCd1234EfGh5678IjKl"}',
  );
  assert.doesNotMatch(out, /gsk_AbCd1234EfGh5678IjKl/);
  assert.match(out, /\[redacted\]/);
});

test('sanitizeProviderErrorBody: redacts an Authorization: Bearer header shape -- shape 4 (regression guard)', () => {
  const out = sanitizeProviderErrorBody(
    'Authorization: Bearer sk-1234567890abcdef',
  );
  assert.doesNotMatch(out, /sk-1234567890abcdef/);
  assert.match(out, /\[redacted\]/);
});

test('sanitizeProviderErrorBody: redacts an x-api-key header shape -- shape 5 (regression guard)', () => {
  const out = sanitizeProviderErrorBody('x-api-key: sk-ant-1234567890abcdef');
  assert.doesNotMatch(out, /sk-ant-1234567890abcdef/);
  assert.match(out, /\[redacted\]/);
});

test('sanitizeProviderErrorBody: exact-value redaction catches a short/odd-shaped configured key the shape patterns would miss -- shape 6', () => {
  // "abc123" is 6 characters and has no recognizable prefix/header context, so it would NOT match
  // any SECRET_PATTERNS entry (the key-name pattern requires >= 8 chars for the value). Only the
  // `secret` parameter's exact-value layer can catch this.
  const out = sanitizeProviderErrorBody(
    'upstream echoed your key abc123 in the body',
    'abc123',
  );
  assert.doesNotMatch(out, /abc123/);
  assert.match(out, /\[redacted\]/);
});

test('sanitizeProviderErrorBody: an empty/absent secret does not change behavior (no crash, no spurious redaction)', () => {
  const withoutSecret = sanitizeProviderErrorBody(
    'plain message with no credentials',
    '',
  );
  const withUndefined = sanitizeProviderErrorBody(
    'plain message with no credentials',
  );
  assert.equal(withoutSecret, 'plain message with no credentials');
  assert.equal(withUndefined, 'plain message with no credentials');
});
