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

const ALL_FEEDS_QUERY = {
  bool: { must_not: [{ ids: { values: ['cti:catalog:global'] } }] },
};

test('get_cti_status: default body reads every feed of .wazuh-cti-consumers, not the global doc', () => {
  const request = build({});
  assert.equal(request.index, '.wazuh-cti-consumers');
  assert.deepEqual(request.body.query, ALL_FEEDS_QUERY);
  assert.equal(request.body.size, 10);
});

test('get_cti_status: reads the last update and the pending sync steps of each feed', () => {
  const source = build({}).body._source as string[];
  assert.ok(source.includes('updated_at'));
  assert.ok(source.includes('pending_sync_phases'));
});

test('get_cti_status: feed filter resolves to an ids query on the stable per-feed doc id', () => {
  const request = build({ feed: 'iocs' });
  assert.deepEqual(request.body.query, {
    ids: { values: ['cti:catalog:consumer:iocs'] },
  });
});

test('get_cti_status: an unrecognized feed value is ignored (every feed, no throw)', () => {
  const request = build({ feed: 'not-a-real-feed' });
  assert.deepEqual(request.body.query, ALL_FEEDS_QUERY);
});

// Default body must pass the same guardrail chain the real escape-hatch path already
// proved reachable for this index (a1a-battery-acceptance.test.ts).
test('default body passes checkIndexAllowlist and lintDsl', () => {
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

test('get_cti_status: resolveParams adds the last check for updates from the global doc', async () => {
  const search = jest.fn((req: { index: string }) =>
    Promise.resolve({
      body: {
        hits: {
          hits:
            req.index === '.wazuh-cti-consumers'
              ? [
                  {
                    _source: { last_checked_at: '2026-05-21T12:26:16.581939Z' },
                  },
                ]
              : [],
        },
      },
    }),
  );
  const result = await getCtiStatusTool.resolveParams!(
    {},
    fakeContext(search as unknown as (req: unknown) => Promise<unknown>),
    {} as unknown as CtiRequest,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(
      result.resolved.note ?? '',
      /Last check for updates: 2026-05-21T12:26:16\.581939Z\./,
    );
  }
  expect(search).toHaveBeenCalledWith(
    expect.objectContaining({
      index: '.wazuh-cti-consumers',
      body: expect.objectContaining({
        query: { ids: { values: ['cti:catalog:global'] } },
      }),
    }),
  );
});

test('get_cti_status: resolveParams says when the indexer does not report the last check', async () => {
  const search = jest.fn().mockResolvedValue({ body: { hits: { hits: [] } } });
  const result = await getCtiStatusTool.resolveParams!(
    {},
    fakeContext(search),
    {} as unknown as CtiRequest,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.match(
      result.resolved.note ?? '',
      /Last check for updates: not reported by this indexer\./,
    );
  }
});
