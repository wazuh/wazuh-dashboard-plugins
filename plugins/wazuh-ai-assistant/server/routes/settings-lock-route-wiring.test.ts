import assert from 'node:assert/strict';

/**
 * Proves `requireSettingsUnlocked` (settings-lock-gate.test.ts covers its own logic) is actually
 * WIRED INTO every settings/provider write route in server/routes/settings.ts — POST /providers,
 * PUT /providers/{id}, POST /providers/{id}/default, DELETE /providers/{id}, PUT /settings — and
 * that the three routes deliberately left ungated (GET /providers, GET /settings, POST
 * /providers/{id}/test) still work normally while `wazuh_ai_assistant.settingsReadOnly` is set.
 *
 * Same drive-the-real-handlers approach as provider-name-route-wiring.test.ts: `registerSettingsRoutes`
 * is called with a fake `IRouter` that captures every registered handler by method+path, and the
 * handlers are then invoked directly. Beyond the 403 status, the load-bearing assertion is the
 * ORDERING invariant — while locked, the underlying store's write methods must never be called at
 * all, so a rejected request leaves nothing half-written.
 *
 * Runs under the platform Jest runner only: server/routes/settings.ts imports `@osd/config-schema`
 * as a runtime value (`schema.object(...)`, not just types), which resolves only inside a full
 * wazuh-dashboard checkout.
 *
 * The URL guard is mocked because `assertProviderUrlAllowed` performs a real DNS lookup for the
 * baseUrl (server/providers/url-guard.ts) — irrelevant to the lock, and a test that needs working
 * DNS is a flaky test. Its own behavior is covered by server/providers/url-guard.test.ts.
 */
jest.mock('../providers/url-guard', () => ({
  assertProviderUrlAllowed: jest.fn().mockResolvedValue(undefined),
}));

import { registerSettingsRoutes } from './settings';
import { API_PATHS } from '../../common/constants';
import { setSettingsReadOnly } from '../plugin-services';

type CapturedHandler = (
  context: unknown,
  request: unknown,
  response: unknown,
) => Promise<unknown>;

interface RecordedResponse {
  kind: 'ok' | 'customError' | 'badRequest' | 'notFound' | 'forbidden';
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
    forbidden(options?: { body?: { message?: string } }) {
      calls.push({ kind: 'forbidden', statusCode: 403, body: options?.body });
      return { status: 403 };
    },
  };
  return { calls, factory };
}

interface StoredProvider {
  id: string;
  name: string;
}

/** A provider store with the methods these handlers reach for. `create`/`update`/`delete` are
 * jest mocks so the "no write while locked" invariant is directly observable. */
function fakeProviderStore(existing: StoredProvider[]) {
  const create = jest.fn().mockResolvedValue(undefined);
  const update = jest.fn().mockResolvedValue(undefined);
  const del = jest.fn().mockResolvedValue(undefined);
  const aiProviders = {
    list: (_context: unknown, page: number, perPage: number) =>
      Promise.resolve({
        providers: existing
          .slice((page - 1) * perPage, (page - 1) * perPage + perPage)
          .map(({ id, name }) => ({
            id,
            attributes: {
              name,
              type: 'openai_compatible',
              baseUrl: '',
              model: '',
            },
          })),
        total: existing.length,
      }),
    count: () => Promise.resolve(existing.length),
    get: (_context: unknown, id: string) => {
      const found = existing.find(provider => provider.id === id);
      return Promise.resolve(
        found
          ? {
              id: found.id,
              attributes: {
                name: found.name,
                type: 'openai_compatible',
                baseUrl: 'https://api.openai.com/v1',
                model: 'gpt-4o',
              },
            }
          : undefined,
      );
    },
    create,
    update,
    delete: del,
  };
  return { aiProviders, create, update, delete: del };
}

/** A settings singleton store with the two methods PUT/GET /settings reach for. */
function fakeAssistantSettings() {
  const getOrCreateSettings = jest.fn().mockResolvedValue({});
  const updateSettings = jest.fn().mockResolvedValue({});
  return {
    assistantSettings: { getOrCreateSettings, updateSettings },
    getOrCreateSettings,
    updateSettings,
  };
}

const VALID_PROVIDER_BODY = {
  name: 'OpenAI production',
  type: 'openai_compatible' as const,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
};

const VALID_SETTINGS_BODY = {
  privacyDefaultOn: false,
  privacyDefaultPerProvider: {},
  userCanOverride: true,
  fieldPolicy: [],
  conversationRetentionDays: 30,
};

const EXISTING = [{ id: 'p1', name: 'OpenAI production' }];

afterEach(() => {
  setSettingsReadOnly(false);
});

describe('while settingsReadOnly is true', () => {
  test('POST /providers is refused with 403 and nothing is created', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
    assert.ok(post, 'POST /providers must be registered');
    const store = fakeProviderStore(EXISTING);
    const { calls, factory } = fakeResponse();

    await post(
      { wazuh_ai_assistant: store },
      { body: { ...VALID_PROVIDER_BODY, name: 'A new one' } },
      factory,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'forbidden');
    assert.equal(store.create.mock.calls.length, 0);
  });

  test('PUT /providers/{id} is refused with 403 and nothing is updated', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const put = handlers.get(`PUT ${API_PATHS.PROVIDER_BY_ID('{id}')}`);
    assert.ok(put, 'PUT /providers/{id} must be registered');
    const store = fakeProviderStore(EXISTING);
    const { calls, factory } = fakeResponse();

    await put(
      { wazuh_ai_assistant: store },
      { params: { id: 'p1' }, body: VALID_PROVIDER_BODY },
      factory,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'forbidden');
    assert.equal(store.update.mock.calls.length, 0);
  });

  test('POST /providers/{id}/default is refused with 403 and nothing is updated', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const setDefault = handlers.get(
      `POST ${API_PATHS.PROVIDER_SET_DEFAULT('{id}')}`,
    );
    assert.ok(setDefault, 'POST /providers/{id}/default must be registered');
    const store = fakeProviderStore(EXISTING);
    const { calls, factory } = fakeResponse();

    await setDefault(
      { wazuh_ai_assistant: store },
      { params: { id: 'p1' } },
      factory,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'forbidden');
    assert.equal(store.update.mock.calls.length, 0);
  });

  test('DELETE /providers/{id} is refused with 403 and nothing is deleted', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const del = handlers.get(`DELETE ${API_PATHS.PROVIDER_BY_ID('{id}')}`);
    assert.ok(del, 'DELETE /providers/{id} must be registered');
    const store = fakeProviderStore(EXISTING);
    const { calls, factory } = fakeResponse();

    await del({ wazuh_ai_assistant: store }, { params: { id: 'p1' } }, factory);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'forbidden');
    assert.equal(store.delete.mock.calls.length, 0);
  });

  test('PUT /settings is refused with 403 and nothing is written', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const put = handlers.get(`PUT ${API_PATHS.SETTINGS}`);
    assert.ok(put, 'PUT /settings must be registered');
    const { assistantSettings, getOrCreateSettings, updateSettings } =
      fakeAssistantSettings();
    const { calls, factory } = fakeResponse();

    await put(
      { wazuh_ai_assistant: { assistantSettings } },
      { body: VALID_SETTINGS_BODY },
      factory,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'forbidden');
    assert.equal(getOrCreateSettings.mock.calls.length, 0);
    assert.equal(updateSettings.mock.calls.length, 0);
  });

  test('GET /providers still succeeds (reads are never locked)', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const get = handlers.get(`GET ${API_PATHS.PROVIDERS}`);
    assert.ok(get, 'GET /providers must be registered');
    const store = fakeProviderStore(EXISTING);
    const { calls, factory } = fakeResponse();

    await get(
      { wazuh_ai_assistant: store },
      { query: { page: 1, perPage: 100 } },
      factory,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'ok');
  });

  test('GET /settings still succeeds (reads are never locked)', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const get = handlers.get(`GET ${API_PATHS.SETTINGS}`);
    assert.ok(get, 'GET /settings must be registered');
    const { assistantSettings } = fakeAssistantSettings();
    const { calls, factory } = fakeResponse();

    await get({ wazuh_ai_assistant: { assistantSettings } }, {}, factory);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'ok');
  });

  test('POST /providers/{id}/test still runs (persists nothing, never locked)', async () => {
    setSettingsReadOnly(true);
    const { handlers } = captureRoutes();
    const testRoute = handlers.get(`POST ${API_PATHS.PROVIDER_TEST('{id}')}`);
    assert.ok(testRoute, 'POST /providers/{id}/test must be registered');
    // An unknown id short-circuits to 404 before any adapter/network call — enough to prove this
    // route was reached at all (a 403 would mean the lock wrongly gated it).
    const store = fakeProviderStore([]);
    const { calls, factory } = fakeResponse();

    await testRoute(
      { wazuh_ai_assistant: store },
      { params: { id: 'missing' } },
      factory,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'notFound');
  });
});

describe('while settingsReadOnly is false', () => {
  test('POST /providers, PUT /providers/{id}, POST default, DELETE, and PUT /settings all proceed normally', async () => {
    setSettingsReadOnly(false);
    const { handlers } = captureRoutes();
    const store = fakeProviderStore(EXISTING);
    const { assistantSettings, updateSettings } = fakeAssistantSettings();

    const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
    assert.ok(post);
    const postResponse = fakeResponse();
    await post(
      { wazuh_ai_assistant: store },
      { body: { ...VALID_PROVIDER_BODY, name: 'A new one' } },
      postResponse.factory,
    );
    assert.equal(postResponse.calls[0].kind, 'ok');
    assert.equal(store.create.mock.calls.length, 1);

    const put = handlers.get(`PUT ${API_PATHS.PROVIDER_BY_ID('{id}')}`);
    assert.ok(put);
    const putResponse = fakeResponse();
    await put(
      { wazuh_ai_assistant: store },
      { params: { id: 'p1' }, body: VALID_PROVIDER_BODY },
      putResponse.factory,
    );
    assert.equal(putResponse.calls[0].kind, 'ok');
    assert.equal(store.update.mock.calls.length, 1);

    const setDefault = handlers.get(
      `POST ${API_PATHS.PROVIDER_SET_DEFAULT('{id}')}`,
    );
    assert.ok(setDefault);
    const defaultResponse = fakeResponse();
    await setDefault(
      { wazuh_ai_assistant: store },
      { params: { id: 'p1' } },
      defaultResponse.factory,
    );
    assert.equal(defaultResponse.calls[0].kind, 'ok');

    const del = handlers.get(`DELETE ${API_PATHS.PROVIDER_BY_ID('{id}')}`);
    assert.ok(del);
    const deleteResponse = fakeResponse();
    await del(
      { wazuh_ai_assistant: store },
      { params: { id: 'p1' } },
      deleteResponse.factory,
    );
    assert.equal(deleteResponse.calls[0].kind, 'ok');
    assert.equal(store.delete.mock.calls.length, 1);

    const putSettings = handlers.get(`PUT ${API_PATHS.SETTINGS}`);
    assert.ok(putSettings);
    const settingsResponse = fakeResponse();
    await putSettings(
      { wazuh_ai_assistant: { assistantSettings } },
      { body: VALID_SETTINGS_BODY },
      settingsResponse.factory,
    );
    assert.equal(settingsResponse.calls[0].kind, 'ok');
    assert.equal(updateSettings.mock.calls.length, 1);
  });
});
