import assert from 'node:assert/strict';
import { getScaChecksTool } from './get-sca-checks';
import { IndexerRequest } from '../types';

/**
 * Unit tests for get_sca_checks (SCA per-check drill-down), rewritten for the Wazuh 5.0 port:
 * the tool moved from the removed Manager endpoint
 * `GET /sca/{agent}/checks/{policy}` to an Indexer query against `wazuh-states-sca*`
 * (term wazuh.agent.id + term policy.id + optional term check.result + optional multi_match).
 */

function buildIndexer(params: Record<string, unknown>): IndexerRequest {
  const req = getScaChecksTool.buildRequest(params);
  assert.equal(req.target, 'indexer');
  return req as IndexerRequest;
}

function filters(req: IndexerRequest): Array<Record<string, unknown>> {
  const query = req.body.query as {
    bool: { filter: Array<Record<string, unknown>> };
  };
  return query.bool.filter;
}

test('get_sca_checks: buildRequest targets wazuh-states-sca* with agent+policy terms', () => {
  const req = buildIndexer({ agent_id: '000', policy_id: 'cis_ubuntu22-04' });
  assert.equal(req.index, 'wazuh-states-sca*');
  assert.deepEqual(filters(req), [
    { term: { 'wazuh.agent.id': '000' } },
    { term: { 'policy.id': 'cis_ubuntu22-04' } },
  ]);
  assert.equal(req.body.size, 20);
});

test('get_sca_checks: result becomes a term filter; search becomes exact-OR-prefix', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'Ensure SSH',
  });
  const clauses = filters(req);
  assert.deepEqual(clauses[2], { term: { 'check.result': 'failed' } });
  // `search` is no longer a BARE multi_match. `check.name`/`check.description`/`check.rationale`
  // are all `keyword` in 5.0, so an analyzed multi_match on its own silently returned nothing for
  // any fragment — proven live: search "ssh" -> 0 hits, while the full exact check name -> 1. It is
  // now a should-pair: the multi_match (correct for a full exact value) OR a non-leading prefix on
  // `check.name`, so "Ensure SSH" works too. A true substring search is deliberately NOT attempted
  // (on a keyword field it needs a leading wildcard, which the guardrails reject on purpose).
  assert.deepEqual(clauses[3], {
    bool: {
      minimum_should_match: 1,
      should: [
        {
          multi_match: {
            query: 'Ensure SSH',
            fields: ['check.name', 'check.description', 'check.rationale'],
          },
        },
        { prefix: { 'check.name': 'Ensure SSH' } },
      ],
    },
  });
});

test('get_sca_checks: policy_id is trimmed', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: '  cis_ubuntu22-04  ',
  });
  assert.deepEqual(filters(req)[1], {
    term: { 'policy.id': 'cis_ubuntu22-04' },
  });
});

test('get_sca_checks: missing policy_id throws', () => {
  assert.throws(
    () => getScaChecksTool.buildRequest({ agent_id: '000' }),
    /policy_id/,
  );
});

test('get_sca_checks: empty-string policy_id throws', () => {
  assert.throws(
    () => getScaChecksTool.buildRequest({ agent_id: '000', policy_id: '   ' }),
    /policy_id/,
  );
});

test('get_sca_checks: invalid agent_id throws (delegates to validateAgentId)', () => {
  assert.throws(
    () =>
      getScaChecksTool.buildRequest({
        agent_id: 'not-numeric',
        policy_id: 'cis_ubuntu22-04',
      }),
    /agent_id/,
  );
});

test('get_sca_checks: limit is clamped to [1, 500]', () => {
  const over = buildIndexer({ agent_id: '000', policy_id: 'p', limit: 10_000 });
  assert.equal(over.body.size, 500);
  const under = buildIndexer({ agent_id: '000', policy_id: 'p', limit: 0 });
  assert.equal(under.body.size, 1);
});

test('get_sca_checks: tableSpec/digest declare the locked 5.0 columns/rowFields/sampleColumns', () => {
  assert.deepEqual(
    getScaChecksTool.tableSpec.columns.map(c => c.field),
    ['check.id', 'check.name', 'check.result', 'check.reason'],
  );
  assert.deepEqual(getScaChecksTool.tableSpec.rowFields, [
    'check.remediation',
    'check.rules',
  ]);
  assert.deepEqual(getScaChecksTool.digest.sampleColumns, [
    'check.id',
    'check.name',
    'check.result',
  ]);
  // Long-text fields stay out of the digest (token-budget decision, unchanged from 4.14).
  assert.ok(
    !getScaChecksTool.digest.sampleColumns.includes('check.remediation'),
  );
  assert.ok(
    !getScaChecksTool.digest.sampleColumns.includes('check.description'),
  );
});
