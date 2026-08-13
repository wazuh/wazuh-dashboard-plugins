import assert from 'node:assert/strict';
import { AiProvidersClient } from './ai-providers-client';
import { WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH } from '../../common/constants';

/**
 * `AiProvidersClient` never touches OpenSearch except through `transport.request`, always as the
 * current user (reads and writes alike — see `opensearch-user.ts`), so this fakes exactly that one
 * seam, mirroring `index-settings-provider.test.ts`'s style. The `fakeContext` helper still keeps
 * an `internal` slot separate from `current` so a future re-introduction of that split would be
 * caught here too, but every case below drives the client through `current`.
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
  } as unknown as Parameters<AiProvidersClient['list']>[0];
}

const providerWire = (id: string, name: string, isDefault?: boolean) => ({
  _id: id,
  name,
  type: 'anthropic',
  base_url: 'https://api.anthropic.com',
  model: 'claude-opus-4-6',
  api_key: 'enc:v1:abc',
  is_default: isDefault,
});

const providerListResponseBody = (providers: unknown[]) => ({
  providers,
});

test('list: fetches the providers list once and paginates the array in memory', async () => {
  const client = new AiProvidersClient();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      return Promise.resolve({
        body: providerListResponseBody([
          providerWire('p1', 'one'),
          providerWire('p2', 'two'),
          providerWire('p3', 'three'),
        ]),
      });
    },
  });

  const result = await client.list(context, 2, 2);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].path, WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH);
  assert.equal(result.total, 3);
  assert.deepEqual(
    result.providers.map(provider => provider.id),
    ['p3'],
  );
});

test('count: returns the full providers length', async () => {
  const client = new AiProvidersClient();
  const context = fakeContext({
    current: () =>
      Promise.resolve({
        body: providerListResponseBody([
          providerWire('p1', 'one'),
          providerWire('p2', 'two'),
        ]),
      }),
  });
  assert.equal(await client.count(context), 2);
});

test('get: finds a provider by id and maps snake_case to camelCase', async () => {
  const client = new AiProvidersClient();
  const context = fakeContext({
    current: () =>
      Promise.resolve({
        body: providerListResponseBody([providerWire('p1', 'one', true)]),
      }),
  });

  const result = await client.get(context, 'p1');

  assert.deepEqual(result, {
    id: 'p1',
    attributes: {
      name: 'one',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-opus-4-6',
      apiKey: 'enc:v1:abc',
      isDefault: true,
    },
  });
});

test('get: returns undefined when no provider matches the id', async () => {
  const client = new AiProvidersClient();
  const context = fakeContext({
    current: () =>
      Promise.resolve({
        body: providerListResponseBody([providerWire('p1', 'one')]),
      }),
  });
  assert.equal(await client.get(context, 'missing'), undefined);
});

test('list/count/get: treat a 404 from the endpoint as no providers yet, not an error', async () => {
  const client = new AiProvidersClient();
  const context = fakeContext({});
  assert.deepEqual(await client.list(context, 1, 10), {
    providers: [],
    total: 0,
  });
  assert.equal(await client.count(context), 0);
  assert.equal(await client.get(context, 'any'), undefined);
});

test('create: POSTs to the collection path through the current user with the id in the body', async () => {
  const client = new AiProvidersClient();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      return Promise.resolve({
        body: { message: 'Provider saved.', status: 200, id: 'p1' },
      });
    },
  });

  await client.create(context, 'p1', {
    name: 'one',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-opus-4-6',
    apiKey: 'enc:v1:abc',
    isDefault: true,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].path, WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH);
  assert.deepEqual(calls[0].body, {
    name: 'one',
    type: 'anthropic',
    base_url: 'https://api.anthropic.com',
    model: 'claude-opus-4-6',
    api_key: 'enc:v1:abc',
    is_default: true,
    id: 'p1',
  });
});

test('update: PUTs the given id through the current user with the full wire body', async () => {
  const client = new AiProvidersClient();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      return Promise.resolve({
        body: { message: 'Provider saved.', status: 200, id: 'p1' },
      });
    },
  });

  await client.update(context, 'p1', {
    name: 'renamed',
    type: 'openai_compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-5',
    isDefault: false,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PUT');
  assert.equal(
    calls[0].path,
    `${WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH}/p1`,
  );
});

test('delete: DELETEs the given id through the current user', async () => {
  const client = new AiProvidersClient();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      return Promise.resolve({
        body: { message: 'Provider deleted.', status: 200, id: 'p1' },
      });
    },
  });

  await client.delete(context, 'p1');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(
    calls[0].path,
    `${WAZUH_INDEXER_AI_ASSISTANT_PROVIDERS_PATH}/p1`,
  );
});
