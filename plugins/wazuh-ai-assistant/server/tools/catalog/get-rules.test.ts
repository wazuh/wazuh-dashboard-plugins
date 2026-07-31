import assert from 'node:assert/strict';
import { getRulesTool } from './get-rules';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getRulesTool.buildRequest(params) as IndexerRequest;
}

test('get_rules: defaults to enabled=true, no other filters, size 20', () => {
  const request = build({});
  assert.equal(request.index, 'wazuh-threatintel-rules*');
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.enabled': true } }] },
  });
  assert.equal(request.body.size, 20);
  assert.deepEqual(request.body.sort, ['_doc']);
  assert.deepEqual(request.body._source, [
    'document.metadata.title',
    'document.level',
    'document.status',
    'document.enabled',
    'document.mitre.technique.id',
    'document.tags',
    'document.logsource.product',
    'document.logsource.category',
    'space.name',
  ]);
});

test('get_rules: buildSecurityAnalyticsLink points to the rules app with the resolved space', () => {
  const link = getRulesTool.buildSecurityAnalyticsLink?.({}, 'standard');
  assert.deepEqual(link, {
    label: 'Open in Security Analytics',
    url: '/app/rules#/rules?space=standard',
  });
  const draftLink = getRulesTool.buildSecurityAnalyticsLink?.({}, 'draft');
  assert.equal(draftLink?.url, '/app/rules#/rules?space=draft');
});

test('get_rules: enabled="disabled" filters on false', () => {
  const request = build({ enabled: 'disabled' });
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ term: { 'document.enabled': false } }] },
  });
});

test('get_rules: enabled="any" produces no filter at all', () => {
  const request = build({ enabled: 'any' });
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_rules: status/level/tag/technique_id each add exactly one filter', () => {
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
        { term: { 'document.mitre.technique.id': 'T1110' } },
      ],
    },
  });
});

test('get_rules: clamps limit to the [1, 500] range', () => {
  assert.equal(build({ limit: 9999 }).body.size, 500);
  assert.equal(build({ limit: 0 }).body.size, 1);
});

test('get_rules: default body passes checkIndexAllowlist and lintDsl (no time range required)', () => {
  const request = build({});
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('get_rules: table/digest columns stay within the declared _source', () => {
  const source = new Set(build({}).body._source as string[]);
  for (const column of getRulesTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of getRulesTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});
