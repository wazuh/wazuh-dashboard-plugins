import assert from 'node:assert/strict';
import { IndexSettingsProvider } from './index-settings-provider';

/**
 * Fakes exactly the OpenSearch client surface `IndexSettingsProvider` calls: `get`/`indices.exists`
 * (internal user, reads/existence-check) and `index`/`update` (current user, writes) — see
 * `opensearch-user.ts` for the read/write split this mirrors.
 */

type Client = Parameters<IndexSettingsProvider['getSettings']>[0];

function fakeContext(overrides: {
  get?: () => Promise<{ body: unknown }>;
  indicesExists?: () => Promise<{ body: boolean }>;
  index?: (call: unknown) => Promise<{ body: unknown }>;
  update?: (call: unknown) => Promise<{ body: unknown }>;
}): Client {
  const notFound = () => Promise.reject({ statusCode: 404 });
  return {
    core: {
      opensearch: {
        client: {
          asInternalUser: {
            get: overrides.get ?? notFound,
            indices: {
              exists:
                overrides.indicesExists ??
                (() => Promise.resolve({ body: false })),
            },
            index:
              overrides.index ??
              (() => Promise.reject(new Error('unexpected index() call'))),
          },
          asCurrentUser: {
            update:
              overrides.update ??
              (() => Promise.reject(new Error('unexpected update() call'))),
          },
        },
      },
    },
  } as unknown as Client;
}

const storedSettings = {
  privacyDefaultOn: true,
  privacyDefaultPerProvider: { p1: true },
  userCanOverride: false,
  fieldPolicy: [],
};

test('getSettings: returns the stored slice when the singleton document exists', async () => {
  const provider = new IndexSettingsProvider();
  const context = fakeContext({
    get: () =>
      Promise.resolve({ body: { _source: { settings: storedSettings } } }),
  });
  assert.deepEqual(await provider.getSettings(context), storedSettings);
});

test('getSettings: returns undefined when the singleton document is missing', async () => {
  const provider = new IndexSettingsProvider();
  const context = fakeContext({});
  assert.equal(await provider.getSettings(context), undefined);
});

test('createDefaults: never creates the index — echoes its own defaults without writing when it is missing', async () => {
  const provider = new IndexSettingsProvider();
  const indexCalls: unknown[] = [];
  const context = fakeContext({
    indicesExists: () => Promise.resolve({ body: false }),
    index: call => {
      indexCalls.push(call);
      return Promise.resolve({ body: {} });
    },
  });

  const result = await provider.createDefaults(context);

  assert.deepEqual(result, provider.defaults);
  assert.equal(indexCalls.length, 0);
});

test('createDefaults: creates the singleton document with its own defaults when the index already exists', async () => {
  const provider = new IndexSettingsProvider();
  const indexCalls: unknown[] = [];
  const context = fakeContext({
    indicesExists: () => Promise.resolve({ body: true }),
    index: call => {
      indexCalls.push(call);
      return Promise.resolve({ body: {} });
    },
  });

  const result = await provider.createDefaults(context);

  assert.deepEqual(result, provider.defaults);
  assert.equal(indexCalls.length, 1);
  assert.deepEqual(
    (indexCalls[0] as { body: { settings: unknown } }).body.settings,
    provider.defaults,
  );
});

test('updateSettings: writes through the current-user update() call', async () => {
  const provider = new IndexSettingsProvider();
  const updateCalls: unknown[] = [];
  const context = fakeContext({
    update: call => {
      updateCalls.push(call);
      return Promise.resolve({ body: {} });
    },
  });

  const result = await provider.updateSettings(context, storedSettings);

  assert.deepEqual(result, storedSettings);
  assert.equal(updateCalls.length, 1);
});
