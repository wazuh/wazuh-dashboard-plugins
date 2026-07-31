import assert from 'node:assert/strict';
import { getDetectionRulesTool } from './get-detection-rules';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getDetectionRulesTool.buildRequest(params) as IndexerRequest;
}

test('get_detection_rules: defaults to enabled=true, no other filters, size 20', () => {
  const request = build({});
  assert.equal(request.index, 'wazuh-threatintel-rules*');
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.enabled': true } }] },
  });
  assert.equal(request.body.size, 20);
  assert.deepEqual(request.body.sort, ['_doc']);
  assert.deepEqual(request.body._source, [
    'document.name',
    'document.level',
    'document.status',
    'document.enabled',
    'document.threat.technique.id',
    'document.tags',
    'document.logsource.product',
    'document.logsource.category',
    'document.metadata.title',
  ]);
});

test('get_detection_rules: enabled="disabled" filters on false', () => {
  const request = build({ enabled: 'disabled' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.enabled': false } }] },
  });
});

test('get_detection_rules: enabled="any" produces no filter at all', () => {
  const request = build({ enabled: 'any' });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_detection_rules: status/level/tag/technique_id each add exactly one filter', () => {
  const request = build({
    enabled: 'any',
    status: 'stable',
    level: 'critical',
    tag: 'attack.t1110',
    technique_id: 'T1110',
  });
  assert.deepEqual(request.body.query, {
    bool: {
      filter: [
        { term: { 'document.status': 'stable' } },
        { term: { 'document.level': 'critical' } },
        { term: { 'document.tags': 'attack.t1110' } },
        { term: { 'document.threat.technique.id': 'T1110' } },
      ],
    },
  });
});

test('get_detection_rules: clamps limit to the [1, 500] range', () => {
  assert.equal(build({ limit: 9999 }).body.size, 500);
  assert.equal(build({ limit: 0 }).body.size, 1);
});

test('get_detection_rules: default body passes checkIndexAllowlist and lintDsl (no time range required)', () => {
  const request = build({});
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('get_detection_rules: table/digest columns stay within the declared _source', () => {
  const source = new Set(build({}).body._source as string[]);
  for (const column of getDetectionRulesTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of getDetectionRulesTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});
