import assert from 'node:assert/strict';
import {
  lintDsl,
  applySafetyValves,
  checkIndexAllowlist,
  clampManagerParams,
  clampInt,
} from './guardrails';

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

// --- aggregations ----------------------------------------------------------------------------

test('lintDsl: rejects multi_terms on a disallowed field', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_src_dst: {
        multi_terms: {
          terms: [{ field: 'data.srcip' }, { field: 'agent.id' }],
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
      by_agent: { multi_terms: { terms: [{ field: 'agent.id' }], size: 200 } },
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
          sources: [{ agent: { terms: { field: 'agent.id' } } }],
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

// top_hits had no size cap at all -- a nested
// `{aggs:{sample:{top_hits:{size:10000}}}}` passed every other check and asked the cluster to
// materialize up to (outer terms size) x 10000 documents.
test('lintDsl: rejects a nested top_hits.size over 100 (uncapped resource-exhaustion gap)', () => {
  const wrapped = {
    query: timeBoundedFilter(),
    aggs: {
      by_rule: {
        terms: { field: 'rule.id', size: 100 },
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
        terms: { field: 'rule.id', size: 10 },
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
    aggs: { top_rules: { terms: { field: 'rule.id', size: 20 } } },
    size: 0,
  };
  const result = lintDsl(wrapped, 'wazuh-findings-v5-*');
  assert.equal(result.ok, true);
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
    aggs: { by_rule: { terms: { field: 'rule.id', size: 500 } } },
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
      a: { terms: { field: 'rule.id', size: 10 } },
      b: { terms: { field: 'rule.id', size: 10 } },
      c: { terms: { field: 'rule.id', size: 10 } },
      d: { terms: { field: 'rule.id', size: 10 } },
      e: { terms: { field: 'rule.id', size: 10 } },
      f: { terms: { field: 'rule.id', size: 10 } },
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
      a: { terms: { field: 'rule.id', size: 10 } },
      b: { terms: { field: 'rule.id', size: 10 } },
      c: { terms: { field: 'rule.id', size: 10 } },
      d: { terms: { field: 'rule.id', size: 10 } },
      e: { terms: { field: 'rule.id', size: 10 } },
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
        terms: { field: 'rule.id', size: 10 },
        aggs: {
          a: { terms: { field: 'agent.id', size: 5 } },
          b: { terms: { field: 'agent.id', size: 5 } },
          c: { terms: { field: 'agent.id', size: 5 } },
          d: { terms: { field: 'agent.id', size: 5 } },
          e: { terms: { field: 'agent.id', size: 5 } },
          f: { terms: { field: 'agent.id', size: 5 } },
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

// --- applySafetyValves ------------------------------------------------------------------------

test('applySafetyValves: clamps size to <= 500', () => {
  const result = applySafetyValves({ query: timeBoundedFilter(), size: 5000 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.size, 500);
  }
});

test('applySafetyValves: forces track_total_hits regardless of input', () => {
  const result = applySafetyValves({
    query: timeBoundedFilter(),
    track_total_hits: true,
    size: 20,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.body.track_total_hits, 10000);
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
