import assert from 'node:assert/strict';
import { searchFindingsByAgentTool } from './search-findings-by-agent';
import { IndexerRequest } from '../types';

/**
 * Unit tests for search_findings_by_agent's optional artifact filters (issue: "Add artifact
 * filters to finding tools"): `source_ip`, `destination_ip`, `process_name`, `source_user_name`,
 * `destination_user_name` each become one more `term` clause in `bool.filter` when supplied, in
 * that fixed order (see common.ts's `findingArtifactFilterClauses`), and a call that supplies
 * none of them is unchanged from before this feature existed (regression).
 */

function buildIndexer(params: Record<string, unknown>): IndexerRequest {
  const req = searchFindingsByAgentTool.buildRequest(params);
  assert.equal(req.target, 'indexer');
  return req as IndexerRequest;
}

function filters(req: IndexerRequest): Array<Record<string, unknown>> {
  const query = req.body.query as {
    bool: { filter: Array<Record<string, unknown>> };
  };
  return query.bool.filter;
}

const BASE_PARAMS = { agent_name: 'web-prod-01' };

test('search_findings_by_agent: no artifact filter supplied is unchanged (regression)', () => {
  const req = buildIndexer(BASE_PARAMS);
  assert.deepEqual(filters(req), [
    { match: { 'wazuh.agent.name': 'web-prod-01' } },
    {
      range: {
        '@timestamp': { gte: 'now-90d', lte: 'now' },
      },
    },
  ]);
});

test('search_findings_by_agent: source_ip alone becomes one term clause', () => {
  const req = buildIndexer({ ...BASE_PARAMS, source_ip: '198.51.100.10' });
  const clauses = filters(req);
  assert.equal(clauses.length, 3);
  assert.deepEqual(clauses[2], { term: { 'source.ip': '198.51.100.10' } });
});

test('search_findings_by_agent: destination_ip alone becomes one term clause', () => {
  const req = buildIndexer({ ...BASE_PARAMS, destination_ip: '10.0.0.5' });
  const clauses = filters(req);
  assert.equal(clauses.length, 3);
  assert.deepEqual(clauses[2], { term: { 'destination.ip': '10.0.0.5' } });
});

test('search_findings_by_agent: process_name alone becomes one term clause', () => {
  const req = buildIndexer({ ...BASE_PARAMS, process_name: 'powershell.exe' });
  const clauses = filters(req);
  assert.equal(clauses.length, 3);
  assert.deepEqual(clauses[2], { term: { 'process.name': 'powershell.exe' } });
});

test('search_findings_by_agent: source_user_name alone becomes one term clause', () => {
  const req = buildIndexer({ ...BASE_PARAMS, source_user_name: 'root' });
  const clauses = filters(req);
  assert.equal(clauses.length, 3);
  assert.deepEqual(clauses[2], { term: { 'source.user.name': 'root' } });
});

test('search_findings_by_agent: destination_user_name alone becomes one term clause', () => {
  const req = buildIndexer({ ...BASE_PARAMS, destination_user_name: 'admin' });
  const clauses = filters(req);
  assert.equal(clauses.length, 3);
  assert.deepEqual(clauses[2], {
    term: { 'destination.user.name': 'admin' },
  });
});

test('search_findings_by_agent: all five artifact filters combine, in a fixed order', () => {
  const req = buildIndexer({
    ...BASE_PARAMS,
    source_ip: '198.51.100.10',
    destination_ip: '10.0.0.5',
    process_name: 'powershell.exe',
    source_user_name: 'root',
    destination_user_name: 'admin',
  });
  const clauses = filters(req);
  assert.equal(clauses.length, 7);
  assert.deepEqual(clauses.slice(2), [
    { term: { 'source.ip': '198.51.100.10' } },
    { term: { 'destination.ip': '10.0.0.5' } },
    { term: { 'process.name': 'powershell.exe' } },
    { term: { 'source.user.name': 'root' } },
    { term: { 'destination.user.name': 'admin' } },
  ]);
});

test('search_findings_by_agent: an artifact filter combines with severity', () => {
  const req = buildIndexer({
    ...BASE_PARAMS,
    severity: 'critical',
    source_ip: '198.51.100.10',
  });
  const clauses = filters(req);
  assert.equal(clauses.length, 4);
  assert.deepEqual(clauses[2], { terms: { 'wazuh.rule.level': ['critical'] } });
  assert.deepEqual(clauses[3], { term: { 'source.ip': '198.51.100.10' } });
});

test('search_findings_by_agent: an artifact filter combines with an explicit time range', () => {
  const req = buildIndexer({
    ...BASE_PARAMS,
    time_range_gte: 'now-24h',
    time_range_lte: 'now',
    source_user_name: 'root',
  });
  const clauses = filters(req);
  assert.deepEqual(clauses[1], {
    range: { '@timestamp': { gte: 'now-24h', lte: 'now' } },
  });
  assert.deepEqual(clauses[2], { term: { 'source.user.name': 'root' } });
});

test('search_findings_by_agent: an artifact filter combines with severity and a time range together', () => {
  const req = buildIndexer({
    ...BASE_PARAMS,
    severity: 'high',
    severity_comparison: 'at_or_above',
    time_range_gte: 'now-7d',
    time_range_lte: 'now',
    destination_ip: '10.0.0.5',
    process_name: 'powershell.exe',
  });
  const clauses = filters(req);
  assert.deepEqual(clauses[1], {
    range: { '@timestamp': { gte: 'now-7d', lte: 'now' } },
  });
  assert.deepEqual(clauses[2], {
    terms: { 'wazuh.rule.level': ['high', 'critical'] },
  });
  assert.deepEqual(clauses[3], { term: { 'destination.ip': '10.0.0.5' } });
  assert.deepEqual(clauses[4], { term: { 'process.name': 'powershell.exe' } });
});

test('search_findings_by_agent: a non-string artifact filter value is ignored, not coerced', () => {
  const req = buildIndexer({ ...BASE_PARAMS, source_ip: 12345 });
  const clauses = filters(req);
  assert.equal(clauses.length, 2);
});

test('search_findings_by_agent: an empty-string artifact filter value contributes no clause', () => {
  const req = buildIndexer({ ...BASE_PARAMS, process_name: '' });
  const clauses = filters(req);
  assert.equal(clauses.length, 2);
});

// Generic sole-candidate parameter resolution (template: #8913's resolveDeicticAgentParams in
// get-agent-inventory.ts): agent_name is schema-OPTIONAL, resolving via the generic resolver
// (param-resolution.ts) with valueFrom: 'name' since this param is matched as free text against
// wazuh.agent.name (see buildRequest), not a numeric Manager id.

test('search_findings_by_agent: agent_name is schema-optional, not required', () => {
  const schema = searchFindingsByAgentTool.spec.parameters as {
    required?: string[];
  };
  assert.ok(
    !schema.required || !schema.required.includes('agent_name'),
    'agent_name must not be schema-required -- server-side resolution needs it omittable',
  );
});

test("search_findings_by_agent: agent_name's description explains server-side resolution on omission", () => {
  const schema = searchFindingsByAgentTool.spec.parameters as {
    properties: Record<string, { description?: string }>;
  };
  assert.match(
    schema.properties.agent_name.description ?? '',
    /Optional: omit this.*resolves automatically when exactly one agent appears in the findings data/s,
  );
  // EXPLAIN-WAVE PHASE 3: the description must also push a NAMED or DESCRIBED host
  // into the param instead of inviting omission -- "the domain controller" is a referent, and
  // omitting it is what let the resolver substitute a different agent.
  assert.match(
    schema.properties.agent_name.description ?? '',
    /If the question names or describes a host at all, pass that host here/,
  );
});

test('search_findings_by_agent: resolves agent_name from the findings index it actually queries, not the Manager agent list', () => {
  // Root cause: the Manager API's active-agent list and `wazuh-findings-v5*`'s
  // `wazuh.agent.name` values are different populations. When the Manager knows exactly one agent
  // (the manager node) and the findings index carries several, `manager-agents` took the
  // sole-candidate path and silently filtered by an agent with no findings, while the
  // ambiguity-enumerate branch counted the wrong population and never fired.
  assert.deepEqual(searchFindingsByAgentTool.soleCandidateParams, [
    {
      param: 'agent_name',
      source: {
        kind: 'indexer-terms',
        index: 'wazuh-findings-v5*',
        field: 'wazuh.agent.name',
        noteEntityKind: 'HOST',
      },
    },
  ]);
});

test('search_findings_by_agent: the sole-candidate lookup aggregates the SAME index and field buildRequest filters on', () => {
  // The invariant that makes the fix above self-consistent rather than a swap of one guess for
  // another: if buildRequest is ever retargeted, this test fails until the lookup follows.
  const spec = searchFindingsByAgentTool.soleCandidateParams?.[0]?.source as {
    kind: string;
    index: string;
    field: string;
  };
  const built = searchFindingsByAgentTool.buildRequest({
    agent_name: 'dc-01',
  }) as {
    index: string;
    body: { query: { bool: { filter: Record<string, unknown>[] } } };
  };

  assert.equal(spec.index, built.index);
  assert.ok(
    built.body.query.bool.filter.some(
      clause =>
        (clause as { match?: Record<string, unknown> }).match &&
        Object.keys((clause as { match: Record<string, unknown> }).match)[0] ===
          spec.field,
    ),
    'the aggregated field must be the one the query matches on',
  );
});
