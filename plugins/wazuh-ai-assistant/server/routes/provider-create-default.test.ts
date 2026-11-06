import assert from 'node:assert/strict';

/**
 * Which provider POST /providers makes the default. The first provider is the default unless the
 * caller explicitly says otherwise: the settings page creates with `isDefault: false` and promotes
 * the provider only after its connection test passes, while an API client that omits the field
 * keeps the first-provider default.
 *
 * Drives the real handler through a fake router, like provider-name-route-wiring.test.ts. The URL
 * guard is mocked because it performs a real DNS lookup.
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

function capturePostProviders(): CapturedHandler {
  const handlers = new Map<string, CapturedHandler>();
  const record =
    (method: string) =>
    (config: { path: string }, handler: CapturedHandler) => {
      handlers.set(`${method} ${config.path}`, handler);
    };
  const logger = { debug: jest.fn(), error: jest.fn(), info: jest.fn() };
  registerSettingsRoutes(
    {
      get: record('GET'),
      post: record('POST'),
      put: record('PUT'),
      delete: record('DELETE'),
    } as unknown as Parameters<typeof registerSettingsRoutes>[0],
    logger as unknown as Parameters<typeof registerSettingsRoutes>[1],
  );
  const post = handlers.get(`POST ${API_PATHS.PROVIDERS}`);
  assert.ok(post, 'POST /providers must be registered');
  return post;
}

/** Creates a provider in an EMPTY store and returns the `isDefault` it was stored with. */
async function createFirstProvider(body: object): Promise<boolean> {
  const create = jest.fn().mockResolvedValue(undefined);
  const aiProviders = {
    list: () => Promise.resolve({ providers: [], total: 0 }),
    count: () => Promise.resolve(0),
    create,
    update: jest.fn().mockResolvedValue(undefined),
  };
  const response = { ok: () => ({ status: 200 }) };

  await capturePostProviders()(
    { wazuh_ai_assistant: { aiProviders } },
    {
      body: {
        name: 'OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        ...body,
      },
    },
    response,
  );

  assert.equal(create.mock.calls.length, 1);
  return create.mock.calls[0][2].isDefault;
}

test('POST /providers: the first provider is the default when isDefault is omitted', async () => {
  assert.equal(await createFirstProvider({}), true);
});

test('POST /providers: an explicit isDefault=false keeps the first provider off default', async () => {
  assert.equal(await createFirstProvider({ isDefault: false }), false);
});
