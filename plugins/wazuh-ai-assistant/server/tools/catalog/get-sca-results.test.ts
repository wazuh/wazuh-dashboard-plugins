import assert from 'node:assert/strict';
import { getScaResultsTool } from './get-sca-results';
import { lintDsl, checkIndexAllowlist, MAX_AGG_SIZE } from '../guardrails';
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
        not_applicable: {
          filter: { term: { 'check.result': 'Not applicable' } },
        },
      },
    },
  });
});

test('get_sca_results: uses the real capitalized check.result values, not the lowercase 4.14 ones', () => {
  const request = build({ agent_id: '001' });
  const aggs = request.body.aggs as {
    policies: {
      aggs: Record<string, { filter: { term: Record<string, string> } }>;
    };
  };
  assert.equal(aggs.policies.aggs.passed.filter.term['check.result'], 'Passed');
  assert.equal(aggs.policies.aggs.failed.filter.term['check.result'], 'Failed');
  assert.equal(
    aggs.policies.aggs.not_applicable.filter.term['check.result'],
    'Not applicable',
  );
});

function policiesTermsSize(request: IndexerRequest): unknown {
  const aggs = request.body.aggs as {
    policies: { terms: { size: unknown } };
  };
  return aggs.policies.terms.size;
}

test('get_sca_results: clamps limit to the guardrails aggregation cap, not a larger ceiling', () => {
  // This limit becomes the `policies` terms aggregation size, and guardrails.ts rejects any
  // aggregation size above MAX_AGG_SIZE, so it must clamp to that cap rather than a larger
  // ceiling. Asserted against the imported constant rather than a literal 100, so the two can
  // never disagree.
  assert.equal(
    policiesTermsSize(build({ agent_id: '001', limit: 9999 })),
    MAX_AGG_SIZE,
  );
  assert.equal(policiesTermsSize(build({ agent_id: '001', limit: 0 })), 1);
});

test('get_sca_results: advertises the cap it actually enforces', () => {
  // The description must advertise the cap the tool actually enforces (MAX_AGG_SIZE), not a
  // higher ceiling that would steer a model into a range the tool rejects. aggLimitProperty
  // generates this description from MAX_AGG_SIZE.
  const description =
    getScaResultsTool.spec.parameters.properties.limit.description ?? '';
  assert.match(description, new RegExp(`max ${MAX_AGG_SIZE}\\b`));
  assert.doesNotMatch(description, /max 500\b/);
});

test('get_sca_results: request passes checkIndexAllowlist and lintDsl', () => {
  const request = build({ agent_id: '001' });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('get_sca_results: still passes lintDsl at its maximum advertised limit', () => {
  // The lint test above only builds with the DEFAULT limit, so it does not exercise the boundary
  // where an aggregation size above MAX_AGG_SIZE would be rejected. Exercising the advertised
  // maximum here makes this tool's own suite catch such a regression, independently of the
  // catalog-wide coverage test.
  const request = build({ agent_id: '001', limit: 9999 });
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

// Cross-category tool audit: this tool's own category is `sca`
// (server/tools/router.ts), while get_threat_intel_components -- named here for the "you actually
// want a Security Analytics pipeline policy" case -- is the separate `security_analytics`
// category, not guaranteed offered on the same turn. Pins the conditional wording so a future edit
// cannot silently reintroduce an unconditional "use get_threat_intel_components instead" naming a
// tool that may not be offered.
test('get_sca_results: names get_threat_intel_components only conditionally on it being offered, not unconditionally', () => {
  const description = getScaResultsTool.spec.description;
  assert.match(
    description,
    /if\s+the question is actually about pipeline policies and get_threat_intel_components \(with\s+component_type="policies"\) is available to you this turn, use that one instead/,
  );
  assert.doesNotMatch(
    description,
    /\(use get_threat_intel_components with component_type="policies"\)/,
  );
});

// Generic sole-candidate parameter resolution (template: resolveDeicticAgentParams in
// get-agent-inventory.ts): agent_id is schema-OPTIONAL here, with the omission story in its own
// description, plus a soleCandidateParams declaration that lets registry.ts attach the generic
// resolver (param-resolution.ts) automatically -- a strictly-required agent_id would reject
// deictic/descriptive SCA questions that never name an agent.

test('get_sca_results: agent_id is schema-optional, not required', () => {
  const schema = getScaResultsTool.spec.parameters as {
    required?: string[];
  };
  assert.ok(
    !schema.required || !schema.required.includes('agent_id'),
    'agent_id must not be schema-required -- server-side resolution needs it omittable',
  );
});

test("get_sca_results: agent_id's description explains server-side resolution on omission", () => {
  const schema = getScaResultsTool.spec.parameters as {
    properties: Record<string, { description?: string }>;
  };
  assert.match(
    schema.properties.agent_id.description ?? '',
    /Optional: omit this.*resolves to the only active agent automatically/s,
  );
});

test('get_sca_results: declares agent_id as a manager-agents sole-candidate param', () => {
  assert.deepEqual(getScaResultsTool.soleCandidateParams, [
    { param: 'agent_id', source: { kind: 'manager-agents' } },
  ]);
});

test('get_sca_results: the agent_id description tells the model to resolve a NAMED host to an id', () => {
  // Sibling of the same rule on get_sca_checks: this tool has the identical numeric-only agent_id
  // plus sole-candidate resolution, so it carries the identical mis-reading risk ("omit it to cover
  // every agent").
  const properties = getScaResultsTool.spec.parameters.properties as Record<
    string,
    { description?: string }
  >;
  const description = properties.agent_id.description ?? '';
  assert.match(description, /If the user named a host/);
  assert.match(description, /resolve that name to its numeric id first/);
  assert.match(description, /does NOT search across agents/);
});
