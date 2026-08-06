import assert from 'node:assert/strict';
import {
  resolveSuggestedDsl,
  validateSuggestDiscoverQueryArgs,
} from './suggest-discover-query';

/**
 * Proves the graceful-failure handoff's server-side seam (issue
 * 13-suggested-query-discover-handoff.md):
 *  - `validateSuggestDiscoverQueryArgs` rejects everything that would otherwise render a broken
 *    or silent callout to the user (empty index/reason, unparseable/non-object query_dsl).
 *  - `resolveSuggestedDsl`'s field-level-filter safety decision: field filters only ever survive
 *    when `_field_caps` confirms every referenced field name exists on the target index; every
 *    other case (index outside the executor's allowlist, an unknown field, a failed `_field_caps`
 *    call) strips down to index + time range only, and never touches
 *    `checkIndexAllowlist` (guardrails.ts) to make more indices reachable.
 *
 * Runs standalone like executor.test.ts/router.test.ts: this file's only OSD-server import
 * (`RequestHandlerContext`/`Logger`, in suggest-discover-query.ts) is used purely as a type, never
 * as a runtime value, so no OSD checkout is required to execute these tests.
 */

type Context = Parameters<typeof resolveSuggestedDsl>[0];
type Logger = Parameters<typeof resolveSuggestedDsl>[3];

function fakeLogger() {
  const debugCalls: string[] = [];
  return {
    debugCalls,
    logger: {
      debug: (message: string) => debugCalls.push(message),
    } as unknown as Logger,
  };
}

function fakeContext(fieldCaps: (params: unknown) => Promise<unknown>) {
  return {
    core: {
      opensearch: {
        client: { asCurrentUser: { fieldCaps } },
      },
    },
  } as unknown as Context;
}

test('validateSuggestDiscoverQueryArgs: accepts a well-formed call', () => {
  const result = validateSuggestDiscoverQueryArgs({
    index: 'wazuh-findings-v5-*',
    query_dsl: '{"term":{"wazuh.rule.id":"100002"}}',
    reason: 'This filter needs a rule id I could not confirm.',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.index, 'wazuh-findings-v5-*');
    assert.deepEqual(result.dsl, { term: { 'wazuh.rule.id': '100002' } });
    assert.equal(
      result.reason,
      'This filter needs a rule id I could not confirm.',
    );
  }
});

test('validateSuggestDiscoverQueryArgs: rejects an empty index', () => {
  const result = validateSuggestDiscoverQueryArgs({
    index: '  ',
    query_dsl: '{}',
    reason: 'x',
  });
  assert.equal(result.ok, false);
});

test('validateSuggestDiscoverQueryArgs: rejects an empty reason', () => {
  const result = validateSuggestDiscoverQueryArgs({
    index: 'wazuh-findings-v5-*',
    query_dsl: '{}',
    reason: '   ',
  });
  assert.equal(result.ok, false);
});

test('validateSuggestDiscoverQueryArgs: rejects unparseable query_dsl', () => {
  const result = validateSuggestDiscoverQueryArgs({
    index: 'wazuh-findings-v5-*',
    query_dsl: '{not json',
    reason: 'x',
  });
  assert.equal(result.ok, false);
});

test('validateSuggestDiscoverQueryArgs: rejects a query_dsl that decodes to an array', () => {
  const result = validateSuggestDiscoverQueryArgs({
    index: 'wazuh-findings-v5-*',
    query_dsl: '[1,2,3]',
    reason: 'x',
  });
  assert.equal(result.ok, false);
});

test('resolveSuggestedDsl: an index outside the allowlist strips to index + time range, never calls _field_caps', async () => {
  let called = false;
  const { logger } = fakeLogger();
  const context = fakeContext(() => {
    called = true;
    return Promise.resolve({ body: { fields: {} } });
  });
  const dsl = { term: { 'some.field': 'value' } };
  const result = await resolveSuggestedDsl(
    context,
    'some-other-index-*',
    dsl,
    logger,
  );
  assert.equal(
    called,
    false,
    '_field_caps must never be called for a disallowed index',
  );
  assert.deepEqual(result, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } }],
    },
  });
});

test('resolveSuggestedDsl: an allowed index with every referenced field confirmed by _field_caps keeps the original dsl', async () => {
  const { logger } = fakeLogger();
  const context = fakeContext(() =>
    Promise.resolve({ body: { fields: { 'wazuh.rule.id': {} } } }),
  );
  const dsl = { term: { 'wazuh.rule.id': '100002' } };
  const result = await resolveSuggestedDsl(
    context,
    'wazuh-findings-v5-*',
    dsl,
    logger,
  );
  assert.deepEqual(result, dsl);
});

test('resolveSuggestedDsl: an allowed index with an unknown field strips to index + time range', async () => {
  const { logger } = fakeLogger();
  const context = fakeContext(() =>
    // field_caps reports nothing -- the referenced field does not exist
    Promise.resolve({ body: { fields: {} } }),
  );
  const dsl = {
    bool: {
      filter: [
        { term: { 'made.up.field': 'x' } },
        { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
      ],
    },
  };
  const result = await resolveSuggestedDsl(
    context,
    'wazuh-findings-v5-*',
    dsl,
    logger,
  );
  assert.deepEqual(result, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }],
    },
  });
});

test('resolveSuggestedDsl: a failed _field_caps call strips to index + time range and logs why', async () => {
  const { logger, debugCalls } = fakeLogger();
  const context = fakeContext(() =>
    Promise.reject(new Error('cluster unavailable')),
  );
  const dsl = { term: { 'wazuh.rule.id': '100002' } };
  const result = await resolveSuggestedDsl(
    context,
    'wazuh-findings-v5-*',
    dsl,
    logger,
  );
  assert.deepEqual(result, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } }],
    },
  });
  assert.equal(debugCalls.length, 1);
});

test('resolveSuggestedDsl: a dsl with only a (verified) time range is returned unchanged', async () => {
  let called = false;
  const { logger } = fakeLogger();
  const context = fakeContext(() => {
    called = true;
    return Promise.resolve({ body: { fields: { '@timestamp': {} } } });
  });
  const dsl = { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } };
  // NOTE: `range`'s field key IS collected by collectFieldNames, so this still calls
  // _field_caps (unlike the truly-empty-dsl case in the next test) -- it just always passes for
  // '@timestamp', which every allowlisted index has.
  const result = await resolveSuggestedDsl(
    context,
    'wazuh-findings-v5-*',
    dsl,
    logger,
  );
  assert.equal(called, true);
  assert.deepEqual(result, dsl);
});

test('resolveSuggestedDsl: an empty dsl object (no clauses to verify) is returned unchanged, no _field_caps call', async () => {
  let called = false;
  const { logger } = fakeLogger();
  const context = fakeContext(() => {
    called = true;
    return Promise.resolve({ body: { fields: {} } });
  });
  const dsl = {};
  const result = await resolveSuggestedDsl(
    context,
    'wazuh-findings-v5-*',
    dsl,
    logger,
  );
  assert.equal(called, false);
  assert.deepEqual(result, dsl);
});

test('resolveSuggestedDsl: a wazuh-states-* index uses state.modified_at for the stripped time range', async () => {
  const { logger } = fakeLogger();
  const context = fakeContext(() => Promise.resolve({ body: { fields: {} } }));
  const dsl = { term: { 'made.up.field': 'x' } };
  const result = await resolveSuggestedDsl(
    context,
    'wazuh-states-vulnerabilities',
    dsl,
    logger,
  );
  assert.deepEqual(result, {
    bool: {
      filter: [
        { range: { 'state.modified_at': { gte: 'now-24h', lte: 'now' } } },
      ],
    },
  });
});
