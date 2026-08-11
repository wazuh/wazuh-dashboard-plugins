import assert from 'node:assert/strict';
import { IndexSettingsProvider } from './index-settings-provider';
import { WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH } from '../../common/constants';
import { AssistantSettingsAttributes } from './types';

/**
 * `IndexSettingsProvider` never touches OpenSearch except through `transport.request` (internal
 * user for reads/bootstrap, current user for the admin-gated write — same split every other
 * settings provider follows, see `opensearch-user.ts`), so this fakes exactly that one seam,
 * mirroring `ism-settings-provider.test.ts`'s style.
 */

type RequestCall = { method: string; path: string; body?: unknown };

function fakeContext(handlers: {
  internal?: (call: RequestCall) => Promise<{ body: unknown }>;
  current?: (call: RequestCall) => Promise<{ body: unknown }>;
}) {
  const notFound = () => Promise.reject({ statusCode: 404 });
  return {
    core: {
      opensearch: {
        client: {
          asInternalUser: {
            transport: { request: handlers.internal ?? notFound },
          },
          asCurrentUser: {
            transport: { request: handlers.current ?? notFound },
          },
        },
      },
    },
  } as unknown as Parameters<IndexSettingsProvider['getSettings']>[0];
}

const wireResponseBody = {
  settings: {
    privacy_default_on: true,
    privacy_default_per_provider: { p1: true },
    user_can_override: false,
  },
  field_policy: [
    { field: 'agent.id', action: 'allow' },
    { field: 'agent.name', action: 'anonymize', kind: 'HOST' },
  ],
  // GET also carries providers alongside settings — must be ignored, never surfaced.
  providers: [{ _id: 'p1', name: 'test', type: 'anthropic' }],
};

type IndexAttributes = Pick<
  AssistantSettingsAttributes,
  | 'privacyDefaultOn'
  | 'privacyDefaultPerProvider'
  | 'userCanOverride'
  | 'fieldPolicy'
>;

const expectedAttributes: IndexAttributes = {
  privacyDefaultOn: true,
  privacyDefaultPerProvider: { p1: true },
  userCanOverride: false,
  fieldPolicy: [
    { field: 'agent.id', action: 'allow' },
    { field: 'agent.name', action: 'anonymize', kind: 'HOST' },
  ],
};

test('getSettings: maps the wire (snake_case) response to camelCase attributes, ignoring providers', async () => {
  const provider = new IndexSettingsProvider();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    internal: call => {
      calls.push(call);
      return Promise.resolve({ body: wireResponseBody });
    },
  });

  const result = await provider.getSettings(context);

  assert.deepEqual(result, expectedAttributes);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].path, WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH);
});

test('getSettings: returns undefined when the endpoint 404s', async () => {
  const provider = new IndexSettingsProvider();
  const context = fakeContext({});
  assert.equal(await provider.getSettings(context), undefined);
});

test('getSettings: propagates a non-404 error (e.g. 403 missing permission) rather than treating it as unset', async () => {
  const provider = new IndexSettingsProvider();
  const context = fakeContext({
    internal: () => Promise.reject({ statusCode: 403 }),
  });
  await assert.rejects(provider.getSettings(context));
});

test('createDefaults: PUTs its own defaults through the internal user and echoes them back', async () => {
  const provider = new IndexSettingsProvider();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    internal: call => {
      calls.push(call);
      return Promise.resolve({ body: { message: 'ok', status: 200 } });
    },
  });

  const result = await provider.createDefaults(context);

  assert.deepEqual(result, provider.defaults);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].path, WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH);
  assert.deepEqual(calls[0].body, {
    settings: {
      privacy_default_on: false,
      privacy_default_per_provider: {},
      user_can_override: true,
    },
    field_policy: provider.defaults.fieldPolicy.map(entry => ({
      field: entry.field,
      action: entry.action,
      ...(entry.kind === undefined ? {} : { kind: entry.kind }),
    })),
  });
});

test('updateSettings: PUTs the given attributes through the current user and echoes them back (the endpoint never returns the document)', async () => {
  const provider = new IndexSettingsProvider();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      return Promise.resolve({
        body: { message: 'Settings updated.', status: 200 },
      });
    },
  });

  const result = await provider.updateSettings(context, expectedAttributes);

  assert.deepEqual(result, expectedAttributes);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(calls[0].path, WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH);
  assert.deepEqual(calls[0].body, {
    settings: {
      privacy_default_on: true,
      privacy_default_per_provider: { p1: true },
      user_can_override: false,
    },
    field_policy: [
      { field: 'agent.id', action: 'allow' },
      { field: 'agent.name', action: 'anonymize', kind: 'HOST' },
    ],
  });
});
