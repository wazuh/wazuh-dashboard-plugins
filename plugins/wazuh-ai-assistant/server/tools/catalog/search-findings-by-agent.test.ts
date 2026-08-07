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
