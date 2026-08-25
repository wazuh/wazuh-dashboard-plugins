import assert from 'node:assert/strict';
import { getCtiStatusTool } from './get-cti-status';
import { lintDsl, checkIndexAllowlist } from '../guardrails';
import { IndexerRequest } from '../types';

function build(params: Record<string, unknown>): IndexerRequest {
  return getCtiStatusTool.buildRequest(params) as IndexerRequest;
}

// Derived from resolveParams's own signature rather than imported from the OSD platform path,
// matching the convention api-host.test.ts documents for the same reason.
type ResolveParamsFn = Exclude<
  typeof getCtiStatusTool.resolveParams,
  undefined
>;
type CtiContext = Parameters<ResolveParamsFn>[1];
type CtiRequest = Parameters<ResolveParamsFn>[2];

function fakeContext(
  searchImpl: (req: unknown) => Promise<unknown>,
): CtiContext {
  return {
    core: {
      opensearch: {
        client: { asCurrentUser: { search: searchImpl } },
      },
    },
  } as unknown as CtiContext;
}

test('get_cti_status: default body is match_all against .wazuh-cti-consumers', () => {
  const request = build({});
  assert.equal(request.index, '.wazuh-cti-consumers');
  assert.deepEqual(request.body.query, { match_all: {} });
  assert.equal(request.body.size, 10);
});

test('get_cti_status: feed filter resolves to an ids query on the stable per-feed doc id', () => {
  const request = build({ feed: 'iocs' });
  assert.deepEqual(request.body.query, {
    ids: { values: ['cti:catalog:consumer:iocs'] },
  });
});

test('get_cti_status: an unrecognized feed value is ignored (match_all, no throw)', () => {
  const request = build({ feed: 'not-a-real-feed' });
  assert.deepEqual(request.body.query, { match_all: {} });
});

// CV-078: default body must pass the same guardrail chain the real escape-hatch path already
// proved reachable for this index (a1a-battery-acceptance.test.ts).
test('CV-078: default body passes checkIndexAllowlist and lintDsl', () => {
  const request = build({});
  assert.equal(checkIndexAllowlist(request.index).ok, true);
  const result = lintDsl(request.body, request.index);
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('get_cti_status: table/digest columns stay within the declared _source', () => {
  const source = new Set(build({}).body._source as string[]);
  for (const column of getCtiStatusTool.tableSpec.columns) {
    assert.ok(source.has(column.field), `${column.field} missing from _source`);
  }
  for (const field of getCtiStatusTool.tableSpec.rowFields ?? []) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
  for (const field of getCtiStatusTool.digest.sampleColumns) {
    assert.ok(source.has(field), `${field} missing from _source`);
  }
});

// Live-verified 2026-08-19 shape (.wazuh-content-manager-jobs): "Catalog Sync Periodic Task" every
// 60 Minutes, "Telemetry Ping Periodic Task" every 1 Days, both enabled.
test('get_cti_status: resolveParams summarizes the sync schedule from .wazuh-content-manager-jobs', async () => {
  const search = jest.fn().mockResolvedValue({
    body: {
      hits: {
        hits: [
          {
            _source: {
              name: 'Catalog Sync Periodic Task',
              job_type: 'consumer-sync-task',
              schedule: { interval: { period: 60, unit: 'Minutes' } },
              enabled: true,
            },
          },
          {
            _source: {
              name: 'Telemetry Ping Periodic Task',
              job_type: 'telemetry-ping-task',
              schedule: { interval: { period: 1, unit: 'Days' } },
              enabled: true,
            },
          },
        ],
      },
    },
  });
  const result = await getCtiStatusTool.resolveParams!(
    {},
    fakeContext(search),
    {} as unknown as CtiRequest,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    const note = result.resolved.note ?? '';
    assert.match(
      note,
      /Catalog Sync Periodic Task every 60 Minutes \(enabled\)/,
    );
    assert.match(note, /Telemetry Ping Periodic Task every 1 Days \(enabled\)/);
  }
});

test('get_cti_status: resolveParams degrades honestly when the schedule lookup fails', async () => {
  const search = jest.fn().mockRejectedValue(new Error('unreachable'));
  const result = await getCtiStatusTool.resolveParams!(
    {},
    fakeContext(search),
    {} as unknown as CtiRequest,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(result.resolved.note ?? '', /could not be checked/);
  }
});
