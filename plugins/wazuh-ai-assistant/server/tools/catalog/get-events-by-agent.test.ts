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

test('with agent_name: adds a match clause on "wazuh.agent.name"', () => {
  const req = buildIndexer({ agent_name: 'web-prod-01' });
  const clauses = filters(req);
  assert.equal(clauses.length, 2);
  assert.deepEqual(clauses[1], {
    match: { 'wazuh.agent.name': 'web-prod-01' },
  });
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
  assert.equal(
    required === undefined || !required.includes('agent_name'),
    true,
  );
});

test('table/digest columns stay within the fields verified present on the seeded events docs', () => {
  const columnFields = getEventsByAgentTool.tableSpec.columns.map(c => c.field);
  assert.deepEqual(columnFields, [
    '@timestamp',
    'wazuh.agent.name',
    'event.category',
    'event.action',
    'event.outcome',
  ]);
  // The digest is deliberately NOT column-for-column identical to the table: it adds the two process
  // fields the events mapping defines so an explanatory answer has something to explain from, while
  // the VISIBLE table stays unchanged. A sample column absent from a given document is omitted from
  // the sample row (`buildDigest` skips `undefined`), never rendered as an empty column.
  for (const field of columnFields) {
    assert.ok(
      getEventsByAgentTool.digest.sampleColumns.includes(field),
      `${field} must stay a digest sample column`,
    );
  }
  assert.deepEqual(
    getEventsByAgentTool.digest.sampleColumns.filter(
      field => !columnFields.includes(field),
    ),
    ['process.name', 'process.command_line'],
  );
});

// Issue #8920 item 1 (population-disclosure): this tool sorts by @timestamp desc with no real
// aggregation, so its digest.samples are only the newest events -- breakdownDimensions is the
// synthetic fallback that groups every RETURNED row instead.
test('digest opts into the synthetic event.category/event.outcome breakdown fallback', () => {
  assert.deepEqual(getEventsByAgentTool.digest.breakdownDimensions, [
    'event.category',
    'event.outcome',
  ]);
});

// --- The digest must carry what actually ran --------------------------------------------------
// The five original sample columns name that something happened and how it ended, never WHAT ran,
// which is the one thing an explanatory answer about an event needs.

test('digest sampleColumns: carry process.name and process.command_line', () => {
  const columns = getEventsByAgentTool.digest.sampleColumns;
  assert.ok(columns.includes('process.command_line'));
  assert.ok(columns.includes('process.name'));
  // The original five must all survive -- this is an addition, not a replacement.
  for (const field of [
    '@timestamp',
    'wazuh.agent.name',
    'event.category',
    'event.action',
    'event.outcome',
  ]) {
    assert.ok(columns.includes(field), `${field} must remain a sample column`);
  }
});

test('digest sampleColumns: no _source restriction is needed for the new fields', () => {
  // The tool sends no `_source`, so every field of the matched document is available to
  // `buildDigest`'s `getByPath` -- if a future change adds an allowlist, these two must be on it.
  const req = buildIndexer({});
  assert.equal(
    (req.body as Record<string, unknown>)._source,
    undefined,
    'adding a _source allowlist here would silently empty the new digest columns',
  );
});
