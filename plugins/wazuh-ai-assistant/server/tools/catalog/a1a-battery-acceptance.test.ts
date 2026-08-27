import assert from 'node:assert/strict';
import { searchWazuhDataTool } from './search-wazuh-data';
import { checkIndexAllowlist, applySafetyValves, lintDsl } from '../guardrails';
import { GENERIC_QUERY_INDEX_PATTERNS } from './generic-query-families';

/**
 * Acceptance-shaped tests for three questions answerable ONLY through this generic query layer
 * (not a one-off typed tool), end to end through the real guardrail pipeline
 * (`checkIndexAllowlist` -> `applySafetyValves` -> `lintDsl`, the same sequence `executor.ts`'s
 * `executeIndexerRequest` runs unconditionally). These do not invoke a live model or a live
 * cluster (this is a unit-test tier suite) -- they prove the mechanical path a real turn would
 * take is actually open: the index is allowlisted, the request survives every safety valve, and
 * the DSL lints clean, for exactly the request shape that question implies.
 */

/** Builds and fully validates a search_wazuh_data request the way executor.ts would, returning
 * the final clamped body so a test can assert on its shape too. */
function buildAndValidate(
  indexPattern: string,
  queryDsl: Record<string, unknown>,
) {
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

// --- "How healthy is agent-manager communication right now?" (metrics-comms). This branch's
// guardrails.ts widening (wazuh-metrics-* added to INDEX_ALLOWLIST_RE) and
// generic-query-families.ts's new enum entry together make this answerable through
// search_wazuh_data, with no new typed tool. ----------------------------------------------------

test('"how healthy is agent-manager communication right now" is answerable via search_wazuh_data (wazuh-metrics-comms)', () => {
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

// --- "How fresh is our threat intel? Has the CVE/ruleset/IOC feed synced recently?"
// (.wazuh-cti-consumers + .wazuh-content-manager-jobs). A hypothetical new typed tool
// (`get_cti_status`) could answer this; the alternative is ONE generic tool, so this proves the
// SAME row is answerable without it. -------------------------------------------------------------

test('"how fresh is our threat intel" is answerable via search_wazuh_data (.wazuh-cti-consumers)', () => {
  assert.ok(GENERIC_QUERY_INDEX_PATTERNS.includes('.wazuh-cti-consumers'));
  const { index, body } = buildAndValidate('.wazuh-cti-consumers', {
    query: { bool: { filter: [] } },
    size: 20,
    _source: ['name', 'context', 'status', 'local_offset', 'remote_offset'],
  });
  assert.equal(index, '.wazuh-cti-consumers');
  assert.equal(typeof body.query, 'object');
});

test('schedule half: the content-manager sync schedule is answerable via search_wazuh_data (.wazuh-content-manager-jobs)', () => {
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

// --- "Is IP/hash/URL X known-malicious per our threat intel?" (wazuh-threatintel-
// enrichments-a) is answerable through search_wazuh_data now that the index is allowlisted.
// ---------------------------------------------------------------------------------------------

test('"is IP/hash/URL X known-malicious" is answerable via search_wazuh_data (wazuh-threatintel-enrichments-a)', () => {
  assert.ok(
    GENERIC_QUERY_INDEX_PATTERNS.includes('wazuh-threatintel-enrichments-a'),
  );
  // The indicator VALUE lives in `document.name`, not `hash.sha256` --
  // that root field is the RECORD'S OWN content hash (a sibling of `document`, e.g.
  // `{"hash":{"sha256":"4321..."}, "document":{"name":"<the actual indicator>", "type":
  // "hash_sha256"}}`), unrelated to the indicator being looked up. A `term` filter on `hash.sha256`
  // lints clean and passes this test, but against real data it returns 0 hits forever.
  // Filtering `document.name` (with `document.type`
  // narrowing to the indicator kind) is what actually matches the live terms-agg population
  // (`document.type`: url_domain 107,653 / connection 95,252 / url_full 28,704 / hash_sha256
  // 10,734 / hash_md5 8,167 / hash_sha1 6,559).
  const { index } = buildAndValidate('wazuh-threatintel-enrichments-a', {
    query: {
      bool: {
        filter: [
          {
            term: {
              'document.name':
                '43213038f6dd23be380e9ee07e339e33b27a1da94ebd6e35af3258d2f1374951',
            },
          },
          { term: { 'document.type': 'hash_sha256' } },
        ],
      },
    },
    size: 5,
    _source: [
      'document.name',
      'document.type',
      'document.provider',
      'hash.sha256',
    ],
  });
  assert.equal(index, 'wazuh-threatintel-enrichments-a');
});
