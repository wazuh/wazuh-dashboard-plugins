import assert from 'node:assert/strict';
import { searchWazuhDataTool } from './search-wazuh-data';
import {
  checkIndexAllowlist,
  applySafetyValves,
  lintDsl,
} from '../guardrails';
import { GENERIC_QUERY_INDEX_PATTERNS } from './generic-query-families';

/**
 * Acceptance-shaped tests for workstream A1a (AI/plan/coverage-validation-design.md): three
 * validation-battery rows the design doc itself marks as "no tool today" / "no workstream (G1)"
 * that ONLY this generic query layer (not a new one-off typed tool, not another workstream) makes
 * answerable, end to end through the real guardrail pipeline (`checkIndexAllowlist` ->
 * `applySafetyValves` -> `lintDsl`, the same sequence `executor.ts`'s `executeIndexerRequest` runs
 * unconditionally). These do not invoke a live model or a live cluster (this is a unit-test tier
 * suite) -- they prove the mechanical path a real turn would take is actually open: the index is
 * allowlisted, the request survives every safety valve, and the DSL lints clean, for exactly the
 * request shape that question implies.
 */

/** Builds and fully validates a search_wazuh_data request the way executor.ts would, returning
 * the final clamped body so a test can assert on its shape too. */
function buildAndValidate(indexPattern: string, queryDsl: Record<string, unknown>) {
  const request = searchWazuhDataTool.buildRequest!({
    index_pattern: indexPattern,
    query_dsl: JSON.stringify(queryDsl),
  }) as { index: string; body: Record<string, unknown> };

  const allowlistResult = checkIndexAllowlist(request.index);
  assert.equal(
    allowlistResult.ok,
    true,
    `checkIndexAllowlist rejected "${request.index}": ${
      allowlistResult.ok ? '' : allowlistResult.reason
    }`,
  );

  const valvesResult = applySafetyValves(request.body);
  assert.equal(
    valvesResult.ok,
    true,
    `applySafetyValves rejected the request: ${
      valvesResult.ok ? '' : valvesResult.reason
    }`,
  );
  const clampedBody = valvesResult.ok ? valvesResult.body : request.body;

  const lintResult = lintDsl(clampedBody, request.index);
  assert.equal(
    lintResult.ok,
    true,
    `lintDsl rejected the request: ${lintResult.ok ? '' : lintResult.reason}`,
  );

  return { index: request.index, body: clampedBody };
}

// --- CV-070: "How healthy is agent-manager communication right now?" (metrics-comms, coverage
// doc's open gap G1 -- "no workstream", decline-today). This branch's guardrails.ts widening
// (wazuh-metrics-* added to INDEX_ALLOWLIST_RE) and generic-query-families.ts's new enum entry
// together make this answerable through search_wazuh_data, with no new typed tool. -------------

test('CV-070: "how healthy is agent-manager communication right now" is answerable via search_wazuh_data (wazuh-metrics-comms)', () => {
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-metrics-*'));
  const { index, body } = buildAndValidate('wazuh-metrics-*', {
    query: { bool: { filter: [] } },
    sort: [{ '@timestamp': { order: 'desc' } }],
    _source: [
      '@timestamp',
      'events.total',
      'events.failed.total',
      'messages.total',
      'network.egress.bytes',
      'network.ingress.bytes',
    ],
    size: 10,
  });
  assert.equal(index, 'wazuh-metrics-*');
  // wazuh-metrics-* is not a TIME_BASED_INDEX_RE family (current-state style, same as
  // wazuh-states-*) -- no mandatory @timestamp range clamp/rejection applies, confirming the
  // question can be answered with a plain "most recent documents" query, not a forced 90-day scan.
  assert.equal((body.size as number) <= 500, true);
});

// --- CV-078: "How fresh is our threat intel? Has the CVE/ruleset/IOC feed synced recently?"
// (.wazuh-cti-consumers + .wazuh-content-manager-jobs, coverage doc TC-7/MS-6/MS-7). The design
// doc names a hypothetical new typed tool (`get_cti_status`) for this; the product decision this
// workstream implements instead is ONE generic tool, so this proves the SAME row is answerable
// without it. ---------------------------------------------------------------------------------

test('CV-078: "how fresh is our threat intel" is answerable via search_wazuh_data (.wazuh-cti-consumers)', () => {
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('.wazuh-cti-consumers'));
  const { index, body } = buildAndValidate('.wazuh-cti-consumers', {
    query: { bool: { filter: [] } },
    size: 20,
    _source: ['name', 'context', 'status', 'local_offset', 'remote_offset'],
  });
  assert.equal(index, '.wazuh-cti-consumers');
  assert.equal(typeof body.query, 'object');
});

test('CV-078 (schedule half): the content-manager sync schedule is answerable via search_wazuh_data (.wazuh-content-manager-jobs)', () => {
  assert.ok(
    GENERIC_QUERY_INDEX_PATTERNS.includes('.wazuh-content-manager-jobs'),
  );
  const { index } = buildAndValidate('.wazuh-content-manager-jobs', {
    query: { bool: { filter: [] } },
    size: 20,
    _source: ['name', 'job_type', 'enabled', 'schedule'],
  });
  assert.equal(index, '.wazuh-content-manager-jobs');
});

// --- CV-049: "Is IP/hash/URL X known-malicious per our threat intel?" (wazuh-threatintel-
// enrichments-a, coverage doc TC-8 -- one of the two "production-shaped volume" cover-now rows,
// explicitly sequenced first). Previously an unconditional decline (guardrails.ts's own prior
// comment called this "deliberately out of scope"); this branch reverses that per the coverage
// doc's resequencing. ---------------------------------------------------------------------------

test('CV-049: "is IP/hash/URL X known-malicious" is answerable via search_wazuh_data (wazuh-threatintel-enrichments-a)', () => {
  assert.ok(
    GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-threatintel-enrichments-a'),
  );
  const { index } = buildAndValidate('wazuh-threatintel-enrichments-a', {
    query: {
      bool: {
        filter: [
          {
            term: {
              'hash.sha256':
                '43213038f6dd23be380e9ee07e339e33b27a1da94ebd6e35af3258d2f1374951',
            },
          },
        ],
      },
    },
    size: 5,
    _source: ['document.name', 'document.type', 'document.provider', 'hash.sha256'],
  });
  assert.equal(index, 'wazuh-threatintel-enrichments-a');
});
