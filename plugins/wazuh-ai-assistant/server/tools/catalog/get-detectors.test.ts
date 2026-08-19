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

function fakeContext(
  searchImpl: (req: unknown) => Promise<unknown>,
  transportRequestImpl?: (req: unknown) => Promise<unknown>,
) {
  return {
    core: {
      opensearch: {
        client: {
          asCurrentUser: {
            search: searchImpl,
            transport: { request: transportRequestImpl ?? jest.fn() },
          },
        },
      },
    },
  } as any;
}

test('get_detectors: resolveParams skips findings-count enrichment with no single detector_type', async () => {
  const search = jest.fn();
  const result = await getDetectorsTool.resolveParams!({}, fakeContext(search), {} as any);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.resolved.note, undefined);
  }
  assert.equal(search.mock.calls.length, 0);
});

// CV-017-adjacent, live-verified 2026-08-19: .opensearch-sap-wazuh-generic-findings had 161 real
// findings at verification time -- a positive count must be reported plainly, no guidance needed.
test('get_detectors: resolveParams reports a positive findings count without persistence guidance', async () => {
  const search = jest.fn().mockResolvedValue({ body: { hits: { total: { value: 161 } } } });
  const transportRequest = jest.fn();
  const result = await getDetectorsTool.resolveParams!(
    { detector_type: 'wazuh-generic' },
    fakeContext(search, transportRequest),
    {} as any,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.resolved.note ?? '', /Findings for detector_type "wazuh-generic": 161/);
  }
  // No need to check persistence when findings are already flowing.
  assert.equal(transportRequest.mock.calls.length, 0);
});

// Live-verified 2026-08-19: 14 of 15 detector types have 0 findings while
// persistent.plugins.alerting.alert_finding_enabled is "true" -- the correct guidance for THIS
// live state is "honest-empty, not a misconfiguration", never a fabricated "enable the setting".
test('get_detectors: resolveParams reports honest-empty guidance when persistence is enabled but findings are zero', async () => {
  const search = jest.fn().mockResolvedValue({ body: { hits: { total: { value: 0 } } } });
  const transportRequest = jest.fn().mockResolvedValue({
    body: { persistent: { plugins: { alerting: { alert_finding_enabled: 'true' } } } },
  });
  const result = await getDetectorsTool.resolveParams!(
    { detector_type: 'suricata' },
    fakeContext(search, transportRequest),
    {} as any,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.resolved.note ?? '', /Findings for detector_type "suricata": 0/);
    assert.match(result.resolved.note ?? '', /most likely means no matching source events/);
  }
});

test('get_detectors: resolveParams recommends enabling persistence when it resolves disabled', async () => {
  const search = jest.fn().mockResolvedValue({ body: { hits: { total: { value: 0 } } } });
  const transportRequest = jest.fn().mockResolvedValue({
    body: { defaults: { plugins: { alerting: { alert_finding_enabled: 'false' } } } },
  });
  const result = await getDetectorsTool.resolveParams!(
    { detector_type: 'docker' },
    fakeContext(search, transportRequest),
    {} as any,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.resolved.note ?? '', /findings persistence appears disabled/);
  }
});

test('get_detectors: resolveParams degrades honestly when the persistence check itself fails', async () => {
  const search = jest.fn().mockResolvedValue({ body: { hits: { total: { value: 0 } } } });
  const transportRequest = jest.fn().mockRejectedValue(new Error('403'));
  const result = await getDetectorsTool.resolveParams!(
    { detector_type: 'azure' },
    fakeContext(search, transportRequest),
    {} as any,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.resolved.note ?? '', /could not verify persistence settings -- requires admin/);
  }
});

test('get_detectors: resolveParams degrades honestly when the findings-index lookup itself fails', async () => {
  const search = jest.fn().mockRejectedValue(new Error('index_not_found_exception'));
  const result = await getDetectorsTool.resolveParams!(
    { detector_type: 'not-a-real-type' },
    fakeContext(search),
    {} as any,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.resolved.note ?? '', /could not be checked/);
  }
});
