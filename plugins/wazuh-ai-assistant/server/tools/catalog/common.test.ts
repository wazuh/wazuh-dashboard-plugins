import assert from 'node:assert/strict';
import {
  FINDING_BREAKDOWN_AGGS,
  FINDING_BREAKDOWN_DIMENSIONS,
  FINDING_DIGEST_EXTRA_COLUMNS,
  FINDING_SCOPE_NOTE,
  findingDigestColumns,
  STANDARD_FINDING_SAMPLE_COLUMNS,
  STANDARD_FINDING_TABLE_COLUMNS,
  nameFilterClause,
  nameFilterProperty,
  SCA_CURRENT_STATE_NOTE,
  severitiesAtOrAbove,
  severitiesAtOrBelow,
  severityFilterValues,
  VULN_BREAKDOWN_AGGS,
  VULN_BREAKDOWN_DIMENSIONS,
  VULN_CURRENT_STATE_NOTE,
  VULN_DIGEST_SAMPLE_COLUMNS,
  VULN_SOURCE_FIELDS,
  VULN_SOURCE_FIELDS_WITH_AGENT_ID,
} from './common';
import { BREAKDOWN_BUCKET_CAP } from '../digest';
import { FIELD_POLICY_DEFAULTS } from '../privacy';

// --- nameFilterClause / nameFilterProperty: shared name filter for the catalog tools ----------
// (review a0-review.md, findings F1/F4/F5)

test('nameFilterClause: the description match uses operator "and", not the default "or"', () => {
  const clause = nameFilterClause(
    'server side template injection',
    ['document.metadata.title'],
    'document.metadata.description',
  ) as { bool: { should: Array<Record<string, unknown>> } };
  const matchClause = clause.bool.should[clause.bool.should.length - 1];
  assert.deepEqual(matchClause, {
    match: {
      'document.metadata.description': {
        query: 'server side template injection',
        operator: 'and',
      },
    },
  });
});

test('nameFilterClause: still builds a term+prefix should-clause per keyword field', () => {
  const clause = nameFilterClause(
    'apache',
    ['document.name', 'document.metadata.title'],
    'document.metadata.description',
  ) as { bool: { minimum_should_match: number; should: unknown[] } };
  assert.equal(clause.bool.minimum_should_match, 1);
  // 2 keyword fields * (term + prefix) + 1 description match
  assert.equal(clause.bool.should.length, 5);
});

test('nameFilterProperty: description tells the model to retry with a shorter word on 0 rows', () => {
  const property = nameFilterProperty('rule');
  assert.match(
    property.description as string,
    /retry once with a shorter root word/,
  );
});

test('severitiesAtOrAbove returns the tail of the severity order, inclusive', () => {
  assert.deepEqual(severitiesAtOrAbove('medium'), [
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severitiesAtOrAbove('critical'), ['critical']);
});

test('severitiesAtOrAbove is case-insensitive and fails open on an unknown value', () => {
  assert.deepEqual(severitiesAtOrAbove('MEDIUM'), [
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severitiesAtOrAbove('bogus'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severitiesAtOrBelow returns the head of the severity order, inclusive', () => {
  assert.deepEqual(severitiesAtOrBelow('medium'), [
    'informational',
    'low',
    'medium',
  ]);
  assert.deepEqual(severitiesAtOrBelow('informational'), ['informational']);
});

test('severitiesAtOrBelow is case-insensitive and fails open on an unknown value', () => {
  assert.deepEqual(severitiesAtOrBelow('MEDIUM'), [
    'informational',
    'low',
    'medium',
  ]);
  assert.deepEqual(severitiesAtOrBelow('bogus'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues defaults to an exact match', () => {
  assert.deepEqual(severityFilterValues('medium'), ['medium']);
  assert.deepEqual(severityFilterValues('medium', 'exact'), ['medium']);
});

test('severityFilterValues supports at_or_above and at_or_below', () => {
  assert.deepEqual(severityFilterValues('medium', 'at_or_above'), [
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severityFilterValues('medium', 'at_or_below'), [
    'informational',
    'low',
    'medium',
  ]);
});

test('severityFilterValues fails open to the full list for an unrecognized exact value', () => {
  assert.deepEqual(severityFilterValues('bogus'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues is case-insensitive in exact mode', () => {
  assert.deepEqual(severityFilterValues('MEDIUM'), ['medium']);
  assert.deepEqual(severityFilterValues('  High  '), ['high']);
});

test('severityFilterValues fails open to the full list for an empty-string value', () => {
  assert.deepEqual(severityFilterValues(''), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues fails open to the full list for an unrecognized comparison, never silently exact-matching', () => {
  assert.deepEqual(severityFilterValues('medium', 'gte'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
  assert.deepEqual(severityFilterValues('medium', 'at-or-above'), [
    'informational',
    'low',
    'medium',
    'high',
    'critical',
  ]);
});

test('severityFilterValues treats an undefined comparison as exact', () => {
  assert.deepEqual(severityFilterValues('medium', undefined), ['medium']);
});

// --- FINDING_BREAKDOWN_AGGS: real aggregations attached to every finding-hits tool's request ----

test('FINDING_BREAKDOWN_AGGS declares one terms aggregation per FINDING_BREAKDOWN_DIMENSIONS', () => {
  assert.equal(
    Object.keys(FINDING_BREAKDOWN_AGGS).length,
    FINDING_BREAKDOWN_DIMENSIONS.length,
  );
  for (const field of FINDING_BREAKDOWN_DIMENSIONS) {
    const aggName = field.replace(/\./g, '_');
    const agg = FINDING_BREAKDOWN_AGGS[aggName] as {
      terms?: { field?: string; size?: number };
    };
    assert.ok(
      agg,
      `expected an aggregation named "${aggName}" for field "${field}"`,
    );
    assert.equal(agg.terms?.field, field);
    // Sized identically to the synthetic fallback's per-dimension cap (digest.ts's
    // buildSyntheticBreakdown) so the token cost of a breakdown does not depend on which of the
    // two paths ends up serving a given call.
    assert.equal(agg.terms?.size, BREAKDOWN_BUCKET_CAP);
  }
});

// --- VULN_BREAKDOWN_AGGS: real aggregations attached to the 3 hits-based vulnerability tools ----
// (prevents reporting "no high-severity vulnerabilities" on a host that actually has some, just
// sorted outside the returned page).

test('VULN_BREAKDOWN_AGGS declares one terms aggregation per VULN_BREAKDOWN_DIMENSIONS', () => {
  assert.equal(
    Object.keys(VULN_BREAKDOWN_AGGS).length,
    VULN_BREAKDOWN_DIMENSIONS.length,
  );
  for (const field of VULN_BREAKDOWN_DIMENSIONS) {
    const aggName = field.replace(/\./g, '_');
    const agg = VULN_BREAKDOWN_AGGS[aggName] as {
      terms?: { field?: string; size?: number };
    };
    assert.ok(
      agg,
      `expected an aggregation named "${aggName}" for field "${field}"`,
    );
    assert.equal(agg.terms?.field, field);
    assert.equal(agg.terms?.size, BREAKDOWN_BUCKET_CAP);
  }
});

// --- FINDING_DIGEST_EXTRA_COLUMNS -------------------------------------------------------------
// A templated rule TITLE says neither what the detection is nor what actually ran, so without these
// columns an explanatory answer has nothing grounded to draw on and the final-round instruction
// correctly forbids inventing it.

test('FINDING_DIGEST_EXTRA_COLUMNS: carries the two explanation-critical fields', () => {
  assert.ok(
    FINDING_DIGEST_EXTRA_COLUMNS.includes('wazuh.rule.description'),
    'the ruleset prose about what the rule detects',
  );
  assert.ok(
    FINDING_DIGEST_EXTRA_COLUMNS.includes('process.command_line'),
    'the one field that says WHAT ran',
  );
});

test('FINDING_DIGEST_EXTRA_COLUMNS: every entry has an explicit privacy policy entry', () => {
  // Restates, at this list's own boundary, the rule field-policy-coverage.test.ts enforces across
  // the catalog: a new digest column without a classification is a leak when privacy is on.
  const classified = new Set(FIELD_POLICY_DEFAULTS.map(entry => entry.field));
  for (const field of FINDING_DIGEST_EXTRA_COLUMNS) {
    assert.ok(
      classified.has(field),
      `${field} is sent to the model but has no FIELD_POLICY_DEFAULTS entry`,
    );
  }
});

test('privacy policy: rule.description is allowed, command_line stays anonymized', () => {
  const policy = (field: string) =>
    FIELD_POLICY_DEFAULTS.find(entry => entry.field === field)?.action;
  assert.equal(policy('wazuh.rule.description'), 'allow');
  assert.equal(
    policy('process.command_line'),
    'anonymize',
    'putting command_line in the digest must NOT relax its policy -- under privacy mode the model ' +
      'sees a pseudonym, exactly as the row expander already did',
  );
});

test('findingDigestColumns: appends the extras without duplicating a tool-declared column', () => {
  const columns = findingDigestColumns([
    '@timestamp',
    'wazuh.rule.description',
  ]);
  assert.equal(
    columns.filter(field => field === 'wazuh.rule.description').length,
    1,
  );
  assert.ok(columns.includes('process.command_line'));
});

// --- The vulnerability digest carries the CVE's own description -------------------------------
// `wazuh-states-vulnerabilities` has no dedicated fixed-version/remediation field -- the fix bound
// lives in `vulnerability.scanner.condition`, already sampled -- so the description is the only
// other prescriptive field, and a remediation answer needs it to say what the flaw IS.

test('VULN_DIGEST_SAMPLE_COLUMNS: carries both fix-bearing fields the vulnerability docs have', () => {
  assert.ok(
    VULN_DIGEST_SAMPLE_COLUMNS.includes('vulnerability.scanner.condition'),
    'the scanner\'s own fix bound (e.g. "Package less than 5.21.4")',
  );
  assert.ok(
    VULN_DIGEST_SAMPLE_COLUMNS.includes('vulnerability.description'),
    'what the flaw actually is -- without it, part (2) of an explanatory answer is pure recall',
  );
});

test('VULN_SOURCE_FIELDS: requests the description exactly once, not twice', () => {
  // It needs no explicit append: as a digest column it is already in the list, and appending it would
  // duplicate a `_source` entry.
  assert.equal(
    VULN_SOURCE_FIELDS.filter(field => field === 'vulnerability.description')
      .length,
    1,
  );
  assert.deepEqual(VULN_SOURCE_FIELDS, [...VULN_DIGEST_SAMPLE_COLUMNS]);
  assert.equal(VULN_SOURCE_FIELDS_WITH_AGENT_ID[0], 'wazuh.agent.id');
});

test('privacy policy: the CVE description is allow-SCAN, not the plain allow the scanner fields get', () => {
  // Registry-wide coverage is field-policy-coverage.test.ts's job; what matters here is the ACTION.
  // `vulnerability.description` is third-party CNA/NVD prose, not Wazuh's own scanner/OS-curated
  // metadata, so it stays readable but is shape- and dictionary-scanned on the way out.
  const policy = (field: string) =>
    FIELD_POLICY_DEFAULTS.find(entry => entry.field === field)?.action;
  assert.equal(policy('vulnerability.description'), 'allow-scan');
  assert.equal(policy('vulnerability.scanner.condition'), 'allow');
});

// --- The state-vs-history surface split -------------------------------------------------------
// The two surfaces carry different host lists for the same CVE, and disclosing a substitution is not
// enough, so the distinction has to be stated where the tool is CHOSEN, not only in the system
// prompt.

test('FINDING_SCOPE_NOTE: names findings as detection history, not current state', () => {
  assert.match(FINDING_SCOPE_NOTE, /detection HISTORY/);
  assert.match(FINDING_SCOPE_NOTE, /not current state/);
  // The pre-existing rule-matched-only scope must survive the addition.
  assert.match(FINDING_SCOPE_NOTE, /never the raw, unmatched event stream/);
});

test('VULN_CURRENT_STATE_NOTE: points a history question at the findings tools', () => {
  assert.match(VULN_CURRENT_STATE_NOTE, /what IS vulnerable right now/);
  assert.match(
    VULN_CURRENT_STATE_NOTE,
    /for what WAS detected, and when, use the findings tools/,
  );
  assert.match(
    VULN_CURRENT_STATE_NOTE,
    /no patched\/unpatched history over time/,
  );
});

test('SCA_CURRENT_STATE_NOTE: same split for the compliance surface', () => {
  assert.match(SCA_CURRENT_STATE_NOTE, /latest SCA scan state/);
  assert.match(SCA_CURRENT_STATE_NOTE, /use the findings tools/);
});

// --- The detection channel reaches the MODEL, not only the table ------------------------------
// `wazuh.integration.category` is the discriminator between two incidents that share an agent and
// technique tags. A visible table column is not enough: unless it is in the sample columns the model
// cannot tell the row sets apart, even though the user can.

test('STANDARD_FINDING_SAMPLE_COLUMNS: the model sees the same detection-channel column the table shows', () => {
  assert.ok(
    STANDARD_FINDING_SAMPLE_COLUMNS.includes('wazuh.integration.category'),
    'without it the model cannot tell two unrelated incidents in one result set apart',
  );
  assert.ok(
    STANDARD_FINDING_TABLE_COLUMNS.some(
      column => column.field === 'wazuh.integration.category',
    ),
    'the table already showed it -- the two surfaces must not disagree',
  );
});

test('findingDigestColumns: every finding-hits tool inherits the category column, without duplicating it', () => {
  const columns = findingDigestColumns(STANDARD_FINDING_SAMPLE_COLUMNS);
  assert.equal(
    columns.filter(field => field === 'wazuh.integration.category').length,
    1,
  );
});
