import assert from 'node:assert/strict';
import {
  describeOutOfCreditsMessage,
  extractProviderErrorMessage,
  fetchProviderWithRetry,
  sanitizeProviderErrorBody,
  describeToolUseFailedStreamMessage,
} from './retry';
import { setOutOfCreditsMessage } from '../plugin-services';
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

// --- Group G fix: 429 retry-budget exhaustion gets its own honest, provider-attributed, ---------
// --- mechanism-free terminal message, distinct from the generic HTTP-status dump ----------------

test(
  'fetchProviderWithRetry: 429 that never recovers (retry budget exhausted) gets a ' +
    'provider-attributed, transient-framed terminal message, not a raw HTTP-status dump',
  async () => {
    // A short explicit wait hint ("try again in 10ms") keeps the two retry backoffs this test
    // exercises fast (MIN_DELAY_MS still floors each to 500ms, well under the fallback delays'
    // 2s/8s) -- same pattern the existing "429 retries still work" test above already uses.
    const doFetch = () =>
      Promise.resolve(fakeResponse(429, 'try again in 10ms', {}));
    const controller = new AbortController();
    const { events, result } = await drain(
      fetchProviderWithRetry(doFetch, controller.signal),
    );

    assert.equal(result, undefined);
    const errorEvent = events.find(event => event.type === 'error');
    assert.ok(
      errorEvent,
      'expected a terminal error event once the retry budget is exhausted',
    );
    const message = (errorEvent as { message: string }).message;
    assert.equal(
      message,
      'The AI provider rejected this request due to rate limits — try again in a moment.',
    );
    // Mechanism-free: no retry count, backoff duration, or internal budget vocabulary.
    assert.doesNotMatch(message, /\b(retry|retries|attempt|budget)\b/i);
    // Never the raw provider body leaking through as the terminal copy.
    assert.doesNotMatch(message, /try again in 10ms/);
  },
);

test(
  'fetchProviderWithRetry: a non-429 retryable status (e.g. 503) keeps the existing generic ' +
    'HTTP-status terminal message unchanged once its retry budget is exhausted',
  async () => {
    const doFetch = () =>
      Promise.resolve(
        fakeResponse(503, 'upstream overloaded, try again in 10ms', {}),
      );
    const controller = new AbortController();
    const { events, result } = await drain(
      fetchProviderWithRetry(doFetch, controller.signal),
    );

    assert.equal(result, undefined);
    const errorEvent = events.find(event => event.type === 'error');
    assert.match(
      (errorEvent as { message: string }).message,
      /Provider responded with HTTP 503/,
    );
  },
);

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

test('describeToolUseFailedStreamMessage: a message containing failed_generation returns the friendly copy', () => {
  const out = describeToolUseFailedStreamMessage(
    "Failed to call a function. Please adjust your prompt. See 'failed_generation' for more details.",
  );
  assert.ok(out);
  assert.match(out as string, /couldn't get a valid tool call/i);
});

test('describeToolUseFailedStreamMessage: a message containing tool_use_failed returns the friendly copy', () => {
  const out = describeToolUseFailedStreamMessage('tool_use_failed: bad call');
  assert.ok(out);
  assert.match(out as string, /couldn't get a valid tool call/i);
});

test('describeToolUseFailedStreamMessage: an ordinary message with no marker returns undefined', () => {
  assert.equal(
    describeToolUseFailedStreamMessage('rate limit exceeded'),
    undefined,
  );
  assert.equal(
    describeToolUseFailedStreamMessage('invalid api key'),
    undefined,
  );
});

test('describeToolUseFailedStreamMessage: the friendly message never contains the literal failed_generation substring', () => {
  const out = describeToolUseFailedStreamMessage('failed_generation happened');
  assert.ok(out);
  assert.doesNotMatch(out as string, /failed_generation/);
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

// extractProviderErrorMessage
// "capture some cases, else display all": known JSON/HTML error shapes are unwrapped to just
// their message text; anything else falls through to the raw body unchanged.

test('extractProviderErrorMessage: unwraps an OpenAI/Groq-style {error: {message}} JSON body', () => {
  const out = extractProviderErrorMessage(
    '{"error":{"message":"Incorrect API key provided.","type":"invalid_request_error"}}',
  );
  assert.equal(out, 'Incorrect API key provided.');
});

test('extractProviderErrorMessage: does NOT unwrap a bare {error: "..."} JSON body — a sibling field could still carry something that needs redaction', () => {
  const body =
    '{"error":"bad request","echoed_body":{"api_key":"sk-should-stay-visible-here"}}';
  const out = extractProviderErrorMessage(body);
  assert.equal(out, body);
});

test('extractProviderErrorMessage: does NOT unwrap a generic top-level {message: "..."} JSON body (same ambiguous-shape reasoning)', () => {
  const body =
    '{"message":"quota exceeded","echoed_body":{"api_key":"sk-should-stay-visible-here"}}';
  const out = extractProviderErrorMessage(body);
  assert.equal(out, body);
});

test("extractProviderErrorMessage: extracts an HTML error page's <title>", () => {
  const out = extractProviderErrorMessage(
    '<html><head><title>502 Bad Gateway</title></head><body><center>nginx</center></body></html>',
  );
  assert.equal(out, '502 Bad Gateway');
});

test('extractProviderErrorMessage: falls back to tag-stripped text for HTML without a <title>', () => {
  const out = extractProviderErrorMessage(
    '<html><body><h1>Access Denied</h1></body></html>',
  );
  assert.equal(out, 'Access Denied');
});

test('extractProviderErrorMessage: decodes HTML entities in the extracted title', () => {
  const out = extractProviderErrorMessage(
    '<html><head><title>Bad Request &amp; Forbidden</title></head></html>',
  );
  assert.equal(out, 'Bad Request & Forbidden');
});

test('extractProviderErrorMessage: passes through plain text unchanged (display all)', () => {
  const out = extractProviderErrorMessage('upstream timeout');
  assert.equal(out, 'upstream timeout');
});

test('extractProviderErrorMessage: passes through an unrecognized JSON shape unchanged (display all)', () => {
  const out = extractProviderErrorMessage(
    '{"code":503,"detail":"unavailable"}',
  );
  assert.equal(out, '{"code":503,"detail":"unavailable"}');
});

test('extractProviderErrorMessage: passes through malformed/truncated JSON unchanged rather than throwing', () => {
  const out = extractProviderErrorMessage('{"error":{"message":"cut off...');
  assert.equal(out, '{"error":{"message":"cut off...');
});

test('extractProviderErrorMessage: an extracted JSON message is still redacted downstream by sanitizeProviderErrorBody (secret passthrough)', () => {
  const extracted = extractProviderErrorMessage(
    '{"error":{"message":"key sk-abc123def456ghi789 is invalid"}}',
  );
  const sanitized = sanitizeProviderErrorBody(
    extracted,
    'sk-abc123def456ghi789',
  );
  assert.doesNotMatch(sanitized, /sk-abc123def456ghi789/);
  assert.match(sanitized, /\[redacted\]/);
});

// --- Out-of-credits override: a detected out-of-credits provider response gets --------------
// --- server/config.ts's `outOfCreditsMessage` substituted for its terminal text when one is ----
// --- configured, and keeps its normal text otherwise -- see describeOutOfCreditsMessage's -------
// --- doc comment in retry.ts. ---------------------------------------------------------------

afterEach(() => {
  setOutOfCreditsMessage(undefined);
});

const ANTHROPIC_LOW_BALANCE_BODY = JSON.stringify({
  type: 'error',
  error: {
    type: 'invalid_request_error',
    message: 'Your credit balance is too low to access the Claude API.',
  },
});

test('fetchProviderWithRetry: an out-of-credits 400 with no override configured keeps the existing raw-body message shape (no behavior change)', async () => {
  const doFetch = () =>
    Promise.resolve(fakeResponse(400, ANTHROPIC_LOW_BALANCE_BODY));
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  const message = (events[0] as { message: string }).message;
  assert.match(message, /Provider responded with HTTP 400/);
  assert.match(message, /credit balance is too low/i);
});

test('fetchProviderWithRetry: an out-of-credits 400 with an override configured yields the configured message instead of the raw provider text', async () => {
  setOutOfCreditsMessage(
    'Your organization is out of credits. [Add credits](https://example.com/billing).',
  );
  const doFetch = () =>
    Promise.resolve(fakeResponse(400, ANTHROPIC_LOW_BALANCE_BODY));
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
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

test('fetchProviderWithRetry: an override configured but the failure is NOT out-of-credits leaves the normal error text untouched', async () => {
  setOutOfCreditsMessage('Your organization is out of credits.');
  const doFetch = () =>
    Promise.resolve(
      fakeResponse(400, '{"error":{"message":"bad request: missing field"}}'),
    );
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(events.length, 1);
  const message = (events[0] as { message: string }).message;
  assert.match(message, /Provider responded with HTTP 400/);
  assert.doesNotMatch(
    message,
    /out of credits/i,
    'an unrelated failure must never be reframed as an out-of-credits one',
  );
});

test('fetchProviderWithRetry: an out-of-credits marker on a normally-retryable 429 is not retried', async () => {
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    return Promise.resolve(
      fakeResponse(
        429,
        '{"error":{"code":"insufficient_quota","message":"You exceeded your current quota."}}',
      ),
    );
  };
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(
    calls,
    1,
    'an out-of-credits condition can never be fixed by retrying, so it must not consume the 429 retry budget',
  );
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
});

test('describeOutOfCreditsMessage: a matching body with nothing configured returns the default message unchanged', () => {
  assert.equal(
    describeOutOfCreditsMessage(
      400,
      ANTHROPIC_LOW_BALANCE_BODY,
      'default text',
    ),
    'default text',
  );
});

test('describeOutOfCreditsMessage: a matching body with an override configured returns the override', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      400,
      ANTHROPIC_LOW_BALANCE_BODY,
      'default text',
    ),
    'custom text',
  );
});

test('describeOutOfCreditsMessage: a non-matching body returns the default message even with an override configured', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      400,
      '{"error":{"message":"bad request"}}',
      'default text',
    ),
    'default text',
  );
});

test('describeOutOfCreditsMessage: detects the OpenAI-compatible insufficient_quota marker case-insensitively', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      429,
      '{"error":{"code":"INSUFFICIENT_QUOTA","message":"You exceeded your current quota."}}',
      'default text',
    ),
    'custom text',
  );
});

// --- Detection across the providers this plugin can be pointed at. Each body below is the shape
// --- that provider actually returns; the two transient cases at the end guard the boundary that
// --- matters most -- a recoverable throttle must never be reframed as a terminal billing error.

test('describeOutOfCreditsMessage: a 402 is treated as out-of-credits on status alone, whatever the body says', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(402, 'Payment Required', 'default text'),
    'custom text',
    '402 is the status HTTP defines for this, so it needs no marker in the body',
  );
});

test('describeOutOfCreditsMessage: detects DeepSeek’s 402 "Insufficient Balance"', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      402,
      '{"error":{"message":"Insufficient Balance","type":"unknown_error","code":"invalid_request_error"}}',
      'default text',
    ),
    'custom text',
  );
});

test('describeOutOfCreditsMessage: detects OpenRouter’s 402 "Insufficient credits"', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      402,
      '{"error":{"code":402,"message":"Insufficient credits. This account never purchased credits."}}',
      'default text',
    ),
    'custom text',
  );
});

test('describeOutOfCreditsMessage: detects the Vercel AI Gateway "Insufficient funds" wording', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      402,
      '{"error":{"message":"Insufficient funds. Add credits to your account to continue using AI services."}}',
      'default text',
    ),
    'custom text',
  );
});

test('describeOutOfCreditsMessage: detects an "insufficient balance" body even when the provider does not use 402', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      400,
      '{"error":{"message":"Insufficient Balance"}}',
      'default text',
    ),
    'custom text',
    'the text markers must still cover providers that report the condition on another status',
  );
});

test('describeOutOfCreditsMessage: a Groq rate-limit 429 is NOT out-of-credits', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      429,
      '{"error":{"message":"Rate limit reached for model llama-3.3-70b-versatile on tokens per minute (TPM): Limit 6000, Used 5800.","type":"tokens","code":"rate_limit_exceeded"}}',
      'default text',
    ),
    'default text',
  );
});

test('describeOutOfCreditsMessage: a Gemini RESOURCE_EXHAUSTED 429 is NOT out-of-credits despite carrying the same "exceeded your current quota" text as OpenAI', () => {
  setOutOfCreditsMessage('custom text');
  assert.equal(
    describeOutOfCreditsMessage(
      429,
      '{"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details.","status":"RESOURCE_EXHAUSTED"}}',
      'default text',
    ),
    'default text',
    'Gemini reuses OpenAI’s wording for a per-minute limit that resets on its own; only the underscored insufficient_quota code marks a real billing failure',
  );
});

test('fetchProviderWithRetry: a 402 is never retried and yields the configured message', async () => {
  setOutOfCreditsMessage(
    'Out of credits. [Top up](https://example.com/billing).',
  );
  let calls = 0;
  const doFetch = () => {
    calls += 1;
    return Promise.resolve(
      fakeResponse(402, '{"error":{"message":"Insufficient Balance"}}'),
    );
  };
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(calls, 1, '402 is terminal, so it must not be retried');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'error');
  assert.equal(
    (events[0] as { message: string }).message,
    'Out of credits. [Top up](https://example.com/billing).',
  );
});

test('fetchProviderWithRetry: a 402 with no override configured keeps the raw-body message shape', async () => {
  const doFetch = () =>
    Promise.resolve(
      fakeResponse(402, '{"error":{"message":"Insufficient Balance"}}'),
    );
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(events.length, 1);
  const message = (events[0] as { message: string }).message;
  assert.match(message, /Provider responded with HTTP 402/);
  assert.match(message, /Insufficient Balance/i);
});

// --- A blank override counts as unconfigured. `??` alone would pass an empty YAML value straight
// --- through and render an error bubble with no text, which is worse than the provider's own
// --- message -- see describeOutOfCreditsMessage's doc comment.

test('describeOutOfCreditsMessage: an empty override falls back to the default instead of rendering a blank error', () => {
  setOutOfCreditsMessage('');
  assert.equal(
    describeOutOfCreditsMessage(402, 'Payment Required', 'default text'),
    'default text',
  );
});

test('describeOutOfCreditsMessage: a whitespace-only override falls back to the default', () => {
  setOutOfCreditsMessage('   \n\t  ');
  assert.equal(
    describeOutOfCreditsMessage(402, 'Payment Required', 'default text'),
    'default text',
  );
});

test('describeOutOfCreditsMessage: a configured message is trimmed of surrounding whitespace', () => {
  setOutOfCreditsMessage('  Out of credits.  ');
  assert.equal(
    describeOutOfCreditsMessage(402, 'Payment Required', 'default text'),
    'Out of credits.',
  );
});

test('fetchProviderWithRetry: an empty override still shows the provider text rather than an empty error', async () => {
  setOutOfCreditsMessage('');
  const doFetch = () =>
    Promise.resolve(
      fakeResponse(402, '{"error":{"message":"Insufficient Balance"}}'),
    );
  const controller = new AbortController();
  const { events } = await drain(
    fetchProviderWithRetry(doFetch, controller.signal),
  );

  assert.equal(events.length, 1);
  const message = (events[0] as { message: string }).message;
  assert.notEqual(message.trim(), '', 'the user must never get a blank error');
  assert.match(message, /Provider responded with HTTP 402/);
});
