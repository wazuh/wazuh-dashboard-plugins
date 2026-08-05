import assert from 'node:assert/strict';
import { getEventsByAgentTool } from './get-events-by-agent';
import { IndexerRequest } from '../types';

/**
 * Unit tests for get_events_by_agent (issue: "Add a typed events tool over wazuh-events-v5"): the
 * one typed tool that targets `wazuh-events-v5*` (the raw, unmatched event stream) rather than
 * `wazuh-findings-v5*`. Covers request-body shape, the optional agent filter (both absent and
 * present), the default/explicit time range, and limit clamping.
 */

function buildIndexer(params: Record<string, unknown>): IndexerRequest {
  const req = getEventsByAgentTool.buildRequest(params);
  assert.equal(req.target, 'indexer');
  return req as IndexerRequest;
}

function filters(req: IndexerRequest): Array<Record<string, unknown>> {
  const query = req.body.query as {
    bool: { filter: Array<Record<string, unknown>> };
  };
  return query.bool.filter;
}

test('targets wazuh-events-v5*, never wazuh-findings-v5*', () => {
  const req = buildIndexer({});
  assert.equal(req.index, 'wazuh-events-v5*');
});

test('with no agent_name: only the time-range filter is present (all agents)', () => {
  const req = buildIndexer({});
  assert.deepEqual(filters(req), [
    { range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } },
  ]);
});

test('with agent_name: adds a term clause on the ECS "agent.name" field -- NOT "wazuh.agent.name"', () => {
  const req = buildIndexer({ agent_name: 'web-prod-01' });
  const clauses = filters(req);
  assert.equal(clauses.length, 2);
  assert.deepEqual(clauses[1], { term: { 'agent.name': 'web-prod-01' } });
});

test('an empty-string agent_name contributes no filter clause (same as omitted)', () => {
  const req = buildIndexer({ agent_name: '' });
  assert.equal(filters(req).length, 1);
});

test('a non-string agent_name is ignored, not coerced', () => {
  const req = buildIndexer({ agent_name: 12345 });
  assert.equal(filters(req).length, 1);
});

test('defaults the time range to now-90d/now when omitted', () => {
  const req = buildIndexer({ agent_name: 'web-prod-01' });
  assert.deepEqual(filters(req)[0], {
    range: { '@timestamp': { gte: 'now-90d', lte: 'now' } },
  });
});

test('honors an explicit time range', () => {
  const req = buildIndexer({
    agent_name: 'web-prod-01',
    time_range_gte: 'now-1h',
    time_range_lte: 'now',
  });
  assert.deepEqual(filters(req)[0], {
    range: { '@timestamp': { gte: 'now-1h', lte: 'now' } },
  });
});

test('defaults limit to 20 when omitted', () => {
  const req = buildIndexer({});
  assert.equal(req.body.size, 20);
});

test('clamps limit to the maximum of 500', () => {
  const req = buildIndexer({ limit: 10000 });
  assert.equal(req.body.size, 500);
});

test('clamps a non-positive limit up to the floor of 1', () => {
  const req = buildIndexer({ limit: 0 });
  assert.equal(req.body.size, 1);
});

test('sorts by @timestamp descending, most recent first', () => {
  const req = buildIndexer({});
  assert.deepEqual(req.body.sort, [{ '@timestamp': { order: 'desc' } }]);
});

test('spec: exposes agent_name as optional (not in the required list)', () => {
  const required = (
    getEventsByAgentTool.spec.parameters as { required?: string[] }
  ).required;
  assert.equal(required === undefined || !required.includes('agent_name'), true);
});

test('table/digest columns stay within the fields verified present on the seeded events docs', () => {
  const columnFields = getEventsByAgentTool.tableSpec.columns.map(c => c.field);
  assert.deepEqual(columnFields, [
    '@timestamp',
    'agent.name',
    'event.category',
    'event.action',
    'event.outcome',
  ]);
  assert.deepEqual(getEventsByAgentTool.digest.sampleColumns, columnFields);
});
