import assert from 'node:assert/strict';

/**
 * Proves the duplicate-name gate is actually WIRED INTO the provider routes, not merely exported.
 * `provider-name-uniqueness.test.ts` next to this file covers the gate's own comparison logic; the
 * gap this file closes is that deleting the two `if (duplicateName) { return duplicateName; }`
 * blocks in server/routes/settings.ts left that suite entirely green.
 *
 * So this drives the REAL handlers: `registerSettingsRoutes` is called with a fake `IRouter` that
 * captures every registered handler by method+path, and the POST/PUT handlers are then invoked
 * directly. Beyond the 409 status, the load-bearing assertion is the ORDERING invariant — on a
 * duplicate, `aiProviders.create`/`update` must never be called at all, so a rejected request
 * leaves nothing half-written.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * The URL guard is mocked because `assertProviderUrlAllowed` performs a real DNS lookup for the
 * baseUrl (server/providers/url-guard.ts) — irrelevant to name uniqueness, and a test that needs
 * working DNS is a flaky test. Its own behavior is covered by server/providers/url-guard.test.ts.
 */
jest.mock('../providers/url-guard', () => ({
  assertProviderUrlAllowed: jest.fn().mockResolvedValue(undefined),
}));

import { registerSettingsRoutes } from './settings';
import { API_PATHS } from '../../common/constants';

type CapturedHandler = (
  context: unknown,
  request: unknown,
  response: unknown,
) => Promise<unknown>;

interface RecordedResponse {
  kind: 'ok' | 'customError' | 'badRequest' | 'notFound';
  statusCode?: number;
  body?: { message?: string };
}

/** Collects the handlers `registerSettingsRoutes` registers, keyed `METHOD path`. */
function captureRoutes(): {
  handlers: Map<string, CapturedHandler>;
} {
  const handlers = new Map<string, CapturedHandler>();
  const record =
    (method: string) =>
    (config: { path: string }, handler: CapturedHandler) => {
      handlers.set(`${method} ${config.path}`, handler);
    };
  const router = {
    get: record('GET'),
    post: record('POST'),
    put: record('PUT'),
    delete: record('DELETE'),
  };
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  registerSettingsRoutes(
    router as unknown as Parameters<typeof registerSettingsRoutes>[0],
    logger as unknown as Parameters<typeof registerSettingsRoutes>[1],
  );
  return { handlers };
}

/** Records what the handler answered with, so the test can assert on status AND body. */
function fakeResponse(): {
  calls: RecordedResponse[];
  factory: unknown;
} {
  const calls: RecordedResponse[] = [];
  const factory = {
    ok(options?: { body?: unknown }) {
      calls.push({ kind: 'ok', statusCode: 200, body: options?.body as never });
      return { status: 200 };
    },
    customError(options: { statusCode: number; body?: { message?: string } }) {
      calls.push({
        kind: 'customError',
        statusCode: options.statusCode,
        body: options.body,
      });
      return { status: options.statusCode };
    },
    badRequest(options?: { body?: { message?: string } }) {
      calls.push({ kind: 'badRequest', statusCode: 400, body: options?.body });
      return { status: 400 };
    },
    notFound() {
      calls.push({ kind: 'notFound', statusCode: 404 });
      return { status: 404 };
    },
  };
  return { calls, factory };
}

interface StoredProvider {
  id: string;
  name: string;
}

/** A provider store with the three methods these two handlers reach for. `create`/`update` are
 * jest mocks so the "no write on rejection" invariant is directly observable. */
function fakeProviderStore(existing: StoredProvider[]) {
  const create = jest.fn().mockResolvedValue(undefined);
  const update = jest.fn().mockResolvedValue(undefined);
  const listCalls: Array<{ page: number; perPage: number }> = [];
  const aiProviders = {
    list: (_context: unknown, page: number, perPage: number) => {
      listCalls.push({ page, perPage });
      return Promise.resolve({
        providers: existing
          .slice((page - 1) * perPage, (page - 1) * perPage + perPage)
          .map(({ id, name }) => ({ id, attributes: { name } })),
        total: existing.length,
      });
    },
    count: () => Promise.resolve(existing.length),
    get: (_context: unknown, id: string) => {
      const found = existing.find(provider => provider.id === id);
      return Promise.resolve(
        found ? { id: found.id, attributes: { name: found.name } } : undefined,
      );
    },
    create,
    update,
  };
  return { aiProviders, create, update, listCalls };
}

const VALID_BODY = {
  type: 'openai_compatible' as const,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
};

const EXISTING = [
  { id: 'p1', name: 'OpenAI production' },
  { id: 'p2', name: 'Claude staging' },
];

test('POST /providers: a duplicate name is refused with 409 and nothing is created', async () => {
  const { handlers } = captureRoutes();
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post, 'POST /providers must be registered');
  const store = fakeProviderStore(EXISTING);
  const { calls, factory } = fakeResponse();

  await post(
    { wazuh_ai_assistant: store },
    { body: { ...VALID_BODY, name: 'Claude staging' } },
    factory,
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].statusCode, 409);
  assert.match(String(calls[0].body?.message), /already exists/);
  // The ordering invariant: rejection happens BEFORE any document write.
  assert.equal(store.create.mock.calls.length, 0, 'no provider may be created');
});

test('POST /providers: the same name in another casing/spacing is also refused', async () => {
  const { handlers } = captureRoutes();
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post);
  const store = fakeProviderStore(EXISTING);
  const { calls, factory } = fakeResponse();

  await post(
    { wazuh_ai_assistant: store },
    { body: { ...VALID_BODY, name: '  claude STAGING ' } },
    factory,
  );

  assert.equal(calls[0].statusCode, 409);
  assert.equal(store.create.mock.calls.length, 0);
});

test('POST /providers: an unused name is created, with the name stored trimmed', async () => {
  const { handlers } = captureRoutes();
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post);
  const store = fakeProviderStore(EXISTING);
  const { calls, factory } = fakeResponse();

  await post(
    { wazuh_ai_assistant: store },
    { body: { ...VALID_BODY, name: '  Gemini lab  ' } },
    factory,
  );

  assert.equal(calls[0].statusCode, 200, 'the create must succeed');
  assert.equal(store.create.mock.calls.length, 1);
  // L9: what is STORED matches what the uniqueness check compared.
  assert.equal(store.create.mock.calls[0][2].name, 'Gemini lab');
});

test('POST /providers: a whitespace-only name is a 400 and creates nothing', async () => {
  const { handlers } = captureRoutes();
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post);
  const store = fakeProviderStore(EXISTING);
  const { calls, factory } = fakeResponse();

  await post(
    { wazuh_ai_assistant: store },
    { body: { ...VALID_BODY, name: '   ' } },
    factory,
  );

  assert.equal(calls[0].statusCode, 400);
  assert.equal(store.create.mock.calls.length, 0);
});

test('POST /providers: every provider is compared, not just the first page of 200', async () => {
  // M3: the client pre-check compares against the FULL list (fetchAllPages), so a server that only
  // scanned the first page would disagree with it and let provider #201's name through.
  const many = Array.from({ length: 250 }, (_value, index) => ({
    id: `p${index}`,
    name: `provider-${index}`,
  }));
  const { handlers } = captureRoutes();
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post);
  const store = fakeProviderStore(many);
  const { calls, factory } = fakeResponse();

  await post(
    { wazuh_ai_assistant: store },
    { body: { ...VALID_BODY, name: 'provider-240' } },
    factory,
  );

  assert.equal(calls[0].statusCode, 409, 'provider #241 must still collide');
  assert.equal(store.create.mock.calls.length, 0);
  // Proof of the mechanism: a capped first read, then a full re-read once `total` exceeded it.
  assert.deepEqual(store.listCalls, [
    { page: 1, perPage: 200 },
    { page: 1, perPage: 250 },
  ]);
});

test('POST /providers: a store within the first page is read exactly once', async () => {
  const { handlers } = captureRoutes();
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post);
  const store = fakeProviderStore(EXISTING);
  const { factory } = fakeResponse();

  await post(
    { wazuh_ai_assistant: store },
    { body: { ...VALID_BODY, name: 'Gemini lab' } },
    factory,
  );

  assert.deepEqual(store.listCalls, [{ page: 1, perPage: 200 }]);
});

test('PUT /providers/{id}: renaming onto another provider name is 409 with no write', async () => {
  const { handlers } = captureRoutes();
  const put = handlers.get(`PUT ${API_PATHS.PROVIDER_BY_ID('{id}')}`);
  assert.ok(put, 'PUT /providers/{id} must be registered');
  const store = fakeProviderStore(EXISTING);
  const { calls, factory } = fakeResponse();

  await put(
    { wazuh_ai_assistant: store },
    { params: { id: 'p1' }, body: { ...VALID_BODY, name: 'Claude staging' } },
    factory,
  );

  assert.equal(calls[0].statusCode, 409);
  assert.match(String(calls[0].body?.message), /already exists/);
  assert.equal(store.update.mock.calls.length, 0, 'no provider may be updated');
});

test('PUT /providers/{id}: keeping the provider own name writes normally', async () => {
  const { handlers } = captureRoutes();
  const put = handlers.get(`PUT ${API_PATHS.PROVIDER_BY_ID('{id}')}`);
  assert.ok(put);
  const store = fakeProviderStore(EXISTING);
  const { calls, factory } = fakeResponse();

  await put(
    { wazuh_ai_assistant: store },
    {
      params: { id: 'p1' },
      body: { ...VALID_BODY, name: '  OpenAI production  ' },
    },
    factory,
  );

  assert.equal(calls[0].statusCode, 200);
  assert.equal(store.update.mock.calls.length, 1);
  assert.equal(store.update.mock.calls[0][2].name, 'OpenAI production');
});
