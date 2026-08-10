import assert from 'node:assert/strict';
import { getScaChecksTool } from './get-sca-checks';
import { IndexerRequest } from '../types';
import { applySafetyValves, lintDsl } from '../guardrails';
import { BREAKDOWN_BUCKET_CAP } from '../digest';

/**
 * Unit tests for get_sca_checks (SCA per-check drill-down), rewritten for the Wazuh 5.0 port:
 * the tool moved from the removed Manager endpoint
 * `GET /sca/{agent}/checks/{policy}` to an Indexer query against `wazuh-states-sca*`
 * (term wazuh.agent.id + term policy.id + optional term check.result + optional multi_match).
 *
 * #8935 item I2 (scoped-enumeration) additions live in their own section below the original
 * suite: a `matching_checks` enumeration aggregation, the `search` should-clause moving from
 * `query.bool.filter` to `post_filter`, and the `check.name` guardrails allowlist entry that
 * makes the new aggregation legal in the first place.
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
// rows. Mechanism: a `matching_checks` terms agg on `check.name`, scoped via `terms.include` to
// the requested fragment when `search` is supplied, attached whenever `result` OR `search` is
// present. ---

test('get_sca_checks: result alone attaches an UNSCOPED matching_checks enumeration agg', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
  });
  assert.deepEqual(req.body.aggs, {
    results: { terms: { field: 'check.result', size: BREAKDOWN_BUCKET_CAP } },
    matching_checks: {
      terms: { field: 'check.name', size: ANSWER_BUCKET_CAP },
    },
  });
});

test('get_sca_checks: search alone attaches a matching_checks agg SCOPED via terms.include', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: 'ssh',
  });
  const aggs = req.body.aggs as {
    matching_checks?: {
      terms: { field: string; size: number; include: string };
    };
  };
  assert.ok(
    aggs.matching_checks,
    'matching_checks agg missing for a search-only call',
  );
  assert.equal(aggs.matching_checks?.terms.field, 'check.name');
  assert.equal(aggs.matching_checks?.terms.size, ANSWER_BUCKET_CAP);
  const include = aggs.matching_checks?.terms.include ?? '';
  // Executed as a REAL regexp (Lucene `terms.include` is fully anchored -- ^...$ -- per
  // entity-resolution.ts's precedent), against real 5.0 check names: a case-insensitive
  // "contains ssh" match, nothing else.
  const anchored = new RegExp(`^${include}$`);
  assert.ok(anchored.test('Ensure sshd PermitRootLogin is disabled'));
  assert.ok(anchored.test('Ensure SSH root login is disabled'));
  assert.ok(anchored.test('ENSURE SSH ROOT LOGIN IS DISABLED'));
  assert.ok(!anchored.test('Ensure rsyslog is installed'));
});

test('get_sca_checks: result+search together attach ONE scoped matching_checks agg (2 aggs total)', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    result: 'failed',
    search: 'ssh',
  });
  const aggKeys = Object.keys(req.body.aggs as Record<string, unknown>);
  assert.deepEqual(aggKeys, ['results', 'matching_checks']);
  const aggs = req.body.aggs as {
    matching_checks: { terms: { include: string } };
  };
  assert.ok(
    new RegExp(`^${aggs.matching_checks.terms.include}$`).test(
      'Ensure SSH root login is disabled',
    ),
  );
});

test('get_sca_checks: matching_checks include is built from the TRIMMED search value', () => {
  const req = buildIndexer({
    agent_id: '000',
    policy_id: 'cis_ubuntu22-04',
    search: '  ssh  ',
  });
  const aggs = req.body.aggs as {
    matching_checks: { terms: { include: string } };
  };
  const anchored = new RegExp(`^${aggs.matching_checks.terms.include}$`);
  assert.ok(anchored.test('Ensure SSH root login is disabled'));
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
