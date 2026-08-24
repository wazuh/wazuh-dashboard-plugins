import assert from 'node:assert/strict';
import { getTopRulesTool } from './get-top-rules';
import {
  applySafetyValves,
  checkIndexAllowlist,
  lintDsl,
  MAX_AGG_SIZE,
} from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getTopRulesTool.buildRequest(params) as IndexerRequest;
}

test('get_top_rules: buildRequest targets wazuh-findings-v5* with a bounded @timestamp range', () => {
  const request = build({ time_range_gte: 'now-7d', time_range_lte: 'now' });
  assert.equal(request.index, 'wazuh-findings-v5*');
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }],
    },
  });
  assert.equal(request.body.size, 0);
});

// Issue #8921 (the "796 hits for a 1-doc title" falsehood): `wazuh.rule.title` is only ever a
// SAMPLE of one document in the bucket -- `distinct_titles` and `high_or_critical` are the
// sub-aggs that turn that sample into an honest one, and BOTH must merge into the row via
// digest.ts's existing metric-/filter-sub-agg branches with no digest.ts change (verified: a
// `cardinality` sub-agg is a metric agg with a `{value}` shape, a `filter` sub-agg has a bare
// `{doc_count}` shape -- see digest.ts's `bucketsToRows` doc comment). `wazuh.rule.level` rides
// the SAME `sample_doc` top_hits sample (issue #8921's "missing severity" item -- see this file's
// top-of-file doc comment), guarded by its own `distinct_levels` cardinality sub-agg exactly like
// the title is guarded by `distinct_titles`.
test('get_top_rules: aggregates by wazuh.rule.id with a sample title+level, distinct_titles, distinct_levels, and a high/critical count', () => {
  const request = build({ limit: 10 });
  assert.deepEqual(request.body.aggs, {
    top_rules: {
      terms: { field: 'wazuh.rule.id', size: 10 },
      aggs: {
        sample_doc: {
          top_hits: {
            size: 1,
            _source: ['wazuh.rule.title', 'wazuh.rule.level'],
          },
        },
        distinct_titles: { cardinality: { field: 'wazuh.rule.title' } },
        distinct_levels: { cardinality: { field: 'wazuh.rule.level' } },
        high_or_critical: {
          filter: { terms: { 'wazuh.rule.level': ['high', 'critical'] } },
        },
      },
    },
  });
});

test('get_top_rules: clamps limit to the guardrails aggregation cap, not a larger ceiling', () => {
  const topRulesSize = (request: IndexerRequest): unknown =>
    (request.body.aggs as { top_rules: { terms: { size: unknown } } }).top_rules
      .terms.size;
  assert.equal(topRulesSize(build({ limit: 9999 })), MAX_AGG_SIZE);
  assert.equal(topRulesSize(build({ limit: 0 })), 1);
});

test('get_top_rules: tableSpec column order is meaning -> severity -> magnitude -> spread -> identity, with the numeric rule id demoted (not deleted) to last', () => {
  assert.deepEqual(
    getTopRulesTool.tableSpec.columns.map(column => column.field),
    [
      'wazuh.rule.title',
      'wazuh.rule.level',
      'doc_count',
      'distinct_titles',
      'high_or_critical',
      'key',
    ],
  );
  assert.equal(getTopRulesTool.tableSpec.columns[0].label, 'Rule (sample)');
  // "key" (the rule id) is demoted to last, not removed -- the model's own aggregate-then-lookup
  // workflow depends on the id staying reachable.
  assert.equal(
    getTopRulesTool.tableSpec.columns[
      getTopRulesTool.tableSpec.columns.length - 1
    ].field,
    'key',
  );
});

// Issue #8921's "missing severity" item: the top-rules table rendered zero badge elements even
// though the same digest already aggregates a high/critical count -- `wazuh.rule.level` (a sample
// off the same document `wazuh.rule.title` samples) is marked `severity: true` so result-table.tsx
// renders it with the SAME EuiBadge component/pattern the vulnerability table uses, and sits at
// index 1 -- well inside the client's MAX_VISIBLE_RESULT_COLUMNS budget of 6, asserted
// registry-wide by visible-column-budget-coverage.test.ts.
test('get_top_rules: wazuh.rule.level is flagged as the severity column', () => {
  const severityColumn = getTopRulesTool.tableSpec.columns.find(
    column => column.severity,
  );
  assert.equal(severityColumn?.field, 'wazuh.rule.level');
  assert.equal(severityColumn?.label, 'Level (sample)');
});

test('get_top_rules: digest.sampleColumns keeps "key" (demoted-not-deleted) and adds the spread/severity columns, including the level sample and its distinct_levels guard', () => {
  assert.deepEqual(getTopRulesTool.digest.sampleColumns, [
    'key',
    'doc_count',
    'wazuh.rule.title',
    'wazuh.rule.level',
    'distinct_titles',
    'distinct_levels',
    'high_or_critical',
  ]);
});

test('get_top_rules: description discloses that the title is a sample', () => {
  assert.match(getTopRulesTool.spec.description, /title shown is a sample/i);
});

test('get_top_rules: request passes checkIndexAllowlist, applySafetyValves, and lintDsl', () => {
  const request = build({ limit: 10 });
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const valved = applySafetyValves(request.body);
  assert.equal(valved.ok, true);
  if (!valved.ok) {
    return;
  }
  const lint = lintDsl(valved.body, request.index);
  assert.equal(lint.ok, true, lint.ok ? '' : lint.reason);
});

test('get_top_rules: still passes lintDsl at its maximum advertised limit', () => {
  const request = build({ limit: 9999 });
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});
