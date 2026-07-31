import assert from 'node:assert/strict';
import { getDetectorsTool } from './get-detectors';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getDetectorsTool.buildRequest(params) as IndexerRequest;
}

test('get_detectors: defaults to enabled=true, wrapped in a nested query, size 20', () => {
  const request = build({});
  assert.equal(request.index, '.opensearch-sap-detectors-config');
  assert.deepEqual(request.body.query, {
    nested: {
      path: 'detector',
      query: { bool: { filter: [{ term: { 'detector.enabled': true } }] } },
    },
  });
  assert.equal(request.body.size, 20);
  assert.deepEqual(request.body.sort, ['_doc']);
});

test('get_detectors: enabled="any" with no other filters produces match_all, not an empty nested query', () => {
  const request = build({ enabled: 'any' });
  assert.deepEqual(request.body.query, { match_all: {} });
});

test('get_detectors: detector_type and source each add one nested filter clause', () => {
  const request = build({
    enabled: 'any',
    detector_type: 'suricata',
    source: 'standard',
  });
  assert.deepEqual(request.body.query, {
    nested: {
      path: 'detector',
      query: {
        bool: {
          filter: [
            { term: { 'detector.detector_type': 'suricata' } },
            { term: { 'detector.source': 'standard' } },
          ],
        },
      },
    },
  });
});

test('get_detectors: an invalid source value is ignored (no filter, no throw)', () => {
  const request = build({ enabled: 'any', source: 'draft' });
  assert.deepEqual(request.body.query, { match_all: {} });
});

test('get_detectors: clamps limit to the [1, 500] range', () => {
  assert.equal(build({ limit: 9999 }).body.size, 500);
  assert.equal(build({ limit: 0 }).body.size, 1);
});

test('get_detectors: default body passes checkIndexAllowlist and lintDsl (no time range required)', () => {
  const request = build({});
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('get_detectors: table/digest columns stay within the declared _source', () => {
  const source = new Set(build({}).body._source as string[]);
  for (const column of getDetectorsTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of getDetectorsTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});
