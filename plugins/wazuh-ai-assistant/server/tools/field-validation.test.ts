import assert from 'node:assert/strict';
import { extractFieldNames, validateQueryFields } from './field-validation';

type Context = Parameters<typeof validateQueryFields>[0];

/** Minimal `context` stub: `validateQueryFields` only ever reads
 * `context.core.opensearch.client.asCurrentUser.fieldCaps()`. `knownFields === undefined` fakes a
 * lookup failure (the fail-open path) instead of returning an empty field list. */
function fakeContext(knownFields: string[] | undefined): Context {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            fieldCaps: () => {
              if (knownFields === undefined) {
                throw new Error('simulated _field_caps failure');
              }
              return Promise.resolve({
                body: {
                  fields: Object.fromEntries(
                    knownFields.map(field => [field, { keyword: {} }]),
                  ),
                },
              });
            },
          },
        },
      },
    },
  } as unknown as Context;
}

// --- extractFieldNames ---------------------------------------------------------------------------

test('extractFieldNames: pulls field names out of term/terms/match/range/exists', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { term: { 'wazuh.rule.id': 'x' } },
          { terms: { 'agent.name.keyword': ['a', 'b'] } },
          { match: { 'wazuh.agent.name': 'web-prod-01' } },
          { range: { '@timestamp': { gte: 'now-1h' } } },
          { exists: { field: 'source.ip' } },
        ],
      },
    },
  };
  const fields = extractFieldNames(body);
  assert.deepEqual(
    new Set(fields),
    new Set([
      'wazuh.rule.id',
      'agent.name.keyword',
      'wazuh.agent.name',
      '@timestamp',
      'source.ip',
    ]),
  );
});

test('extractFieldNames: pulls the field param out of a terms-like aggregation', () => {
  const body = {
    aggs: { top_agents: { terms: { field: 'agent.name.keyword', size: 5 } } },
  };
  assert.deepEqual(extractFieldNames(body), ['agent.name.keyword']);
});

test('extractFieldNames: sort entries (string and object form), excluding underscore keys', () => {
  const body = {
    sort: ['_score', { '@timestamp': { order: 'desc' } }, 'wazuh.rule.id'],
  };
  assert.deepEqual(
    new Set(extractFieldNames(body)),
    new Set(['@timestamp', 'wazuh.rule.id']),
  );
});

test('extractFieldNames: _source string entries, skipping wildcard entries', () => {
  const body = { _source: ['wazuh.agent.name', 'wazuh.*'] };
  assert.deepEqual(extractFieldNames(body), ['wazuh.agent.name']);
});

test("extractFieldNames: a composite aggregation's nested sources[].*.terms.field is still found (no special-casing needed)", () => {
  const body = {
    aggs: {
      by_page: {
        composite: { sources: [{ agent: { terms: { field: 'agent.id' } } }] },
      },
    },
  };
  assert.deepEqual(extractFieldNames(body), ['agent.id']);
});

test("extractFieldNames: an unrecognized construct (multi_terms' array-of-{field} shape) is skipped, not misread", () => {
  const body = {
    aggs: {
      by_pair: {
        multi_terms: {
          terms: [{ field: 'agent.id' }, { field: 'wazuh.rule.id' }],
        },
      },
    },
  };
  assert.deepEqual(extractFieldNames(body), []);
});

// --- validateQueryFields ---------------------------------------------------------------------------
//
// Each test below targets a DISTINCT index-pattern string, even where reusing one would be
// harmless for that test's own assertions: `getIndexFields`'s cache is module-level and keyed by
// index pattern, so two tests sharing a pattern would let one test's cached mapping silently
// answer another test's (differently-mocked) lookup -- most dangerously the fail-open test below,
// which specifically needs its OWN lookup to fail, not reuse an earlier test's cached success.

test('validateQueryFields: rejects a field not present in the live mapping, naming near-miss alternatives', async () => {
  const context = fakeContext(['agent.name', 'wazuh.agent.name', '@timestamp']);
  const body = {
    query: {
      bool: { filter: [{ range: { '@timestamp': { gte: 'now-1h' } } }] },
    },
    aggs: { top_agents: { terms: { field: 'agent.name.keyword', size: 5 } } },
  };
  const result = await validateQueryFields(
    context,
    'wazuh-findings-v5*-rejects',
    body,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /"agent\.name\.keyword" does not exist/);
    assert.match(result.reason, /"agent\.name"/);
    assert.match(result.reason, /"wazuh\.agent\.name"/);
  }
});

test('validateQueryFields: accepts a field that IS present in the live mapping', async () => {
  const context = fakeContext(['agent.name', 'wazuh.agent.name', '@timestamp']);
  const body = {
    aggs: { top_agents: { terms: { field: 'agent.name', size: 5 } } },
  };
  const result = await validateQueryFields(
    context,
    'wazuh-findings-v5*-accepts',
    body,
  );
  assert.deepEqual(result, { ok: true });
});

test('validateQueryFields: a body with no extractable field references short-circuits without calling fieldCaps at all', async () => {
  let called = false;
  const context = {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            fieldCaps: () => {
              called = true;

              return Promise.resolve({ body: { fields: {} } });
            },
          },
        },
      },
    },
  } as unknown as Context;
  const result = await validateQueryFields(
    context,
    'wazuh-findings-v5*-nofields',
    {
      size: 10,
    },
  );
  assert.deepEqual(result, { ok: true });
  assert.equal(called, false);
});

test('validateQueryFields: fails OPEN (does not reject) when the _field_caps lookup itself fails', async () => {
  const context = fakeContext(undefined);
  const body = {
    query: { bool: { filter: [{ term: { 'agent.name.keyword': 'x' } }] } },
  };
  const result = await validateQueryFields(
    context,
    'wazuh-findings-v5*-failopen',
    body,
  );
  assert.deepEqual(result, { ok: true });
});
