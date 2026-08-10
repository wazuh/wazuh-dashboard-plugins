import assert from 'node:assert/strict';
import { getScaChecksTool } from './get-sca-checks';
import { IndexerRequest } from '../types';
import { applySafetyValves, lintDsl } from '../guardrails';
import { BREAKDOWN_BUCKET_CAP, buildDigest } from '../digest';

/**
 * Unit tests for get_sca_checks (SCA per-check drill-down), rewritten for the Wazuh 5.0 port:
 * the tool moved from the removed Manager endpoint
 * `GET /sca/{agent}/checks/{policy}` to an Indexer query against `wazuh-states-sca*`
 * (term wazuh.agent.id + term policy.id + optional term check.result + optional multi_match).
 *
 * #8935 item I2 (scoped-enumeration) additions live in their own section below the original
 * suite: a `matching_*` enumeration aggregation (result scope carried in the agg NAME), the
 * `search` should-clause moving from `query.bool.filter` to `post_filter`, the post_filter-aware
 * zero-row hint, and the `check.name` guardrails allowlist entry that makes the new aggregation
 * legal in the first place.
 */

/** Same enumeration cap get-sca-checks.ts defines locally -- see that file's doc comment for why
 * this is not (yet) imported from digest.ts. Duplicated here rather than exported purely for
 * tests, matching this file's existing style of asserting against the real named constant
 * (BREAKDOWN_BUCKET_CAP) wherever one is importable. */
const ANSWER_BUCKET_CAP = 50;

function buildIndexer(params: Record<string, unknown>): IndexerRequest {
  const req = getScaChecksTool.buildRequest(params);
  assert.equal(req.target, 'indexer');
  return req as IndexerRequest;
}

function filters(req: IndexerRequest): Array<Record<string, unknown>> {
  const query = req.body.query as {
    bool: { filter: Array<Record<string, unknown>> };
  };
  return query.bool.filter;
}

/** The `post_filter` clause, when present -- `undefined` when the request carried no `search`. */
function postFilter(req: IndexerRequest): Record<string, unknown> | undefined {
  return req.body.post_filter as Record<string, unknown> | undefined;
}

test('get_sca_checks: buildRequest targets wazuh-states-sca* with agent+policy terms', () => {
  const req = buildIndexer({ agent_id: '000', policy_id: 'cis_ubuntu22-04' });
  assert.equal(req.index, 'wazuh-states-sca*');
  assert.deepEqual(filters(req), [
    { term: { 'wazuh.agent.id': '000' } },
    { term: { 'policy.id': 'cis_ubuntu22-04' } },
  ]);
  assert.equal(req.body.size, 20);
});

test('get_sca_checks: result becomes a term filter; search becomes exact-OR-prefix in post_filter', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'Ensure SSH',
  });
  const clauses = filters(req);
  assert.deepEqual(clauses[2], { term: { 'check.result': 'Failed' } });
  // #8935 item I2: `search`'s should-pair moved from `query.bool.filter` to `post_filter` (still
  // exactly two clauses: agent + policy + result -- no `search` clause in `query.bool.filter` at
  // all). Its CONTENT is unchanged from before this item: the multi_match (correct for a full
  // exact value) OR a non-leading prefix on `check.name`, so "Ensure SSH" works too. `check.name`/
  // `check.description`/`check.rationale` are all `keyword` in 5.0, so an analyzed multi_match on
  // its own silently returned nothing for any fragment — proven live: search "ssh" -> 0 hits,
  // while the full exact check name -> 1. A true substring search is deliberately NOT attempted
  // on this HITS query (on a keyword field it needs a leading wildcard, which the guardrails
  // reject on purpose) -- the substring/topic case is instead answered by `matching_checks` below.
  assert.equal(clauses.length, 3);
  assert.deepEqual(postFilter(req), {
    bool: {
      minimum_should_match: 1,
      should: [
        {
          multi_match: {
            query: 'Ensure SSH',
            fields: ['check.name', 'check.description', 'check.rationale'],
          },
        },
        { prefix: { 'check.name': 'Ensure SSH' } },
      ],
    },
  });
});

test('get_sca_checks: no search -> no post_filter at all (byte-identical to before this item)', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
  });
  assert.equal(postFilter(req), undefined);
  assert.ok(!('post_filter' in req.body));
});

test('get_sca_checks: result="passed"/"not applicable" map to the real capitalized index values', () => {
  const passed = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'passed',
  });
  assert.deepEqual(filters(passed)[2], { term: { 'check.result': 'Passed' } });

  const notApplicable = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'not applicable',
  });
  assert.deepEqual(filters(notApplicable)[2], {
    term: { 'check.result': 'Not applicable' },
  });
});

test('get_sca_checks: policy_id is trimmed', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: '  cis_ubuntu22-04  ',
  });
  assert.deepEqual(filters(req)[1], {
    term: { 'policy.id': 'cis_ubuntu22-04' },
  });
});

test('get_sca_checks: missing policy_id throws', () => {
  assert.throws(
    () => getScaChecksTool.buildRequest({ agent_id: '000' }),
    /policy_id/,
  );
});

test('get_sca_checks: empty-string policy_id throws', () => {
  assert.throws(
    () => getScaChecksTool.buildRequest({ agent_id: '000', policy_id: '   ' }),
    /policy_id/,
  );
});

test('get_sca_checks: invalid agent_id throws (delegates to validateAgentId)', () => {
  assert.throws(
    () =>
      getScaChecksTool.buildRequest({
        agent_id: 'not-numeric',
        policy_id: 'cis_ubuntu22-04',
      }),
    /agent_id/,
  );
});

test('get_sca_checks: limit is clamped to [1, 500]', () => {
  const over = buildIndexer({ agent_id: '000', policy_id: 'p', limit: 10_000 });
  assert.equal(over.body.size, 500);
  const under = buildIndexer({ agent_id: '000', policy_id: 'p', limit: 0 });
  assert.equal(under.body.size, 1);
});

// --- Issue #8920 item 1 (population-disclosure): a plain hits search gave the model no
// population-true view of the Passed/Failed/Not-applicable distribution, so a `limit`-truncated
// page was silently narrated as if it were the whole result ("named 2 of 10 failed checks"). ---

test('get_sca_checks: always attaches a population-true check.result breakdown aggregation', () => {
  const req = buildIndexer({ agent_id: '000', policy_id: 'cis_ubuntu22-04' });
  assert.deepEqual(req.body.aggs, {
    results: { terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP } },
  });
});

test('get_sca_checks: the breakdown aggregation rides along with a bare (no result/search) call', () => {
  // Regression pin: this is the ONE call shape #8935 item I2 must leave byte-identical --
  // no `result` and no `search` means no `matching_checks` agg at all, same two-key `aggs` as
  // before this item existed.
  const withLimitOnly = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    limit: 500,
  });
  assert.deepEqual(withLimitOnly.body.aggs, {
    results: { terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP } },
  });
});

// --- #8935 item I2 (scoped-enumeration): "which SSH checks failed" must enumerate the ~10
// matching check NAMES population-true, instead of competing with 102 failed checks for sample
// rows. Mechanism: a `matching_*` terms agg on `check.name` (name carries the result scope
// in-band — see matchingChecksAggName in get-sca-checks.ts), scoped via `terms.include` to the
// requested fragment when `search` is supplied, attached whenever `result` OR `search` is
// present. ---

test('get_sca_checks: result alone attaches an UNSCOPED, result-named enumeration agg', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
  });
  assert.deepEqual(req.body.aggs, {
    results: { terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP } },
    // The agg NAME says what the enumerated names are (all failed — the query's own result term
    // scopes the aggregation), and the explicit _key order makes the cut deterministic:
    // wazuh-states-sca holds one doc per check, so every doc_count is 1 and count order is
    // degenerate anyway.
    matching_failed_checks: {
      terms: {
        field: 'check.name',
        size: ANSWER_BUCKET_CAP,
        order: { _key: 'asc' },
      },
    },
  });
});

test('get_sca_checks: search alone attaches a SCOPED all-results enumeration and DROPS the results agg', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: 'ssh',
  });
  // Scope-mixing fix (integration review): with the search clause in post_filter, `results`
  // would count the whole policy while the question is about the subject — for a subject call
  // the enumeration IS the answer, so it is the only aggregation. Its name says the enumerated
  // checks span ALL results, so "which SSH checks FAILED" cannot silently absorb passed ones.
  const aggKeys = Object.keys(req.body.aggs as Record<string, unknown>);
  assert.deepEqual(aggKeys, ['matching_checks_all_results']);
  const aggs = req.body.aggs as {
    matching_checks_all_results?: {
      terms: { field: string; size: number; include: string };
    };
  };
  assert.equal(aggs.matching_checks_all_results?.terms.field, 'check.name');
  assert.equal(aggs.matching_checks_all_results?.terms.size, ANSWER_BUCKET_CAP);
  const include = aggs.matching_checks_all_results?.terms.include ?? '';
  // Executed as a REAL regexp (Lucene `terms.include` is fully anchored -- ^...$ -- per
  // entity-resolution.ts's precedent), against real 5.0 check names: a case-insensitive
  // "contains ssh" match, nothing else.
  const anchored = new RegExp(`^${include}$`);
  assert.ok(anchored.test('Ensure sshd PermitRootLogin is disabled'));
  assert.ok(anchored.test('Ensure SSH root login is disabled'));
  assert.ok(anchored.test('ENSURE SSH ROOT LOGIN IS DISABLED'));
  assert.ok(!anchored.test('Ensure rsyslog is installed'));
});

test('get_sca_checks: result+search together attach exactly ONE scoped, result-named agg', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'ssh',
  });
  const aggKeys = Object.keys(req.body.aggs as Record<string, unknown>);
  assert.deepEqual(aggKeys, ['matching_failed_checks']);
  const aggs = req.body.aggs as {
    matching_failed_checks: { terms: { include: string } };
  };
  assert.ok(
    new RegExp(`^${aggs.matching_failed_checks.terms.include}$`).test(
      'Ensure SSH root login is disabled',
    ),
  );
});

test('get_sca_checks: a multi-word result value maps to a legal agg name', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'not applicable',
  });
  const aggKeys = Object.keys(req.body.aggs as Record<string, unknown>);
  assert.ok(aggKeys.includes('matching_not_applicable_checks'));
});

test('get_sca_checks: the enumeration include is built from the TRIMMED search value', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: '  ssh  ',
  });
  const aggs = req.body.aggs as {
    matching_checks_all_results: { terms: { include: string } };
  };
  const anchored = new RegExp(
    `^${aggs.matching_checks_all_results.terms.include}$`,
  );
  assert.ok(anchored.test('Ensure SSH root login is disabled'));
  // The post_filter's prefix/multi_match use the same trimmed subject.
  const pf = postFilter(req) as {
    bool: { should: Array<Record<string, unknown>> };
  };
  assert.deepEqual(pf.bool.should[1], { prefix: { 'check.name': 'ssh' } });
});

test('get_sca_checks: a whitespace-only search is treated as ABSENT (byte-identical bare call)', () => {
  // Integration review: '   ' previously produced include '.*\ \ \ .*' (matches nothing) plus a
  // prefix on the empty string — a silently dead subject. Whitespace-only now means "no subject".
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: '   ',
  });
  assert.ok(!('post_filter' in req.body));
  assert.deepEqual(req.body.aggs, {
    results: { terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP } },
  });
});

test('get_sca_checks: the search subject is length-capped before it becomes a cluster-side regexp', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: 'a'.repeat(5000),
  });
  const aggs = req.body.aggs as {
    matching_checks_all_results: { terms: { include: string } };
  };
  const include = aggs.matching_checks_all_results.terms.include;
  // 200 letters -> 200 [aA] classes (4 chars each) + the two '.*' anchors.
  assert.equal(include.length, 200 * 4 + 4);
  const pf = postFilter(req) as {
    bool: { should: Array<Record<string, unknown>> };
  };
  assert.deepEqual(pf.bool.should[1], {
    prefix: { 'check.name': 'a'.repeat(200) },
  });
});

test('get_sca_checks: include escaping — digits pass through, everything non-alphanumeric is escaped', () => {
  // Integration review: the digit and backslash-escape branches of buildContainsIncludePattern
  // were never executed by any test. Each pattern is executed as a REAL anchored regexp against
  // realistic check-name shapes.
  const digits = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: 'CIS 5.2.1',
  });
  const digitsInclude = (
    digits.body.aggs as {
      matching_checks_all_results: { terms: { include: string } };
    }
  ).matching_checks_all_results.terms.include;
  const digitsRe = new RegExp(`^${digitsInclude}$`);
  assert.ok(digitsRe.test('Ensure CIS 5.2.1 sshd access is configured'));
  assert.ok(digitsRe.test('ensure cis 5.2.1 sshd access is configured'));
  // The escaped dot must NOT match as a wildcard: '5x2y1' is not '5.2.1'.
  assert.ok(!digitsRe.test('Ensure CIS 5x2y1 sshd access is configured'));

  const underscore = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: 'sshd_config',
  });
  const underscoreInclude = (
    underscore.body.aggs as {
      matching_checks_all_results: { terms: { include: string } };
    }
  ).matching_checks_all_results.terms.include;
  assert.ok(
    new RegExp(`^${underscoreInclude}$`).test(
      'Ensure permissions on /etc/ssh/sshd_config are configured',
    ),
  );

  const parens = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: '(root)',
  });
  const parensInclude = (
    parens.body.aggs as {
      matching_checks_all_results: { terms: { include: string } };
    }
  ).matching_checks_all_results.terms.include;
  // Must COMPILE (unbalanced/unescaped parens would throw here) and match literally.
  const parensRe = new RegExp(`^${parensInclude}$`);
  assert.ok(parensRe.test('Ensure access to su is restricted (root)'));
  assert.ok(!parensRe.test('Ensure access to su is restricted root'));
});

test('get_sca_checks: a fragment call digest explains the post_filtered 0 total instead of blaming filters', () => {
  // Integration review BLOCKER on the first cut: a fragment like "ssh" passes 0 rows through the
  // post_filter (exact-keyword fields), so the digest showed a 0 total right beside a breakdown
  // proving the query matched — and, when the enumeration was empty too, the zero-row hint blamed
  // the innocent agent/policy/result filters ("0 rows. Filters applied: ..."). The
  // post_filter-aware hint (digest.ts) names the real mechanism and points the model at the
  // population-true aggregations. FAILS ON BASE (no post_filter branch in buildZeroRowHint) and
  // against this item's own first cut.
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'ssh',
  });
  const response = {
    hits: { total: { value: 0 }, hits: [] },
    aggregations: {
      matching_failed_checks: {
        buckets: [
          { key: 'Ensure SSH root login is disabled', doc_count: 1 },
          { key: 'Ensure sshd PermitRootLogin is disabled', doc_count: 1 },
        ],
      },
    },
  };
  const digest = buildDigest(
    'get_sca_checks',
    response,
    getScaChecksTool,
    req.body,
  );
  // The post_filter passed 0 hits, so the digest's rows/counts came from the aggregation buckets
  // (bucketsToRows) — the hint keys on the response's raw hits total to catch exactly this shape.
  assert.equal(digest.counts.total, 2, 'bucket rows became the digest rows');
  assert.ok(digest.hint, 'expected a post_filter disclosure hint');
  assert.match(digest.hint!, /post_filter/);
  assert.match(digest.hint!, /population-true/);
  assert.doesNotMatch(
    digest.hint!,
    /Filters applied/,
    'the query filters must not be blamed for a post_filter zero-total page',
  );
  // The enumeration still reached the breakdown: the digest is self-consistent.
  assert.equal(digest.breakdown!.length, 2);
});

test('get_sca_checks: a fragment matching NOTHING still gets the post_filter hint, never the filter blame', () => {
  // Both the post_filter and the include-scoped enumeration miss: the honest reading is "the
  // subject matched no values", and the hint says exactly that; the base instead emitted
  // '0 rows. Filters applied: wazuh.agent.id, policy.id, check.result...' — blaming three
  // filters that all matched. FAILS ON BASE.
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'xyzzy',
  });
  const response = {
    hits: { total: { value: 0 }, hits: [] },
    aggregations: { matching_failed_checks: { buckets: [] } },
  };
  const digest = buildDigest(
    'get_sca_checks',
    response,
    getScaChecksTool,
    req.body,
  );
  assert.equal(digest.counts.returned, 0);
  assert.ok(digest.hint);
  assert.match(digest.hint!, /matched no values/);
  assert.doesNotMatch(digest.hint!, /Filters applied/);
});

test('get_sca_checks: the request (with its new aggs clause) passes applySafetyValves + lintDsl', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'Ensure SSH',
  });
  const valved = applySafetyValves(req.body);
  assert.equal(valved.ok, true, valved.ok ? '' : valved.reason);
  if (!valved.ok) {
    return;
  }
  const lint = lintDsl(valved.body, req.index);
  assert.equal(lint.ok, true, lint.ok ? '' : lint.reason);
});

test('get_sca_checks: tableSpec/digest declare the locked 5.0 columns/rowFields/sampleColumns', () => {
  assert.deepEqual(
    getScaChecksTool.tableSpec.columns.map(c => c.field),
    ['check.id', 'check.name', 'check.result', 'check.reason'],
  );
  assert.deepEqual(getScaChecksTool.tableSpec.rowFields, [
    'check.remediation',
    'check.rules',
  ]);
  assert.deepEqual(getScaChecksTool.digest.sampleColumns, [
    'check.id',
    'check.name',
    'check.result',
  ]);
  // Long-text fields stay out of the digest (token-budget decision, unchanged from 4.14).
  assert.ok(
    !getScaChecksTool.digest.sampleColumns.includes('check.remediation'),
  );
  assert.ok(
    !getScaChecksTool.digest.sampleColumns.includes('check.description'),
  );
});
