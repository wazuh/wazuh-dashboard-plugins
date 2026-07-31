import assert from 'node:assert/strict';
import { getScaResultsTool } from './get-sca-results';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getScaResultsTool.buildRequest(params) as IndexerRequest;
}

test('get_sca_results: buildRequest targets wazuh-states-sca* with an agent-id term filter', () => {
  const request = build({ agent_id: '001' });
  assert.equal(request.index, 'wazuh-states-sca*');
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'wazuh.agent.id': '001' } }] },
  });
  assert.equal(request.body.size, 0);
});

test('get_sca_results: aggregates by policy.id with a top_hits sample and per-result filters', () => {
  const request = build({ agent_id: '001', limit: 10 });
  assert.deepEqual(request.body.aggs, {
    policies: {
      terms: { field: 'policy.id', size: 10 },
      aggs: {
        policy_sample: { top_hits: { size: 1, _source: ['policy.name'] } },
        passed: { filter: { term: { 'check.result': 'Passed' } } },
        failed: { filter: { term: { 'check.result': 'Failed' } } },
        not_applicable: { filter: { term: { 'check.result': 'Not applicable' } } },
      },
    },
  });
});

test('get_sca_results: uses the real capitalized check.result values, not the lowercase 4.14 ones', () => {
  const request = build({ agent_id: '001' });
  const aggs = request.body.aggs as {
    policies: { aggs: Record<string, { filter: { term: Record<string, string> } }> };
  };
  assert.equal(aggs.policies.aggs.passed.filter.term['check.result'], 'Passed');
  assert.equal(aggs.policies.aggs.failed.filter.term['check.result'], 'Failed');
  assert.equal(aggs.policies.aggs.not_applicable.filter.term['check.result'], 'Not applicable');
});

function policiesTermsSize(request: IndexerRequest): unknown {
  const aggs = request.body.aggs as {
    policies: { terms: { size: unknown } };
  };
  return aggs.policies.terms.size;
}

test('get_sca_results: clamps limit to the [1, 500] range', () => {
  assert.equal(policiesTermsSize(build({ agent_id: '001', limit: 9999 })), 500);
  assert.equal(policiesTermsSize(build({ agent_id: '001', limit: 0 })), 1);
});

test('get_sca_results: request passes checkIndexAllowlist and lintDsl', () => {
  const request = build({ agent_id: '001' });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});
