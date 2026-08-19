import assert from 'node:assert/strict';
import { getFieldValuesTool } from './get-field-values';
import {
  applySafetyValves,
  checkIndexAllowlist,
  lintDsl,
} from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getFieldValuesTool.buildRequest(params) as IndexerRequest;
}

test('get_field_values: defaults to the field\'s first known surface with a bounded terms + missing agg', () => {
  const request = build({ field: 'check.result' });
  assert.equal(request.index, 'wazuh-states-sca*');
  assert.deepEqual(request.body.aggs, {
    values: { terms: { field: 'check.result', size: 50 } },
    missing_count: {
      filter: { bool: { must_not: [{ exists: { field: 'check.result' } }] } },
    },
  });
  assert.equal(request.body.size, 0);
});

test('get_field_values: a time-based family (findings/events) gets a bounded @timestamp range', () => {
  const request = build({
    field: 'wazuh.rule.level',
    time_range_gte: 'now-7d',
    time_range_lte: 'now',
  });
  assert.equal(request.index, 'wazuh-findings-v5*');
  assert.deepEqual(request.body.query, {
    bool: { filter: [{ range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } }] },
  });
});

test('get_field_values: a non-time-based family (sca/vulnerabilities/inventory) gets no @timestamp range', () => {
  const request = build({ field: 'vulnerability.severity' });
  assert.equal(request.index, 'wazuh-states-vulnerabilities*');
  assert.deepEqual(request.body.query, { bool: { filter: [] } });
});

test('get_field_values: index_family disambiguates a field that lives on more than one surface', () => {
  const onFindings = build({ field: 'wazuh.agent.id', index_family: 'findings' });
  assert.equal(onFindings.index, 'wazuh-findings-v5*');
  const onSca = build({ field: 'wazuh.agent.id', index_family: 'sca' });
  assert.equal(onSca.index, 'wazuh-states-sca*');
});

test('get_field_values: an invalid index_family for the given field throws, listing the valid ones', () => {
  assert.throws(
    () => build({ field: 'check.result', index_family: 'findings' }),
    /Valid surfaces for this field: sca/,
  );
});

test('get_field_values: prefix becomes a fully-escaped, case-expanded, anchored-start terms.include regexp', () => {
  const request = build({ field: 'host.os.name', prefix: 'Ubu' });
  assert.deepEqual(
    (request.body.aggs as Record<string, { terms: { include?: string } }>).values.terms
      .include,
    '[uU][bB][uU].*',
  );
});

test('get_field_values: an unknown field is rejected with close-match suggestions, never reaching the indexer', () => {
  assert.throws(
    () => build({ field: 'wazuh.rule.leveel' }),
    /not one of this tool's vetted, bounded-cardinality fields.*wazuh\.rule\.level/s,
  );
});

test('get_field_values: a field with no known FIELD_LOCATIONS entry is rejected even if hypothetically ' +
  'added to the allowlist elsewhere -- this tool has its own closed location map', () => {
  assert.throws(
    () => build({ field: 'source.port' }),
    /not one of this tool's vetted, bounded-cardinality fields/,
  );
});

test('get_field_values: field is required', () => {
  assert.throws(() => build({}), /Parameter "field" is required/);
});

test('get_field_values: request passes checkIndexAllowlist, applySafetyValves, and lintDsl', () => {
  for (const params of [
    { field: 'wazuh.rule.level' },
    { field: 'check.result' },
    { field: 'vulnerability.severity' },
    { field: 'host.os.name', prefix: 'linux' },
    { field: 'source.ip', index_family: 'events' },
  ]) {
    const request = build(params);
    assert.equal(checkIndexAllowlist(request.index).ok, true, request.index);
    const valved = applySafetyValves(request.body);
    assert.equal(valved.ok, true);
    if (!valved.ok) {
      continue;
    }
    const lint = lintDsl(valved.body, request.index);
    assert.equal(lint.ok, true, lint.ok ? '' : lint.reason);
  }
});

test('get_field_values: tableSpec and digest surface the bucket key/count', () => {
  assert.deepEqual(
    getFieldValuesTool.tableSpec.columns.map(c => c.field),
    ['key', 'doc_count'],
  );
  assert.deepEqual(getFieldValuesTool.digest.sampleColumns, ['key', 'doc_count']);
});
