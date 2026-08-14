import assert from 'node:assert/strict';
import { IsmSettingsProvider } from './ism-settings-provider';
import { CONVERSATION_SESSIONS_ISM_POLICY_ID } from '../../common/constants';

/**
 * `IsmSettingsProvider` never touches OpenSearch except through `transport.request`, always as
 * the current user (reads and writes alike — see `opensearch-user.ts`), so this fakes exactly
 * that one seam. The `fakeContext` helper still keeps an `internal` slot separate from `current`
 * so a future re-introduction of that split would be caught here too, but every case below drives
 * the provider through `current`.
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
  } as unknown as Parameters<IsmSettingsProvider['getSettings']>[0];
}

const policyBody = (minIndexAge: string) => ({
  policy: {
    states: [
      {
        name: 'hot',
        transitions: [
          { state_name: 'delete', conditions: { min_index_age: minIndexAge } },
        ],
      },
      { name: 'delete', transitions: [] },
    ],
  },
  _seq_no: 5,
  _primary_term: 2,
});

test('getSettings: extracts conversationRetentionDays from the fetched policy', async () => {
  const provider = new IsmSettingsProvider();
  const context = fakeContext({
    current: () => Promise.resolve({ body: policyBody('7d') }),
  });
  assert.deepEqual(await provider.getSettings(context), {
    conversationRetentionDays: 7,
  });
});

test('getSettings: returns undefined when the policy is not found', async () => {
  const provider = new IsmSettingsProvider();
  const context = fakeContext({});
  assert.equal(await provider.getSettings(context), undefined);
});

test('createDefaults: echoes its own defaults without writing anything', async () => {
  const provider = new IsmSettingsProvider();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      return Promise.resolve({ body: {} });
    },
  });
  const result = await provider.createDefaults(context);
  assert.deepEqual(result, provider.defaults);
  assert.equal(calls.length, 0);
});

test('updateSettings: PUTs the updated policy with concurrency tokens, then moves affected indices', async () => {
  const provider = new IsmSettingsProvider();
  const calls: RequestCall[] = [];
  const context = fakeContext({
    current: call => {
      calls.push(call);
      if (call.method === 'GET') {
        return Promise.resolve({ body: policyBody('7d') });
      }
      return Promise.resolve({ body: {} });
    },
  });

  const result = await provider.updateSettings(context, {
    conversationRetentionDays: 30,
  });

  assert.deepEqual(result, { conversationRetentionDays: 30 });
  assert.equal(calls.length, 3);

  const [getCall, putCall, changePolicyCall] = calls;
  assert.equal(getCall.method, 'GET');
  assert.equal(putCall.method, 'PUT');
  assert.match(
    putCall.path,
    new RegExp(
      `^/_plugins/_ism/policies/${CONVERSATION_SESSIONS_ISM_POLICY_ID}\\?if_seq_no=5&if_primary_term=2$`,
    ),
  );
  assert.equal(
    (putCall.body as { policy: { states: unknown[] } }).policy.states.length,
    2,
  );

  assert.equal(changePolicyCall.method, 'POST');
  assert.match(changePolicyCall.path, /^\/_plugins\/_ism\/change_policy\//);
  assert.deepEqual(changePolicyCall.body, {
    policy_id: CONVERSATION_SESSIONS_ISM_POLICY_ID,
  });
});

test('updateSettings: throws when the policy is not found', async () => {
  const provider = new IsmSettingsProvider();
  const context = fakeContext({});
  await assert.rejects(
    provider.updateSettings(context, { conversationRetentionDays: 30 }),
    /was not found/,
  );
});
