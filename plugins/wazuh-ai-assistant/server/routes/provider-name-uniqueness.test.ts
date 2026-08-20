import assert from 'node:assert/strict';
import {
  duplicateProviderNameMessage,
  rejectDuplicateProviderName,
} from './settings';

/**
 * `rejectDuplicateProviderName` is the uniqueness gate POST /providers and PUT /providers/{id}
 * (server/routes/settings.ts) run before any document write: a name already taken by ANOTHER
 * provider is refused with HTTP 409, so two providers can never end up indistinguishable in the
 * chat's provider selector. Comparison is trim + lowercase, and the provider being updated is
 * excluded so re-saving it never collides with itself.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * Same convention as provider-encryption-gate.test.ts and manager-session-check.test.ts: there is
 * no request/response-mocking harness for OpenSearch Dashboards routes in this plugin, so this
 * exercises the gate directly, mocking only what it touches
 * (`context.wazuh_ai_assistant.aiProviders.list` and `response.customError`) and using
 * `Parameters<typeof rejectDuplicateProviderName>` to pick up the real OSD parameter types without
 * importing them from the (here, unavailable) `../../../../src/core/server` tree.
 */

type Context = Parameters<typeof rejectDuplicateProviderName>[0];
type ResponseFactory = Parameters<typeof rejectDuplicateProviderName>[3];

/** Mirrors the `{ providers, total }` shape `AiProvidersClient.list` resolves with — only `id` and
 * `attributes.name` are read by the gate. Pages honestly, so a store larger than the gate's
 * first-page size exercises its re-read branch rather than silently returning everything. */
function fakeContext(
  names: Array<{ id: string; name: string }>,
  listCalls: Array<{ page: number; perPage: number }> = [],
): Context {
  return {
    wazuh_ai_assistant: {
      aiProviders: {
        list: (_context: unknown, page: number, perPage: number) => {
          listCalls.push({ page, perPage });
          const start = (page - 1) * perPage;
          return Promise.resolve({
            providers: names
              .slice(start, start + perPage)
              .map(({ id, name }) => ({
                id,
                attributes: { name },
              })),
            total: names.length,
          });
        },
      },
    },
  } as unknown as Context;
}

function fakeResponse(): {
  calls: Array<{ statusCode: number; body: { message: string } }>;
  factory: ResponseFactory;
} {
  const calls: Array<{ statusCode: number; body: { message: string } }> = [];
  const factory = {
    customError(options: { statusCode: number; body: { message: string } }) {
      calls.push(options);
      return { status: options.statusCode, ...options };
    },
  } as unknown as ResponseFactory;
  return { calls, factory };
}

const EXISTING = [
  { id: 'p1', name: 'OpenAI production' },
  { id: 'p2', name: 'Claude staging' },
];

test('create: a name already taken by another provider is refused with 409', async () => {
  const { calls, factory } = fakeResponse();

  const result = await rejectDuplicateProviderName(
    fakeContext(EXISTING),
    'OpenAI production',
    undefined,
    factory,
  );

  assert.ok(result, 'the gate must return a response, not null');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].statusCode, 409);
  assert.equal(
    calls[0].body.message,
    duplicateProviderNameMessage('OpenAI production'),
  );
});

test('create: an unused name passes with no response built', async () => {
  const { calls, factory } = fakeResponse();

  assert.equal(
    await rejectDuplicateProviderName(
      fakeContext(EXISTING),
      'Gemini lab',
      undefined,
      factory,
    ),
    null,
  );
  assert.equal(calls.length, 0, 'no error response may be built');
});

test('create: the match ignores casing and surrounding whitespace', async () => {
  const candidates = [
    'openai production',
    'OPENAI PRODUCTION',
    '  OpenAI production  ',
    ' openai PRODUCTION ',
  ];

  const outcomes = await Promise.all(
    candidates.map(async candidate => {
      const { calls, factory } = fakeResponse();
      const result = await rejectDuplicateProviderName(
        fakeContext(EXISTING),
        candidate,
        undefined,
        factory,
      );
      return { candidate, calls, result };
    }),
  );

  for (const { candidate, calls, result } of outcomes) {
    assert.ok(result, `"${candidate}" must be refused`);
    assert.equal(calls[0].statusCode, 409);
    // The message echoes the TRIMMED name the caller sent, not the stored one.
    assert.equal(
      calls[0].body.message,
      duplicateProviderNameMessage(candidate.trim()),
    );
  }
});

test('create: a stored name with stray whitespace still collides', async () => {
  const { factory } = fakeResponse();

  const result = await rejectDuplicateProviderName(
    fakeContext([{ id: 'p1', name: '  Padded name ' }]),
    'padded name',
    undefined,
    factory,
  );

  assert.ok(result, 'stored-side whitespace must be normalized too');
});

test('update: renaming onto another provider name is refused with 409', async () => {
  const { calls, factory } = fakeResponse();

  const result = await rejectDuplicateProviderName(
    fakeContext(EXISTING),
    'Claude staging',
    'p1',
    factory,
  );

  assert.ok(result, 'the gate must return a response, not null');
  assert.equal(calls[0].statusCode, 409);
  assert.equal(
    calls[0].body.message,
    duplicateProviderNameMessage('Claude staging'),
  );
});

test('update: keeping the provider own name is allowed — no self-collision', async () => {
  const { calls, factory } = fakeResponse();

  assert.equal(
    await rejectDuplicateProviderName(
      fakeContext(EXISTING),
      'OpenAI production',
      'p1',
      factory,
    ),
    null,
  );
  assert.equal(calls.length, 0, 'no error response may be built');
});

test('update: re-casing the provider own name is allowed', async () => {
  const { factory } = fakeResponse();

  assert.equal(
    await rejectDuplicateProviderName(
      fakeContext(EXISTING),
      'openai PRODUCTION',
      'p1',
      factory,
    ),
    null,
  );
});

test('the very first provider (empty store) is never a duplicate', async () => {
  const { factory } = fakeResponse();

  assert.equal(
    await rejectDuplicateProviderName(
      fakeContext([]),
      'Anything',
      undefined,
      factory,
    ),
    null,
  );
});

test('a name held by provider #201+ still collides: the whole store is scanned', async () => {
  // M3: the first read is capped at 200 (matching `clearOtherDefaults`), but `total` says there are
  // more, so the gate re-reads everything. Without that, provider #201's name was never compared —
  // and the client-side pre-check DOES compare it (fetchAllPages), so the two disagreed.
  const many = Array.from({ length: 260 }, (_value, index) => ({
    id: `p${index}`,
    name: `provider-${index}`,
  }));
  const listCalls: Array<{ page: number; perPage: number }> = [];
  const { calls, factory } = fakeResponse();

  const result = await rejectDuplicateProviderName(
    fakeContext(many, listCalls),
    'PROVIDER-255',
    undefined,
    factory,
  );

  assert.ok(result, 'a name beyond the first page must still be refused');
  assert.equal(calls[0].statusCode, 409);
  assert.deepEqual(listCalls, [
    { page: 1, perPage: 200 },
    { page: 1, perPage: 260 },
  ]);
});

test('a store that fits the first page is read exactly once', async () => {
  const listCalls: Array<{ page: number; perPage: number }> = [];
  const { factory } = fakeResponse();

  await rejectDuplicateProviderName(
    fakeContext(EXISTING, listCalls),
    'Gemini lab',
    undefined,
    factory,
  );

  assert.deepEqual(listCalls, [{ page: 1, perPage: 200 }]);
});

test('the 409 message names the offending provider and stays actionable', () => {
  const message = duplicateProviderNameMessage('OpenAI production');
  assert.match(message, /OpenAI production/);
  assert.match(message, /already exists/);
  // Never reference repo files in operator-facing copy (same rule as ENCRYPTION_REQUIRED_MESSAGE).
  assert.doesNotMatch(message, /server\/|public\/|\.ts\b/);
});
