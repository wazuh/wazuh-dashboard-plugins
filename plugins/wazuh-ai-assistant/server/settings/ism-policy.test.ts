import assert from 'node:assert/strict';
import {
  applyRetentionDays,
  extractRetentionDays,
  IsmPolicy,
} from './ism-policy';

function policyWithDeleteTransition(minIndexAge?: string): IsmPolicy {
  return {
    states: [
      {
        name: 'hot',
        transitions: [
          {
            state_name: 'delete',
            conditions: minIndexAge ? { min_index_age: minIndexAge } : {},
          },
        ],
      },
      { name: 'delete', transitions: [] },
    ],
  };
}

test('extractRetentionDays: reads whole-day min_index_age off the delete transition', () => {
  assert.equal(extractRetentionDays(policyWithDeleteTransition('7d')), 7);
  assert.equal(extractRetentionDays(policyWithDeleteTransition('0d')), 0);
  assert.equal(extractRetentionDays(policyWithDeleteTransition('365d')), 365);
});

test('extractRetentionDays: returns 0 when no transition targets delete', () => {
  const policy: IsmPolicy = { states: [{ name: 'hot', transitions: [] }] };
  assert.equal(extractRetentionDays(policy), 0);
});

test('extractRetentionDays: returns 0 when the delete transition has no min_index_age', () => {
  assert.equal(extractRetentionDays(policyWithDeleteTransition()), 0);
});

test('extractRetentionDays: returns 0 for a non-day min_index_age (not written by this plugin)', () => {
  assert.equal(extractRetentionDays(policyWithDeleteTransition('12h')), 0);
});

test('extractRetentionDays: is case-insensitive on the delete state name', () => {
  const policy: IsmPolicy = {
    states: [
      {
        name: 'hot',
        transitions: [
          { state_name: 'DELETE', conditions: { min_index_age: '3d' } },
        ],
      },
    ],
  };
  assert.equal(extractRetentionDays(policy), 3);
});

test('applyRetentionDays: sets min_index_age on an existing delete transition', () => {
  const policy = policyWithDeleteTransition('7d');
  const next = applyRetentionDays(policy, 30);
  assert.equal(extractRetentionDays(next), 30);
  // Input is not mutated.
  assert.equal(extractRetentionDays(policy), 7);
});

test('applyRetentionDays: 0 removes the delete transition entirely (keep forever)', () => {
  const policy = policyWithDeleteTransition('7d');
  const next = applyRetentionDays(policy, 0);
  assert.equal(extractRetentionDays(next), 0);
  const hotState = next.states.find(state => state.name === 'hot');
  assert.deepEqual(hotState?.transitions, []);
});

test('applyRetentionDays: 0 is a no-op when there is already no delete transition', () => {
  const policy: IsmPolicy = { states: [{ name: 'hot', transitions: [] }] };
  const next = applyRetentionDays(policy, 0);
  assert.deepEqual(next, policy);
});

test('applyRetentionDays: 0 only strips min_index_age when other conditions share the transition', () => {
  const policy: IsmPolicy = {
    states: [
      {
        name: 'hot',
        transitions: [
          {
            state_name: 'delete',
            conditions: { min_index_age: '7d', min_doc_count: 1000 },
          },
        ],
      },
    ],
  };
  const next = applyRetentionDays(policy, 0);
  const hotState = next.states.find(state => state.name === 'hot');
  assert.equal(hotState?.transitions?.length, 1);
  assert.deepEqual(hotState?.transitions?.[0].conditions, {
    min_doc_count: 1000,
  });
});

test('applyRetentionDays: throws when growing retention with no delete transition to attach to', () => {
  const policy: IsmPolicy = { states: [{ name: 'hot', transitions: [] }] };
  assert.throws(
    () => applyRetentionDays(policy, 30),
    /no transition into a "delete" state/,
  );
});
