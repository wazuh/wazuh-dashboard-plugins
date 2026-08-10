import assert from 'node:assert/strict';
import { getMitreFindingsTool } from './get-mitre-findings';
import { IndexerRequest } from '../types';
import { ANSWER_BUCKET_CAP } from '../digest';
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

function techniqueIdsTerms(req: IndexerRequest): Record<string, unknown> {
  const aggs = req.body.aggs as {
    technique_ids: { terms: Record<string, unknown> };
  };
  return aggs.technique_ids.terms;
}

test('get_mitre_findings: always attaches a technique_ids terms agg for the exact-vs-rollup disclosure', () => {
  const noFilter = buildIndexer({});
  // Alongside FINDING_BREAKDOWN_AGGS (issue #8920 item 1's agent/rule-title distribution) --
  // asserted as a superset, so this test pins the technique disclosure without re-pinning the
  // shared breakdown constant common.test.ts already owns.
  const aggs = noFilter.body.aggs as Record<string, unknown>;
  for (const [name, def] of Object.entries(FINDING_BREAKDOWN_AGGS)) {
    assert.deepEqual(aggs[name], def);
  }
});

test('get_mitre_findings: no technique_id leaves the technique_ids agg unscoped ("any MITRE finding")', () => {
  // The "any MITRE-tagged finding" case must keep its full-population top-N breakdown -- there is
  // no single requested id to scope buckets to.
  const req = buildIndexer({});
  assert.deepEqual(techniqueIdsTerms(req), {
    field: 'wazuh.rule.mitre.technique.id',
    size: ANSWER_BUCKET_CAP,
  });
});

test('get_mitre_findings: a bare parent id scopes technique_ids via include to itself + sub-techniques', () => {
  // Issue: wazuh.rule.mitre.technique.id is a keyword ARRAY, so a document commonly carries
  // several co-tagged ids besides the one the user asked about (live evidence: a single finding
  // tagged with six ids across three tactics). Those co-tags compete for the same bucket slots
  // and can silently push the requested id's own parent/sub-technique buckets out of the list
  // -- this `include` pattern is what stops that by excluding
  // every other id family from the aggregation's candidate set entirely.
  const req = buildIndexer({ technique_id: 'T1059' });
  const terms = techniqueIdsTerms(req);
  assert.equal(terms.field, 'wazuh.rule.mitre.technique.id');
  assert.equal(terms.size, ANSWER_BUCKET_CAP);
  assert.equal(terms.include, 'T1059(\\..*)?');
});

test('get_mitre_findings: a lowercase parent id is uppercased before building the include pattern', () => {
  const req = buildIndexer({ technique_id: 't1110' });
  assert.equal(techniqueIdsTerms(req).include, 'T1110(\\..*)?');
});

test('get_mitre_findings: a dotted sub-technique id scopes technique_ids to that exact id only', () => {
  const req = buildIndexer({ technique_id: 'T1059.001' });
  // The dot must be escaped (`\\.`), not left as a Lucene-regexp "any character" wildcard --
  // otherwise "T1059X001" (or any other single-char substitution) would also match.
  assert.equal(techniqueIdsTerms(req).include, 'T1059\\.001');
});

test('get_mitre_findings: a non-ATT&CK-shaped id (defensive fallback) scopes to that literal string', () => {
  const req = buildIndexer({ technique_id: 'not-a-real-id' });
  assert.equal(techniqueIdsTerms(req).include, 'not-a-real-id');
});

test('get_mitre_findings: co-tagged ids cannot crowd the requested id out of the bucket cap', () => {
  // The defect this fix closes, made concrete: without `include`, a co-tag-heavy population fills
  // every bucket slot with OTHER technique families before the requested id's own
  // buckets are considered, and the sub-technique split silently never appears. With `include`
  // scoping the aggregation's candidate set to the requested family up front, co-tags can never be
  // bucketed at all, so they cannot occupy a slot regardless of how many co-tagged documents exist.
  const req = buildIndexer({ technique_id: 'T1059' });
  const include = techniqueIdsTerms(req).include as string;
  const coTaggedIds = ['T1562', 'T1070', 'T1040', 'T1562.002', 'T1070.001'];
  const pattern = new RegExp(`^(?:${include})$`);
  for (const id of coTaggedIds) {
    assert.equal(
      pattern.test(id),
      false,
      `co-tagged id "${id}" must not match the requested id's include pattern`,
    );
  }
  assert.equal(pattern.test('T1059'), true);
  assert.equal(pattern.test('T1059.001'), true);
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
