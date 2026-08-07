import assert from 'node:assert/strict';
import {
  lintDsl,
  applySafetyValves,
  checkIndexAllowlist,
  clampManagerParams,
  clampInt,
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
            { bucket: { histogram: { field: 'vulnerability.score.base', interval: 1 } } },
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
                date_histogram: { field: '@timestamp', calendar_interval: '1d' },
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
    assert.match(result.reason, /Composite source type "date_histogram" is not allowed/);
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
  assert.equal(
    lintDsl(byName, 'wazuh-states-inventory-system-*').ok,
    true,
  );
  assert.equal(
    lintDsl(byPlatform, 'wazuh-states-inventory-system-*').ok,
    true,
  );
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

// Deliberate (ADR-1, sdd/add-SA-tools/design): no tool in this catalog touches the IOC feed, and
// the allowlist enumerates only the 6 sub-families that are — it must NOT accept the bare
// wazuh-threatintel-* prefix, which would silently authorize enrichments too.
test('checkIndexAllowlist: rejects wazuh-threatintel-enrichments-* (deliberately out of scope)', () => {
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

test('checkIndexAllowlist: rejects any other .opensearch-sap-* index or a wildcard on the detectors index', () => {
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-detectors-config*').ok,
    false,
  );
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-suricata-alerts').ok,
    false,
  );
  assert.equal(
    checkIndexAllowlist('.opensearch-sap-suricata-findings').ok,
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
