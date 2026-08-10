import assert from 'node:assert/strict';
import { getMitreFindingsTool } from './get-mitre-findings';
import { IndexerRequest } from '../types';
import { BREAKDOWN_BUCKET_CAP } from '../digest';
import { FINDING_BREAKDOWN_AGGS } from './common';

/**
 * Unit tests for get_mitre_findings (issue #8920 item 2: sub-technique rollup). The registry-wide
 * class guard lives in technique-rollup-coverage.test.ts; these are this tool's own shape/wiring
 * assertions.
 */

function buildIndexer(params: Record<string, unknown>): IndexerRequest {
  const req = getMitreFindingsTool.buildRequest(params);
  assert.equal(req.target, 'indexer');
  return req as IndexerRequest;
}

function filters(req: IndexerRequest): Array<Record<string, unknown>> {
  const query = req.body.query as {
    bool: { filter: Array<Record<string, unknown>> };
  };
  return query.bool.filter;
}

test('get_mitre_findings: no technique_id falls back to the exists filter, unchanged', () => {
  const req = buildIndexer({});
  assert.deepEqual(filters(req)[0], {
    exists: { field: 'wazuh.rule.mitre.technique.id' },
  });
});

test('get_mitre_findings: a bare parent id ("T1059") rolls up to term + sibling prefix', () => {
  const req = buildIndexer({ technique_id: 'T1059' });
  assert.deepEqual(filters(req)[0], {
    bool: {
      minimum_should_match: 1,
      should: [
        { term: { 'wazuh.rule.mitre.technique.id': 'T1059' } },
        { prefix: { 'wazuh.rule.mitre.technique.id': 'T1059.' } },
      ],
    },
  });
});

test('get_mitre_findings: a lowercase id is uppercased before querying (keyword term/prefix are case-sensitive)', () => {
  const req = buildIndexer({ technique_id: 't1110' });
  assert.deepEqual(filters(req)[0], {
    bool: {
      minimum_should_match: 1,
      should: [
        { term: { 'wazuh.rule.mitre.technique.id': 'T1110' } },
        { prefix: { 'wazuh.rule.mitre.technique.id': 'T1110.' } },
      ],
    },
  });
});

test('get_mitre_findings: a dotted sub-technique id ("T1059.001") stays an exact-only term', () => {
  const req = buildIndexer({ technique_id: 'T1059.001' });
  assert.deepEqual(filters(req)[0], {
    term: { 'wazuh.rule.mitre.technique.id': 'T1059.001' },
  });
});

test('get_mitre_findings: a non-"T\\d+" shaped id (defensive fallback) stays an exact-only term', () => {
  // Not the parent shape (PARENT_TECHNIQUE_ID_RE requires "T" + digits only) -- treated as already
  // maximally specific rather than guessed at, same as a dotted id.
  const req = buildIndexer({ technique_id: 'not-a-real-id' });
  assert.deepEqual(filters(req)[0], {
    term: { 'wazuh.rule.mitre.technique.id': 'not-a-real-id' },
  });
});

test('get_mitre_findings: always attaches a technique_ids terms agg for the exact-vs-rollup disclosure', () => {
  const withParent = buildIndexer({ technique_id: 'T1059' });
  // Alongside FINDING_BREAKDOWN_AGGS (issue #8920 item 1's agent/rule-title distribution) --
  // asserted as a superset, so this test pins the technique disclosure without re-pinning the
  // shared breakdown constant common.test.ts already owns.
  const aggs = withParent.body.aggs as Record<string, unknown>;
  assert.deepEqual(aggs.technique_ids, {
    terms: {
      field: 'wazuh.rule.mitre.technique.id',
      size: BREAKDOWN_BUCKET_CAP,
    },
  });
  for (const [name, def] of Object.entries(FINDING_BREAKDOWN_AGGS)) {
    assert.deepEqual(aggs[name], def);
  }
  // Also attached with no technique_id at all -- the breakdown is useful for "any MITRE finding"
  // too, not only a rolled-up call.
  const noFilter = buildIndexer({});
  assert.deepEqual(noFilter.body.aggs, withParent.body.aggs);
});

test('get_mitre_findings: time range and limit are unaffected by the rollup change', () => {
  const req = buildIndexer({
    technique_id: 'T1059',
    time_range_gte: 'now-7d',
    time_range_lte: 'now',
    limit: 50,
  });
  assert.deepEqual(filters(req)[1], {
    range: { '@timestamp': { gte: 'now-7d', lte: 'now' } },
  });
  assert.equal(req.body.size, 50);
});

test('get_mitre_findings: description documents the rollup and the per-id breakdown disclosure', () => {
  const { description } = getMitreFindingsTool.spec;
  assert.match(description, /sub-technique/i);
  assert.match(description, /T1059/);
  assert.match(description, /breakdown/i);
});
