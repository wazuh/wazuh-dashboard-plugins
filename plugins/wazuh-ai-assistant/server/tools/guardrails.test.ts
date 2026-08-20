import assert from 'node:assert/strict';
import {
  lintDsl,
  applySafetyValves,
  checkIndexAllowlist,
  clampManagerParams,
  clampInt,
  clampLookbackWindow,
  MAX_CARDINALITY_PRECISION_THRESHOLD,
} from './guardrails';
import { WAZUH_FIELD } from '../../common/wazuh-fields';

/** Minimal shape of a `bool` query after `normalizeMustToFilter` has folded `must` into `filter` --
 * `applySafetyValves` types its returned `body` as `Record<string, unknown>`, so this test-local
 * view is needed to inspect the normalized `query.bool` clause. */
interface NormalizedBoolQuery {
  bool: {
    must?: unknown;
    filter: unknown[];
  };
}

function timeBoundedFilter(
  range: Record<string, unknown> = { gte: 'now-1d', lte: 'now' },
) {
  return { bool: { filter: [{ range: { '@timestamp': range } }] } };
}

// --- script / script_fields / runtime_mappings / regexp -----------------------------------------

test('lintDsl: rejects script_score queries anywhere in the tree', () => {
  const body = {
    query: {
      script_score: {
        query: { match_all: {} },
        script: { source: "doc['rule.level'].value > 5" },
      },
    },
    size: 10,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /[Ss]cript/);
  }
});

test('lintDsl: rejects script_fields (nested real "script" key)', () => {
  const body = {
    query: { match_all: {} },
    script_fields: {
      level_doubled: {
        script: { lang: 'painless', source: "doc['rule.level'].value * 2" },
      },
    },
    size: 10,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /[Ss]cript/);
  }
});

test('lintDsl: rejects runtime_mappings (nested real "script" key)', () => {
  const body = {
    runtime_mappings: {
      day_of_week: {
        type: 'keyword',
        script: {
          source: "emit(doc['timestamp'].value.dayOfWeekEnum.toString())",
        },
      },
    },
    query: { match_all: {} },
    size: 10,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /[Ss]cript/);
  }
});

// The rejection message above already claimed to block
// "runtime_mappings" outright, but only the nested `script` key was actually checked -- a
// scriptless runtime field (pure type coercion) slipped through untouched. Distinct from the test
// above: this body has NO "script" key anywhere in the tree, so it exercises the new explicit
// `findKey(body, 'runtime_mappings')` branch specifically, not the pre-existing script check.
test('lintDsl: rejects runtime_mappings with no nested "script" key (scriptless type coercion)', () => {
  const body = {
    runtime_mappings: {
      day_of_week: { type: 'keyword' },
    },
    query: { match_all: {} },
    size: 10,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /runtime_mappings/);
  }
});

test('lintDsl: rejects regexp queries unconditionally', () => {
  const body = {
    query: { regexp: { 'rule.description': { value: '.*brute.*' } } },
    size: 10,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /regexp/);
  }
});

// --- leading wildcard -----------------------------------------------------------------------------

test('lintDsl: rejects a leading wildcard in a wildcard clause', () => {
  const body = {
    query: { wildcard: { 'agent.name': { value: '*prod*' } } },
    size: 10,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /leading wildcard/);
  }
});

test('lintDsl: rejects a leading wildcard in a query_string clause', () => {
  const body = { query: { query_string: { query: '*powershell*' } }, size: 10 };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /leading wildcard/);
  }
});

test('lintDsl: rejects a leading wildcard hidden behind a Lucene "+" operator', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { query_string: { query: '+*powershell*' } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /leading wildcard/);
  }
});

test('lintDsl: a trailing wildcard ("field:val*") is fine', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { query_string: { query: 'agent.name:prod*' } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

// --- vulnerability-field steering (findings/events index) -------------------------------------

// `prefix` was missing from VULN_FIELD_CLAUSE_KEYS, so a
// `prefix` query on a vulnerability field bypassed the steering check that every other
// field-path clause (match/match_phrase/term/terms/range/exists) already went through.
test('lintDsl: steers a "prefix" clause on a vulnerability field away from the findings/events index', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { prefix: { 'vulnerability.severity': 'Crit' } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /vulnerability tools/);
  }
});

// Cross-category tool audit (same bug shape as issue #8913): this reason reaches the model via
// search_wazuh_data/find_document_by_field (`free_search`, always offered), but the four tools it
// used to name unconditionally live in the separate `vulnerabilities` category, which is not
// guaranteed to be offered on the same turn. Pins the conditional wording and the explicit
// no-tools-available fallback so a future edit cannot silently reintroduce an unconditional
// "use the vulnerability tools" instruction naming a tool set that may not exist this turn.
test('lintDsl: the vulnerability-field steering reason is conditional on those tools being offered, not unconditional', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { term: { 'vulnerability.severity': 'Critical' } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-events-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.reason,
      /whichever of those is offered to you this\s+turn/,
    );
    assert.match(
      result.reason,
      /If none of them\s+are available to you this turn, tell the user this assistant cannot check\s+vulnerability data\s+from here/,
    );
  }
});

test('lintDsl: a "prefix" clause on a non-vulnerability field is unaffected by the steering check', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { prefix: { 'agent.name': 'prod' } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

// --- mandatory time range ---------------------------------------------------------------------

test('lintDsl: rejects a time range in bool.should (decorative, non-binding)', () => {
  const body = {
    query: {
      bool: {
        filter: [{ match_all: {} }],
        should: [{ range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } }],
      },
    },
    size: 500,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /must include a "range" clause/);
  }
});

test('lintDsl: rejects a time range in bool.must_not (negated, worse than decorative)', () => {
  const body = {
    query: {
      bool: {
        filter: [{ match_all: {} }],
        must_not: [{ range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } }],
      },
    },
    size: 500,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /must include a "range" clause/);
  }
});

test('lintDsl: passes a time range in bool.filter (required context)', () => {
  const body = {
    query: {
      bool: {
        filter: [
          { range: { 'rule.level': { gte: 15 } } },
          { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
        ],
      },
    },
    sort: [{ '@timestamp': { order: 'desc' } }],
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

test('lintDsl: rejects a time range with no time bound at all on a time-based index', () => {
  const body = { query: { match_all: {} }, size: 20 };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /must include a "range" clause/);
  }
});

test('lintDsl: rejects a range spanning more than 90 days', () => {
  const body = timeBoundedFilter({ gte: 'now-180d', lte: 'now' });
  const wrapped = { query: body, size: 20 };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /90-day maximum lookback/);
  }
});

test('lintDsl: rejects a range missing gte or lte', () => {
  const wrapped = { query: timeBoundedFilter({ gte: 'now-7d' }), size: 20 };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /must specify both/);
  }
});

test('lintDsl: wazuh-states-* is exempt from the mandatory time-range check', () => {
  const body = {
    query: { match: { 'vulnerability.severity': 'Critical' } },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-states-vulnerabilities-*');
  assert.equal(result.ok, true);
});

// --- clampLookbackWindow (issue #8935 item I4: bound disclosure) -------------------------------
// GOAL: MAX_LOOKBACK_MS stays 90 days, but a wider request produces a SUCCESSFUL, capped answer
// instead of a rejection the model must remember to relay. Not exported from guardrails.ts, so
// this file hardcodes the documented 90-day contract rather than importing the constant -- same
// convention the "rejects a range spanning more than 90 days" test above already uses.
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

function rangeBody(bounds: Record<string, unknown>): Record<string, unknown> {
  return {
    query: { bool: { filter: [{ range: { '@timestamp': bounds } }] } },
    size: 20,
  };
}

interface ClampedTimestampRange {
  gte?: string;
  gt?: string;
  lte?: string;
  lt?: string;
}

function readTimestampRange(
  body: Record<string, unknown>,
  clause: 'filter' | 'should' = 'filter',
): ClampedTimestampRange {
  const bool = (body.query as { bool: Record<string, unknown> }).bool;
  const clauses = bool[clause] as Array<Record<string, unknown>>;
  const range = clauses[0].range as Record<string, ClampedTimestampRange>;
  return range['@timestamp'];
}

test('clampLookbackWindow: a 180-day range is clamped to exactly 90 days, discloses both windows, and the clamped body passes the real lintDsl', () => {
  const body = rangeBody({ gte: 'now-180d', lte: 'now' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  const range = readTimestampRange(clamped);
  assert.equal(typeof range.gte, 'string');
  assert.equal(typeof range.lte, 'string');
  // Rewritten to concrete ISO timestamps, not left as date-math.
  assert.notEqual(range.gte, 'now-180d');
  assert.notEqual(range.lte, 'now');
  assert.equal(new Date(range.gte as string).toISOString(), range.gte);
  assert.equal(new Date(range.lte as string).toISOString(), range.lte);
  // Exactly MAX_LOOKBACK_MS apart, regardless of when this test happens to run (see the
  // off-by-epsilon trap documented on clampLookbackWindow).
  const spanMs =
    Date.parse(range.lte as string) - Date.parse(range.gte as string);
  assert.equal(spanMs, NINETY_DAYS_MS);
  assert.ok(disclosure);
  assert.match(disclosure as string, /Time window capped/);
  // Names both the ORIGINAL requested window and the CLAMPED window that actually ran.
  assert.match(disclosure as string, /now-180d to now/);
  assert.ok((disclosure as string).includes(range.gte as string));
  assert.ok((disclosure as string).includes(range.lte as string));
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, true, lint.ok ? '' : lint.reason);
  // The SAME (unclamped) 180-day body is rejected by the real lintDsl -- proves this is a genuine
  // fix, not a body that always would have passed.
  const unclampedLint = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(unclampedLint.ok, false);
});

// The five "left untouched" tests below are OVER-CLAMPING GUARDS, not fails-on-base witnesses:
// an identity stub satisfies them. The fails-on-base evidence for this item is the 180-day test
// above, executor.test.ts's end-to-end witness, and the lookback-disclosure-coverage sweep.
test('clampLookbackWindow: a 90-day range is returned untouched, with no disclosure', () => {
  const body = rangeBody({ gte: 'now-90d', lte: 'now' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.deepEqual(clamped, body);
  assert.equal(disclosure, undefined);
});

test('clampLookbackWindow: an 89-day range is returned untouched, with no disclosure', () => {
  const body = rangeBody({ gte: 'now-89d', lte: 'now' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.deepEqual(clamped, body);
  assert.equal(disclosure, undefined);
});

test('clampLookbackWindow: gt/lt (exclusive bounds) are clamped the same way, and the spelling is preserved', () => {
  const body = rangeBody({ gt: 'now-180d', lt: 'now' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  const range = readTimestampRange(clamped);
  assert.ok('gt' in range && !('gte' in range));
  assert.ok('lt' in range && !('lte' in range));
  const spanMs =
    Date.parse(range.lt as string) - Date.parse(range.gt as string);
  assert.equal(spanMs, NINETY_DAYS_MS);
  assert.ok(disclosure);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, true, lint.ok ? '' : lint.reason);
});

test('clampLookbackWindow: a bool.should (optional-context) 180-day range is NOT clamped -- the span rejection stays', () => {
  // The recorded scope decision (see clampLookbackWindow's SCOPE paragraph, which REVERSES this
  // fix's first cut): a should clause does not bound the result set, so a "results cover X to Y"
  // disclosure derived from it is false -- the first cut clamped it and told the model the answer
  // covered the last 90 days while the executed query covered the last 24 HOURS. Optional-context
  // clauses keep checkDateRanges' base rejection instead. The in-cap filter clause here is what
  // makes this a real witness: the body passes every OTHER lint check, so the surviving rejection
  // is specifically the should clause's span.
  const body = {
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } }],
        should: [{ range: { '@timestamp': { gte: 'now-180d', lte: 'now' } } }],
      },
    },
    size: 20,
  };
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.equal(disclosure, undefined, 'no result-set claim may be minted');
  assert.deepEqual(clamped, body);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, false);
  if (!lint.ok) {
    assert.match(lint.reason, /90-day maximum lookback/);
  }
});

test('clampLookbackWindow: a bool.must_not 275-day exclusion is NOT clamped (the claim would be inverted)', () => {
  // For a must_not clause the first cut's disclosure named precisely the window the results
  // EXCLUDE ("findings in the last 90 days but nothing in the prior year" -> "results cover
  // <the excluded window> only"), and silently narrowed the exclusion the caller asked for.
  const body = {
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gte: 'now-90d', lte: 'now' } } }],
        must_not: [
          { range: { '@timestamp': { gte: 'now-365d', lte: 'now-90d' } } },
        ],
      },
    },
    size: 20,
  };
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.equal(disclosure, undefined);
  assert.deepEqual(clamped, body);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, false);
  if (!lint.ok) {
    assert.match(lint.reason, /90-day maximum lookback/);
  }
});

test('clampLookbackWindow: an aggs-nested filter range is NOT clamped (outside body.query entirely)', () => {
  // The whole-result "results cover" claim cannot be derived from one sub-aggregation's private
  // filter; the base rejection stays the correction path there too.
  const body = {
    query: {
      bool: {
        filter: [{ range: { '@timestamp': { gte: 'now-24h', lte: 'now' } } }],
      },
    },
    aggs: {
      old: {
        filter: { range: { '@timestamp': { gte: 'now-180d', lte: 'now' } } },
      },
    },
    size: 0,
  };
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.equal(disclosure, undefined);
  assert.deepEqual(clamped, body);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, false);
  if (!lint.ok) {
    assert.match(lint.reason, /90-day maximum lookback/);
  }
});

test('clampLookbackWindow: with a SECOND required time range, the disclosure speaks of an intersection, not coverage', () => {
  // Two required ranges (180d + 7d): the 180d clause is clamped to 90d, but the effective window
  // is the 7-DAY intersection -- claiming "results cover <the 90-day window> only" here was an
  // integration-review hole (overstated coverage).
  const body = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-180d', lte: 'now' } } },
          { range: { '@timestamp': { gte: 'now-7d', lte: 'now' } } },
        ],
      },
    },
    size: 20,
  };
  const { disclosure } = clampLookbackWindow(body);
  assert.ok(disclosure);
  assert.match(disclosure as string, /intersection/);
  assert.doesNotMatch(
    disclosure as string,
    /results cover/,
    'whole-result coverage must not be claimed when other time filters also apply',
  );
});

test('clampLookbackWindow: the disclosure is bounded -- duplicates collapse and the sentence count is capped', () => {
  // Six identical over-wide clauses once produced a 1,499-char disclosure that MAX_HINT_LENGTH
  // truncated mid-timestamp and that evicted the zero-row recount hint (integration review).
  const wide = { range: { '@timestamp': { gte: 'now-180d', lte: 'now' } } };
  const body = {
    query: { bool: { filter: [wide, wide, wide, wide, wide, wide] } },
    size: 20,
  };
  const { disclosure } = clampLookbackWindow(body);
  assert.ok(disclosure);
  // All six clauses are identical -> ONE deduplicated sentence, no overflow tail.
  assert.equal(
    (disclosure as string).match(/Time window capped/g)?.length,
    1,
    `duplicates must collapse: ${disclosure}`,
  );
  assert.ok(
    (disclosure as string).length < 500,
    `disclosure must stay a bounded, sentence-sized hint contribution: ${
      (disclosure as string).length
    }`,
  );
});

test('clampLookbackWindow: a sibling `format` key is dropped when bounds are rewritten to ISO', () => {
  // Keeping format:'yyyy-MM-dd' beside full ISO date-times produced a lint-clean body the Indexer
  // then rejected with an opaque parse error -- worse than the clear span rejection it replaced.
  const body = rangeBody({
    gte: '2025-01-01',
    lte: '2025-12-31',
    format: 'yyyy-MM-dd',
  });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.ok(disclosure);
  const range = readTimestampRange(clamped) as Record<string, unknown>;
  assert.ok(!('format' in range), 'format must not survive the ISO rewrite');
  assert.equal(new Date(range.gte as string).toISOString(), range.gte);
});

test('clampLookbackWindow: a duplicate bound spelling (gte AND gt) is dropped, not left stale', () => {
  // A stale gt:'now-400d' beside the clamped gte would let the engine pick the wider bound while
  // the disclosure claims the capped window -- the pre-existing checkDateRanges bypass, closed
  // here at the one place that rewrites bounds.
  const body = rangeBody({ gte: 'now-180d', gt: 'now-400d', lte: 'now' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.ok(disclosure);
  const range = readTimestampRange(clamped);
  assert.ok('gte' in range && !('gt' in range));
  const spanMs =
    Date.parse(range.lte as string) - Date.parse(range.gte as string);
  assert.equal(spanMs, NINETY_DAYS_MS);
});

test('clampLookbackWindow: an unparseable bound is left untouched and still rejected by lintDsl', () => {
  const body = rangeBody({ gte: 'not-a-date', lte: 'now' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.deepEqual(clamped, body);
  assert.equal(disclosure, undefined);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, false);
  if (!lint.ok) {
    assert.match(lint.reason, /unparseable bound/);
  }
});

test('clampLookbackWindow: a single-sided range is left untouched (unfixable by clamping)', () => {
  const body = rangeBody({ gte: 'now-180d' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.deepEqual(clamped, body);
  assert.equal(disclosure, undefined);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, false);
});

test('clampLookbackWindow: an inverted window (upper before lower) is left untouched (unfixable by clamping)', () => {
  const body = rangeBody({ gte: 'now', lte: 'now-180d' });
  const { body: clamped, disclosure } = clampLookbackWindow(body);
  assert.deepEqual(clamped, body);
  assert.equal(disclosure, undefined);
  const lint = lintDsl(clamped, 'wazuh-findings-v5-*');
  assert.equal(lint.ok, false);
});

test('clampLookbackWindow: never mutates the input body', () => {
  const body = rangeBody({ gte: 'now-180d', lte: 'now' });
  const snapshot = JSON.parse(JSON.stringify(body));
  clampLookbackWindow(body);
  assert.deepEqual(body, snapshot);
});

// --- aggregations ----------------------------------------------------------------------------

test('lintDsl: rejects multi_terms on a disallowed field', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_src_dst: {
        multi_terms: {
          terms: [{ field: 'data.srcip' }, { field: WAZUH_FIELD.AGENT_ID }],
          size: 10000,
        },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.reason,
      /not on the allowed low-cardinality field list/,
    );
  }
});

test('lintDsl: rejects multi_terms.size over 100', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_agent: {
        multi_terms: { terms: [{ field: WAZUH_FIELD.AGENT_ID }], size: 200 },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /exceeds the maximum/);
  }
});

test('lintDsl: rejects composite.size over 100', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      c: {
        composite: {
          size: 10000,
          sources: [{ agent: { terms: { field: WAZUH_FIELD.AGENT_ID } } }],
        },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /exceeds the maximum/);
  }
});

test('lintDsl: passes composite with only "terms" sources on allowlisted fields', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      c: {
        composite: {
          size: 20,
          sources: [
            { agent: { terms: { field: WAZUH_FIELD.AGENT_ID } } },
            { ip: { terms: { field: 'source.ip' } } },
          ],
        },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

test('lintDsl: rejects a composite source whose type is not "terms" (e.g. histogram)', () => {
  // Closes a gap: only a `terms` composite source was ever field/allowlist-checked, so a
  // `histogram`/`date_histogram`/`geotile_grid` source's field was never checked against
  // AGG_FIELD_ALLOWLIST at all -- rejected outright now, rather than silently letting an
  // unchecked-cardinality field's bucket component through.
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      c: {
        composite: {
          size: 20,
          sources: [
            { agent: { terms: { field: WAZUH_FIELD.AGENT_ID } } },
            {
              bucket: {
                histogram: { field: 'vulnerability.score.base', interval: 1 },
              },
            },
          ],
        },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.reason,
      'Composite source type "histogram" is not allowed; only "terms" composite ' +
        'sources are supported.',
    );
  }
});

test('lintDsl: rejects a composite source of type date_histogram, naming it in the reason', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      c: {
        composite: {
          size: 20,
          sources: [
            {
              bucket: {
                date_histogram: {
                  field: '@timestamp',
                  calendar_interval: '1d',
                },
              },
            },
          ],
        },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.reason,
      /Composite source type "date_histogram" is not allowed/,
    );
  }
});

// top_hits had no size cap at all -- a nested
// `{aggs:{sample:{top_hits:{size:10000}}}}` passed every other check and asked the cluster to
// materialize up to (outer terms size) x 10000 documents.
test('lintDsl: rejects a nested top_hits.size over 100 (uncapped resource-exhaustion gap)', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_rule: {
        terms: { field: WAZUH_FIELD.RULE_ID, size: 100 },
        aggs: { sample: { top_hits: { size: 10000 } } },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /exceeds the maximum/);
  }
});

test('lintDsl: passes a top_hits.size within the cap', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_rule: {
        terms: { field: WAZUH_FIELD.RULE_ID, size: 10 },
        aggs: { sample: { top_hits: { size: 3 } } },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

test('lintDsl: rejects a date_histogram fixed_interval below the 1-minute floor', () => {
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-90d', lte: 'now' }),
    aggs: {
      explode: {
        date_histogram: { field: '@timestamp', fixed_interval: '1s' },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /too fine/);
  }
});

test('lintDsl: passes a date_histogram with a >=1m interval', () => {
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-1d', lte: 'now' }),
    aggs: {
      over_time: {
        date_histogram: { field: '@timestamp', fixed_interval: '5m' },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

test('lintDsl: passes a clean terms aggregation on an allowlisted field within size cap', () => {
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-30d', lte: 'now' }),
    aggs: { top_rules: { terms: { field: WAZUH_FIELD.RULE_ID, size: 20 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

test("lintDsl: passes a terms aggregation on wazuh.integration.category (get_security_summary's field)", () => {
  // Regression: get_security_summary aggregates on WAZUH_FIELD.INTEGRATION_CATEGORY
  // ("security"/"system-activity") because WAZUH_FIELD.RULE_CATEGORY (allowlisted above) is never
  // populated by the active integrations (rootcheck/FIM/vulnerability-detection) in a real
  // deployment — the tool's own aggregation field must be on this allowlist too, or every call
  // gets silently rejected and the user sees an empty "no matching results" table.
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-90d', lte: 'now' }),
    aggs: {
      finding_categories: {
        terms: { field: WAZUH_FIELD.INTEGRATION_CATEGORY, size: 20 },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5*');
  assert.equal(result.ok, true);
});

test('lintDsl: passes a terms aggregation on package.name (states inventory-packages pivot)', () => {
  // Regression: entity-pivot allowlist extension for get_top_agents-adjacent "top package"
  // questions -- package.name is wazuh-states-inventory-packages-only (not on findings-v5/
  // events-v5 at all), see get-agent-packages.ts's `_source` list. wazuh-states-* is exempt from
  // the mandatory time-range check, so no time filter is needed here.
  const wrapped = {
    query: { match_all: {} },
    aggs: { by_package: { terms: { field: 'package.name', size: 20 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-states-inventory-packages-*');
  assert.equal(result.ok, true);
});

test('lintDsl: passes a terms aggregation on host.os.name and host.os.platform (states OS pivot)', () => {
  // Regression: entity-pivot allowlist extension for "top OS/platform" questions -- both fields
  // are wazuh-states-inventory-system-only, see get-agent-os.ts's `_source` list.
  const byName = {
    query: { match_all: {} },
    aggs: { by_os: { terms: { field: 'host.os.name', size: 20 } } },
    size: 0,
  };
  const byPlatform = {
    query: { match_all: {} },
    aggs: { by_platform: { terms: { field: 'host.os.platform', size: 20 } } },
    size: 0,
  };
  assert.equal(lintDsl(byName, 'wazuh-states-inventory-system-*').ok, true);
  assert.equal(lintDsl(byPlatform, 'wazuh-states-inventory-system-*').ok, true);
});

test('lintDsl: passes a terms aggregation on wazuh.agent.id against wazuh-events-v5 (agent pivot, already allowlisted)', () => {
  // Regression: confirms the agent pivot is reachable on events-v5 too -- WAZUH_FIELD.AGENT_ID is
  // a flat, non-index-scoped allowlist entry (checkAggs has no `index` argument), and
  // wazuh.agent.id/wazuh.agent.name are the same field names on events-v5 as on findings-v5 (see
  // get-events-by-agent.ts), so no new allowlist entry was needed for this pivot specifically.
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-1d', lte: 'now' }),
    aggs: {
      by_agent: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 10 } },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-events-v5-*');
  assert.equal(result.ok, true);
});

test('lintDsl: still rejects a non-allowlisted events-v5 field (e.g. a hand-built high-cardinality pivot)', () => {
  // Negative counterpart to the allowlist extension above: a field genuinely absent from
  // AGG_FIELD_ALLOWLIST must still be rejected on events-v5, proving the extension did not widen
  // the check into a blanket "any field on this index family" pass.
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-1d', lte: 'now' }),
    aggs: {
      by_action: { terms: { field: 'event.action', size: 10 } },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-events-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.reason,
      /not on the allowed low-cardinality field list/,
    );
  }
});

test('lintDsl: passes a terms aggregation on event.category/event.outcome (CV-033 fix -- the ' +
  'events-v5 category taxonomy, get_field_values verify-before-filter probe)', () => {
  const byCategory = {
    query: timeBoundedFilter({ gte: 'now-1d', lte: 'now' }),
    aggs: { candidates: { terms: { field: 'event.category', size: 10 } } },
    size: 0,
  };
  const byOutcome = {
    query: timeBoundedFilter({ gte: 'now-1d', lte: 'now' }),
    aggs: { candidates: { terms: { field: 'event.outcome', size: 10 } } },
    size: 0,
  };
  assert.equal(lintDsl(byCategory, 'wazuh-events-v5-*').ok, true);
  assert.equal(lintDsl(byOutcome, 'wazuh-events-v5-*').ok, true);
});

test('lintDsl: passes a terms aggregation on source.ip within the size cap (top attacking-IP pivot)', () => {
  // Positive case for the source.ip allowlist entry (high-cardinality-but-bounded-bucket-safe --
  // see guardrails.ts's AGG_FIELD_ALLOWLIST comment): a terms agg on source.ip at or under
  // MAX_AGG_SIZE (100) passes exactly like any other allowlisted field.
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-7d', lte: 'now' }),
    aggs: { top_source_ips: { terms: { field: 'source.ip', size: 100 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

test('lintDsl: still rejects a source.ip terms agg size over the 100 cap', () => {
  // Negative case: source.ip's allowlisting does not exempt it from the same size cap every other
  // allowlisted field is subject to -- being allowlisted only permits the FIELD, never an
  // oversized bucket count.
  const wrapped = {
    query: timeBoundedFilter({ gte: 'now-7d', lte: 'now' }),
    aggs: { top_source_ips: { terms: { field: 'source.ip', size: 500 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /exceeds the maximum/);
  }
});

test('lintDsl: rejects a terms agg on a non-allowlisted (high-cardinality) field', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: { by_src_ip: { terms: { field: 'data.srcip', size: 10 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.reason,
      /not on the allowed low-cardinality field list/,
    );
  }
});

test('lintDsl: rejects a terms agg size over 100 even on an allowlisted field', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: { by_rule: { terms: { field: WAZUH_FIELD.RULE_ID, size: 500 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /exceeds the maximum/);
  }
});

// Sibling-aggregation count cap:
// checkAggs validated each aggregation's own field/size but never bounded how many top-level
// aggregations a single query_dsl could declare at once.
test('lintDsl: rejects more than 5 top-level sibling aggregations', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      a: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      b: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      c: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      d: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      e: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      f: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /top-level aggregations/);
  }
});

test('lintDsl: allows exactly 5 top-level sibling aggregations', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      a: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      b: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      c: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      d: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
      e: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

// A sub-aggregation nested one level down inside a bucket agg must NOT be double-counted against
// the TOP-LEVEL sibling cap -- this exercises 6 nested sub-aggs under a single top-level agg,
// which must still pass (only 1 top-level key).
test('lintDsl: nested sub-aggregations under a single top-level agg do not count against the sibling cap', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_rule: {
        terms: { field: WAZUH_FIELD.RULE_ID, size: 10 },
        aggs: {
          a: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 5 } },
          b: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 5 } },
          c: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 5 } },
          d: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 5 } },
          e: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 5 } },
          f: { terms: { field: WAZUH_FIELD.AGENT_ID, size: 5 } },
        },
      },
    },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
});

// --- index allowlist --------------------------------------------------------------------------

test('checkIndexAllowlist: accepts a valid wazuh-findings-v5-* index', () => {
  assert.equal(checkIndexAllowlist('wazuh-findings-v5-*').ok, true);
  assert.equal(checkIndexAllowlist('wazuh-events-v5-*').ok, true);
  assert.equal(checkIndexAllowlist('wazuh-states-vulnerabilities-*').ok, true);
});

test('checkIndexAllowlist: rejects wazuh-alerts-*/wazuh-archives-* (retired in the 5.0 port)', () => {
  assert.equal(checkIndexAllowlist('wazuh-alerts-*').ok, false);
  assert.equal(checkIndexAllowlist('wazuh-archives-*').ok, false);
});

test('checkIndexAllowlist: rejects a comma-smuggled second index', () => {
  const result = checkIndexAllowlist(
    'wazuh-findings-v5-*,wazuh-monitoring-3.x-2026.07.12',
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /not in the allowed set/);
  }
});

test('checkIndexAllowlist: rejects a non-wazuh index', () => {
  const result = checkIndexAllowlist('wazuh-monitoring-3.x-2026.07.12');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /not in the allowed set/);
  }
});

test('checkIndexAllowlist: accepts the 6 named wazuh-threatintel-* sub-families this catalog uses', () => {
  for (const family of [
    'rules',
    'decoders',
    'integrations',
    'policies',
    'filters',
    'kvdbs',
  ]) {
    assert.equal(
      checkIndexAllowlist(`wazuh-threatintel-${family}*`).ok,
      true,
      `expected wazuh-threatintel-${family}* to be allowed`,
    );
  }
});

// REVERSED by workstream A1a (AI/plan/coverage-validation-design.md, TC-8): the prior ADR-1
// decision predates the "every family with real data must be queryable by construction" mission
// and the coverage doc's explicit resequencing of this exact row to cover-now (372,301/257,071-doc
// corpora, two of only two production-shaped-volume gaps). The exact literal
// `wazuh-threatintel-enrichments-a` is now allowed (see guardrails.ts's INDEX_ALLOWLIST_RE
// comment) -- but the bare wildcarded prefix is still rejected below: only the one real index name
// is opened, not a whole new sub-family the way rules/decoders/etc. are.
test('checkIndexAllowlist: accepts the exact wazuh-threatintel-enrichments-a index (A1a, TC-8)', () => {
  assert.equal(checkIndexAllowlist('wazuh-threatintel-enrichments-a').ok, true);
});

test('checkIndexAllowlist: rejects a wildcarded wazuh-threatintel-enrichments-* (only the exact literal is opened)', () => {
  const result = checkIndexAllowlist('wazuh-threatintel-enrichments-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /not in the allowed set/);
  }
});

test('checkIndexAllowlist: rejects a bare wazuh-threatintel-* or an unrecognized sub-family', () => {
  assert.equal(checkIndexAllowlist('wazuh-threatintel-*').ok, false);
  assert.equal(checkIndexAllowlist('wazuh-threatintel-bogus-*').ok, false);
});

test('checkIndexAllowlist: accepts the exact .wazuh-threatintel-vulnerabilities-a index (A1a, TC-8)', () => {
  assert.equal(
    checkIndexAllowlist('.wazuh-threatintel-vulnerabilities-a').ok,
    true,
  );
});

test('checkIndexAllowlist: accepts wazuh-metrics-* (A1a, coverage doc open gap G1)', () => {
  assert.equal(checkIndexAllowlist('wazuh-metrics-comms').ok, true);
  assert.equal(checkIndexAllowlist('wazuh-metrics-agents').ok, true);
  assert.equal(checkIndexAllowlist('wazuh-metrics-normalization').ok, true);
  assert.equal(checkIndexAllowlist('wazuh-metrics-comms-v4').ok, true);
});

test('checkIndexAllowlist: accepts the CTI status indices (A1a, coverage doc MS-6/MS-7)', () => {
  assert.equal(checkIndexAllowlist('.wazuh-cti-consumers').ok, true);
  assert.equal(checkIndexAllowlist('.wazuh-content-manager-jobs').ok, true);
});

test('checkIndexAllowlist: rejects .opendistro-ism-config (system-index read protection verified live, coverage doc G8)', () => {
  const result = checkIndexAllowlist('.opendistro-ism-config');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /not in the allowed set/);
  }
});

test('checkIndexAllowlist: rejects wazuh-ai-assistant-sessions (privacy: other users\' chat history)', () => {
  assert.equal(checkIndexAllowlist('wazuh-ai-assistant-sessions').ok, false);
});

test('checkIndexAllowlist: rejects a comma-smuggled second threatintel index', () => {
  const result = checkIndexAllowlist(
    'wazuh-threatintel-rules-a,wazuh-threatintel-enrichments-a',
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /not in the allowed set/);
  }
});

test('checkIndexAllowlist: accepts .opensearch-sap-detectors-config (get_detectors, exact match only)', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-detectors-config').ok,
    true,
  );
});

test('checkIndexAllowlist: rejects a wildcard on the detectors-config index and any .opensearch-sap-*-alerts index', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-detectors-config*').ok,
    false,
  );
  // -alerts stays closed (A1a, coverage doc G2): every detector's `triggers: []` provisioning
  // defect means this can only ever return zero live data -- see guardrails.ts's exclusion note.
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-suricata-alerts').ok,
    false,
  );
});

// REVERSED by workstream A1a (coverage doc G2: "findings now flowing after the
// alert_finding_enabled=true fix" -- live-verified non-empty on wazuh-aio-5). Any prior assertion
// that this family was rejected predates that fix.
test('checkIndexAllowlist: accepts .opensearch-sap-*-findings (A1a, coverage doc G2)', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-suricata-findings').ok,
    true,
  );
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-wazuh-generic-findings').ok,
    true,
  );
});

// The internal compiled-query artifact indices end in a UUID, never in "-findings" -- must stay
// closed even though they share the ".opensearch-sap-" prefix (coverage doc's own out-of-scope
// appendix: "not a user-facing question surface").
test('checkIndexAllowlist: rejects the .opensearch-sap-*-detectors-queries-optimized-* internal artifact', () => {
  assert.equal(
    checkIndexAllowlist(
      '.opensearch-sap-wazuh-generic-detectors-queries-optimized-24d7f640-b381-444e-834b-fce1ba8f47e1',
    ).ok,
    false,
  );
});

test('checkIndexAllowlist: accepts .opensearch-sap-pre-packaged-rules-config (A1a, coverage doc G3)', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-pre-packaged-rules-config').ok,
    true,
  );
});

test('checkIndexAllowlist: accepts .opensearch-sap-correlation-metadata (A1a, coverage doc MS-12)', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-correlation-metadata').ok,
    true,
  );
});

test('checkIndexAllowlist: rejects .opensearch-sap-correlation-alerts/-history (empty, no provisioning fix yet)', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-correlation-alerts').ok,
    false,
  );
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-correlation-history').ok,
    false,
  );
});

// P-10 (AI/plan/a1a-review.md): the wildcard suffix used to be `[^,\s]*`, which let `/` and `.`
// through -- so a path-traversal-shaped value could match the regex even though it is not
// reachable via search_wazuh_data's own JSON-schema `enum` today. Tightened to the explicit
// index-name charset; this pins that the standalone boundary now rejects it directly too.
test('checkIndexAllowlist: rejects a path-traversal-shaped value even though the leading segment is allowlisted', () => {
  assert.equal(
    checkIndexAllowlist('wazuh-findings-v5-*/../.opendistro_security').ok,
    false,
  );
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-suricata/../-findings').ok,
    false,
  );
});

// --- applySafetyValves ------------------------------------------------------------------------

test('applySafetyValves: clamps size to <= 500', () => {
  const result = applySafetyValves({ query: timeBoundedFilter(), size: 5000 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.size, 500);
  }
});

test('applySafetyValves: forces track_total_hits to true (exact count) regardless of input', () => {
  const result = applySafetyValves({
    query: timeBoundedFilter(),
    track_total_hits: 100,
    size: 20,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.track_total_hits, true);
  }
});

test('applySafetyValves: forces track_total_hits to true even when the query_dsl disables it', () => {
  // A search_wazuh_data query_dsl setting track_total_hits: false must not be honored -- the
  // enforced exact-count value always wins, same precedence as every other valve in this
  // function (size/timeout/etc).
  const result = applySafetyValves({
    query: timeBoundedFilter(),
    track_total_hits: false,
    size: 20,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.track_total_hits, true);
  }
});

test('applySafetyValves: rejects from > 1000', () => {
  const result = applySafetyValves({
    query: timeBoundedFilter(),
    from: 5000,
    size: 20,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /exceeds the maximum/);
  }
});

test('applySafetyValves: normalizes bool.must into bool.filter', () => {
  const result = applySafetyValves({
    query: {
      bool: {
        must: [{ term: { level: 3 } }],
        filter: [{ range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } }],
      },
    },
    size: 10,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    const boolClause = (result.body.query as NormalizedBoolQuery).bool;
    assert.equal(boolClause.must, undefined);
    assert.deepEqual(boolClause.filter[1], { term: { level: 3 } });
  }
});

test('applySafetyValves: rejects a deeply-nested body ("too deeply nested"), does not throw', () => {
  // Build ~200 levels of {bool:{filter:[...]}} to exceed MAX_TREE_DEPTH (100) without recursing
  // the guardrail's own tree-walkers past that depth.
  let node: Record<string, unknown> = { match_all: {} };
  for (let i = 0; i < 200; i++) {
    node = { bool: { filter: [node] } };
  }
  let result: ReturnType<typeof applySafetyValves> | undefined;
  assert.doesNotThrow(() => {
    result = applySafetyValves({ query: node, size: 10 });
  });
  const valved = result!;
  assert.equal(valved.ok, false);
  if (!valved.ok) {
    assert.match(valved.reason, /too deeply nested/);
  }
});

test('lintDsl: also rejects the same deeply-nested body without throwing', () => {
  let node: Record<string, unknown> = { match_all: {} };
  for (let i = 0; i < 200; i++) {
    node = { bool: { filter: [node] } };
  }
  let result: ReturnType<typeof lintDsl> | undefined;
  assert.doesNotThrow(() => {
    result = lintDsl({ query: node, size: 10 }, 'wazuh-findings-v5-*');
  });
  const linted = result!;
  assert.equal(linted.ok, false);
  if (!linted.ok) {
    assert.match(linted.reason, /too deeply nested/);
  }
});

// --- clampManagerParams -----------------------------------------------------------------------

test('clampManagerParams: clamps limit into [1, 500]', () => {
  assert.equal(clampManagerParams({ limit: 5000 }).limit, 500);
  assert.equal(clampManagerParams({ limit: 0 }).limit, 1);
  assert.equal(clampManagerParams({ limit: -10 }).limit, 1);
  assert.equal(clampManagerParams({ limit: 50 }).limit, 50);
});

test('clampManagerParams: leaves non-numeric/absent limit untouched', () => {
  assert.equal(clampManagerParams({}).limit, undefined);
  const params = { limit: 'not-a-number' as unknown as number, other: 'x' };
  const clamped = clampManagerParams(params);
  assert.equal(clamped.limit, 'not-a-number');
  assert.equal(clamped.other, 'x');
});

// --- Exclusive range bounds (gt/lt) are equivalent to gte/lte -----------------------------------
// Both bounds stay mandatory; only the inclusive-vs-exclusive spelling is relaxed. Demanding the
// inclusive spelling specifically is a user-visible failure: an ordinary "last 24 hours" written
// as {gte: <24h ago>, lt: now} is rejected, retried identically on every tool round, and reaches
// the user as "a technical issue" with no data.
const timeBody = (bounds: Record<string, unknown>) => ({
  query: {
    bool: {
      filter: [
        { range: { '@timestamp': bounds } },
        { match: { 'event.action': 'session_closed' } },
      ],
    },
  },
  _source: ['source.user.name'],
  size: 500,
});

test('lintDsl accepts an exclusive upper bound (gte + lt)', () => {
  const r = lintDsl(
    timeBody({ gte: 'now-24h', lt: 'now' }),
    'wazuh-events-v5-*',
  );
  assert.equal(r.ok, true, r.ok ? '' : r.reason);
});

test('lintDsl accepts an exclusive lower bound (gt + lte)', () => {
  const r = lintDsl(
    timeBody({ gt: 'now-24h', lte: 'now' }),
    'wazuh-events-v5-*',
  );
  assert.equal(r.ok, true, r.ok ? '' : r.reason);
});

test('lintDsl accepts both bounds exclusive (gt + lt)', () => {
  const r = lintDsl(
    timeBody({ gt: 'now-24h', lt: 'now' }),
    'wazuh-events-v5-*',
  );
  assert.equal(r.ok, true, r.ok ? '' : r.reason);
});

test('lintDsl still requires an upper bound (gte only is rejected)', () => {
  const r = lintDsl(timeBody({ gte: 'now-24h' }), 'wazuh-events-v5-*');
  assert.equal(r.ok, false);
});

test('lintDsl still requires a lower bound (lt only is rejected)', () => {
  const r = lintDsl(timeBody({ lt: 'now' }), 'wazuh-events-v5-*');
  assert.equal(r.ok, false);
});

test('lintDsl still enforces the 90-day span using exclusive bounds', () => {
  const r = lintDsl(
    timeBody({ gt: 'now-200d', lt: 'now' }),
    'wazuh-events-v5-*',
  );
  assert.equal(r.ok, false);
  assert.match(String(r.ok ? '' : r.reason), /90/);
});

test('lintDsl still rejects an inverted window written with exclusive bounds', () => {
  const r = lintDsl(
    timeBody({ gt: 'now', lt: 'now-24h' }),
    'wazuh-events-v5-*',
  );
  assert.equal(r.ok, false);
});

// --- numeric range on a keyword field (wazuh.rule.level) ---------------------------------------
// Wazuh 5.0 re-types `rule.level` from a numeric 0-15 integer to a keyword severity word
// (informational/low/medium/high/critical). A numeric `range` against a keyword field does not
// error in OpenSearch -- it silently falls back to lexicographic string comparison, producing a
// plausible-looking but WRONG answer. This must be actively rejected (proposal open question O1,
// locked in as "MUST reject"), not left to silently misbehave.

test('lintDsl: rejects a numeric range on the keyword field wazuh.rule.level (gte)', () => {
  const wrapped = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { range: { [WAZUH_FIELD.RULE_LEVEL]: { gte: 12 } } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /keyword/);
    assert.match(result.reason, /wazuh\.rule\.level/);
  }
});

test('lintDsl: rejects a numeric range on wazuh.rule.level even with only an upper bound (lt)', () => {
  const wrapped = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { range: { [WAZUH_FIELD.RULE_LEVEL]: { lt: 7 } } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /keyword/);
  }
});

test('lintDsl: a "term" query against wazuh.rule.level with a string severity value is unaffected', () => {
  const wrapped = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { term: { [WAZUH_FIELD.RULE_LEVEL]: 'critical' } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lintDsl: a "terms" query against wazuh.rule.level with string severity values is unaffected', () => {
  const wrapped = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { terms: { [WAZUH_FIELD.RULE_LEVEL]: ['high', 'critical'] } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lintDsl: a range on a different field (not wazuh.rule.level) is unaffected by this check', () => {
  const wrapped = {
    query: {
      bool: {
        filter: [
          { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
          { range: { 'wazuh.rule.mitre.technique.id': { gte: 'T1000' } } },
        ],
      },
    },
    size: 20,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

// --- exact-ID lookup exemption (find_document_by_field) -----------------------------------------

test('lintDsl: an "ids" query on a time-based index skips the mandatory time-range check', () => {
  const body = {
    query: { ids: { values: ['oPoOs58B4OP1Z0luRhFX'] } },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lintDsl: a "term" query on an allowlisted ID field skips the mandatory time-range check', () => {
  const body = {
    query: { term: { 'wazuh.event.id': 'abc-123' } },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-events-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lintDsl: a "terms" query on multiple allowlisted ID fields (wrapped in bool.filter) is exempt', () => {
  const body = {
    query: {
      bool: {
        filter: [{ terms: { [WAZUH_FIELD.RULE_ID]: ['id-1', 'id-2'] } }],
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lintDsl: a "term" query on a NON-allowlisted field still requires a time range', () => {
  const body = { query: { term: { 'data.srcip': '10.0.0.1' } }, size: 20 };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /must include a "range" clause/);
  }
});

test('lintDsl: a bool.should ORing "ids" with multiple allowlisted-field "term" clauses is exempt (find_document_by_field\'s shape)', () => {
  const body = {
    query: {
      bool: {
        should: [
          { ids: { values: ['oPoOs58B4OP1Z0luRhFX'] } },
          { term: { [WAZUH_FIELD.RULE_ID]: 'oPoOs58B4OP1Z0luRhFX' } },
          { term: { 'wazuh.event.id': 'oPoOs58B4OP1Z0luRhFX' } },
        ],
        minimum_should_match: 1,
      },
    },
    size: 20,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true, result.ok ? '' : result.reason);
});

test('lintDsl: the exact-ID lookup exemption does not apply once an "aggs" is present', () => {
  const body = {
    query: { term: { [WAZUH_FIELD.RULE_ID]: 'rule-uuid-1' } },
    aggs: { by_id: { terms: { field: WAZUH_FIELD.RULE_ID, size: 10 } } },
    size: 0,
  };
  const result = lintDsl(body, 'wazuh-findings-v5-*');
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.reason, /must include a "range" clause/);
  }
});

// --- clampInt ---------------------------------------------------------------------------------
// Shared floor/cap clamp primitive used by clampManagerParams, applySafetyValves' size clamp, and
// server/tools/catalog/common.ts's clampLimit. Deliberately does NOT truncate and does NOT guard
// NaN itself -- see its doc comment in guardrails.ts for why each call site keeps that
// responsibility.

test('clampInt: passes a value already inside [floor, cap] through unchanged', () => {
  assert.equal(clampInt(50, 1, 500), 50);
  assert.equal(clampInt(0, 0, 500), 0);
});

test('clampInt: clamps a value below floor up to floor', () => {
  assert.equal(clampInt(-10, 1, 500), 1);
  assert.equal(clampInt(-1, 0, 500), 0);
});

test('clampInt: clamps a value above cap down to cap', () => {
  assert.equal(clampInt(5000, 1, 500), 500);
  assert.equal(clampInt(501, 0, 500), 500);
});

test('clampInt: does NOT truncate a fractional value -- callers truncate themselves first if they want that', () => {
  assert.equal(clampInt(20.7, 0, 500), 20.7);
  assert.equal(clampInt(0.4, 1, 500), 1); // still floored to 1, just not rounded/truncated first
});

test('clampInt: NaN propagates through unchanged -- no guard in the primitive itself', () => {
  assert.ok(Number.isNaN(clampInt(NaN, 1, 500)));
});

test("clampInt: a non-numeric value coerces via Math.max/Math.min's own ToNumber, same as plain JS arithmetic would", () => {
  // clampInt is typed to take a `number`, but nothing stops a caller from bypassing that at a JS
  // boundary (e.g. an untyped object property), so the coercion behavior is pinned here.
  const nonNumeric = 'not-a-number' as unknown as number;
  assert.ok(Number.isNaN(clampInt(nonNumeric, 1, 500)));
});

test('applySafetyValves: raises every cardinality precision_threshold, including sub-aggs', () => {
  const valved = applySafetyValves({
    size: 0,
    aggs: {
      distinct_hosts: { cardinality: { field: 'wazuh.agent.name' } },
      by_rule: {
        terms: { field: 'wazuh.rule.id', size: 10 },
        aggs: {
          distinct_titles: { cardinality: { field: 'wazuh.rule.title' } },
        },
      },
    },
  });
  assert.ok(valved.ok);
  const aggs = valved.body.aggs as Record<string, Record<string, never>>;
  assert.equal(
    (aggs.distinct_hosts.cardinality as Record<string, unknown>)
      .precision_threshold,
    MAX_CARDINALITY_PRECISION_THRESHOLD,
  );
  assert.equal(
    (
      (aggs.by_rule.aggs as Record<string, Record<string, unknown>>)
        .distinct_titles.cardinality as Record<string, unknown>
    ).precision_threshold,
    MAX_CARDINALITY_PRECISION_THRESHOLD,
  );
});
