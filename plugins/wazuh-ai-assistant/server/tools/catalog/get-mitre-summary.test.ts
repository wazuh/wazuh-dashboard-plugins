import assert from 'node:assert/strict';
import { getMitreSummaryTool } from './get-mitre-summary';
import {
  applySafetyValves,
  checkIndexAllowlist,
  lintDsl,
  MAX_AGG_SIZE,
} from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getMitreSummaryTool.buildRequest(params) as IndexerRequest;
}

test('get_mitre_summary: buildRequest targets wazuh-findings-v5* with an exists filter plus a bounded @timestamp range', () => {
  const request = build({ time_range_gte: 'now-7d', time_range_lte: 'now' });
  assert.equal(request.index, 'wazuh-findings-v5*');
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        { exists: { field: 'wazuh.rule.mitre.technique.id' } },
        { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
      ],
    },
  });
  assert.equal(request.body.size, 0);
});

// Issue #8921's WORSE case than get_top_rules: technique/tactic names are MULTI-VALUE arrays, so
// the bucket key (one technique id) does not by itself say which array element is "its" name.
// Sampling `technique.id` alongside the names restores a positional match (the two arrays are
// parallel on any one document); `distinct_names` is the same spread-disclosure sub-agg
// get_top_rules uses for its own sampled title.
test('get_mitre_summary: aggregates by technique.id with a sample doc (incl. the parallel id array) and distinct_names', () => {
  const request = build({ limit: 10 });
  assert.deepEqual(request.body.aggs, {
    top_techniques: {
      terms: { field: 'wazuh.rule.mitre.technique.id', size: 10 },
      aggs: {
        sample_doc: {
          top_hits: {
            size: 1,
            _source: [
              'wazuh.rule.mitre.technique.id',
              'wazuh.rule.mitre.technique.name',
              'wazuh.rule.mitre.tactic.name',
            ],
          },
        },
        distinct_names: {
          cardinality: { field: 'wazuh.rule.mitre.technique.name' },
        },
        distinct_tactics: {
          cardinality: { field: 'wazuh.rule.mitre.tactic.name' },
        },
      },
    },
  });
});

test('get_mitre_summary: clamps limit to the guardrails aggregation cap, not a larger ceiling', () => {
  const topTechniquesSize = (request: IndexerRequest): unknown =>
    (
      request.body.aggs as {
        top_techniques: { terms: { size: unknown } };
      }
    ).top_techniques.terms.size;
  assert.equal(topTechniquesSize(build({ limit: 9999 })), MAX_AGG_SIZE);
  assert.equal(topTechniquesSize(build({ limit: 0 })), 1);
});

test('get_mitre_summary: tableSpec relabels the sampled columns "(sample)" and demotes the technique id to last', () => {
  assert.deepEqual(
    getMitreSummaryTool.tableSpec.columns.map(column => column.field),
    [
      'wazuh.rule.mitre.technique.name',
      'doc_count',
      'distinct_names',
      'wazuh.rule.mitre.tactic.name',
      'key',
    ],
  );
  assert.deepEqual(
    getMitreSummaryTool.tableSpec.columns.map(column => column.label),
    ['Technique (sample)', 'Count', 'Distinct names', 'Tactic (sample)', 'Technique ID'],
  );
});

test('get_mitre_summary: digest.sampleColumns keeps "key" and adds distinct_names, distinct_tactics, and the technique id array', () => {
  assert.deepEqual(getMitreSummaryTool.digest.sampleColumns, [
    'key',
    'doc_count',
    'wazuh.rule.mitre.technique.name',
    'distinct_names',
    'wazuh.rule.mitre.tactic.name',
    'distinct_tactics',
    'wazuh.rule.mitre.technique.id',
  ]);
});

test('get_mitre_summary: request passes checkIndexAllowlist, applySafetyValves, and lintDsl', () => {
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

test('get_mitre_summary: still passes lintDsl at its maximum advertised limit', () => {
  const request = build({ limit: 9999 });
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});
