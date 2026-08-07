/**
 * Indexer footprint guardrails. The cluster itself is assumed
 * permissive (OpenSearch 2.x defaults: no default search timeout, `allow_leading_wildcard=true`,
 * `search.allow_expensive_queries=true`) — the plugin enforces everything itself, on every
 * outbound `_search`, regardless of whether the query came from a typed catalog tool (defense in
 * depth) or the future free-DSL escape hatch (its only line of defense).
 */

import {
  WAZUH_FIELD,
  SEVERITY_LEVELS,
  COMPLIANCE_FRAMEWORK_FIELDS,
} from '../../common/wazuh-fields';

export type GuardrailCheck = { ok: true } | { ok: false; reason: string };

/**
 * Shared integer-range clamp primitive for the three call sites that need one: this file's
 * `applySafetyValves` (size clamp) and `clampManagerParams` (`limit` clamp), plus
 * `server/tools/catalog/common.ts`'s `clampLimit`. Deliberately just the floor/cap clamp itself —
 * NO `Number.isFinite`/NaN guard and NO truncation — because those two concerns differ across the
 * three call sites and folding them in here would change each site's observable behavior:
 *
 * - `clampLimit` (common.ts) checks `Number.isFinite` and truncates BEFORE calling this, falling
 *   back to its own `defaultValue` for a non-finite input, so this primitive never sees a
 *   NaN/Infinity from that call site.
 * - `clampManagerParams` (below) truncates but has no finite guard: a NaN `limit` propagates
 *   through unchanged (`Math.trunc(NaN)` is `NaN`, and `Math.max`/`Math.min` against `NaN` are
 *   both `NaN`). See that function's own doc comment for reachability.
 * - `applySafetyValves`' `size` clamp does not truncate at all (a fractional `size` passes
 *   straight through) and floors at `0`, not `1`.
 *
 * Callers stay responsible for any NaN guard and for truncation; this only does the clamp.
 *
 * Exported so `common.ts`'s `clampLimit` can share it, keeping this file dependency-light.
 */
export function clampInt(value: number, floor: number, cap: number): number {
  return Math.min(Math.max(value, floor), cap);
}

/**
 * Reads a numeric request field the way the Indexer itself does. OpenSearch coerces a numeric
 * JSON string, so `{"size": "10000"}` and `{"size": 10000}` request exactly the same work — a cap
 * that tested `typeof value === 'number'` would enforce the limit on one spelling and ignore the
 * other. Values that are not finite numbers (a non-numeric string, an object, NaN) return
 * `undefined`: they are not a bound this file can enforce, and the cluster rejects them itself.
 */
function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

const MAX_SIZE = 500;
const MAX_FROM = 1000;
const MAX_TRACK_TOTAL_HITS = 10000;
const SEARCH_TIMEOUT = '10s';
// A pathological ~20KB deeply-nested `bool` body overflows the stack in the recursive tree walkers
// below (normalizeMustToFilter, walk) and throws an uncaught RangeError, which would break
// executeToolCall's "never throws" contract. Both applySafetyValves and lintDsl bail out with a
// clean rejection before attempting any recursion past this depth.
const MAX_TREE_DEPTH = 100;

// The `[^,\s]*` tail (rather than `.*`) rejects a comma-smuggled index string
// ("wazuh-findings-v5-*,wazuh-monitoring-*"): the Indexer treats a comma as a multi-index
// separator, so `.*` would let a single match name two index patterns. Not reachable through the
// catalog today (`index` is enum-locked at the tool-schema level), but this function is the
// standalone boundary and must hold on its own.
//
// `threatintel-(rules|decoders|integrations|policies|filters|kvdbs)` is enumerated explicitly,
// NOT a bare `threatintel-[^,\s]*`: this plugin has NO tool touching `wazuh-threatintel-enrichments`
// (228k IOC docs — deliberately out of scope, see get-rules.ts/get-threat-intel-
// components.ts's doc comments for why). This allowlist is documented as the standalone boundary
// that must hold on its own, independent of what today's tool schemas happen to permit — opening
// the whole prefix would silently authorize `enrichments` at this layer the day someone adds it to
// an enum elsewhere, without anyone consciously deciding to widen it.
// `.opensearch-sap-detectors-config` (get_detectors.ts) is an exact single index, not a wildcard
// family -- OpenSearch Security Analytics' own config store for detector definitions, confirmed
// live to be indexer-reachable and to hold no analyst/attacker-supplied data (name/type/schedule/
// enabled/source, all vendor- or admin-configured).
const INDEX_ALLOWLIST_RE =
  /^wazuh-(events-v5|findings-v5|states|threatintel-(rules|decoders|integrations|policies|filters|kvdbs))[^,\s]*$|^\.opensearch-sap-detectors-config$/;

/** The escape hatch's (and every catalog tool's) index-pattern allowlist. */
export function checkIndexAllowlist(index: string): GuardrailCheck {
  if (!INDEX_ALLOWLIST_RE.test(index)) {
    return {
      ok: false,
      reason:
        `Index "${index}" is not in the allowed set (wazuh-events-v5-*, wazuh-findings-v5-*, ` +
        'wazuh-states-*, wazuh-threatintel-{rules,decoders,integrations,policies,filters,kvdbs}-*, ' +
        '.opensearch-sap-detectors-config).',
    };
  }
  return { ok: true };
}

/**
 * Forces/clamps the safety valves that always override whatever the model (or a catalog tool)
 * proposed. Returns a new body — never mutates the input — plus a rejection when `from` asks
 * for pagination deeper than the plugin allows (deep pagination must go through search_after/PIT,
 * plugin-driven only, never LLM-driven — not implemented in this slice, so it's simply refused).
 */
export function applySafetyValves(
  body: Record<string, unknown>,
): { ok: true; body: Record<string, unknown> } | { ok: false; reason: string } {
  // Nesting depth is checked BEFORE any recursive walk touches this body (see MAX_TREE_DEPTH).
  if (exceedsMaxDepth(body, MAX_TREE_DEPTH)) {
    return { ok: false, reason: 'Query is too deeply nested.' };
  }

  const next = normalizeMustToFilter(body) as Record<string, unknown>;

  const from = asNumber(next.from);
  if (from !== undefined && from > MAX_FROM) {
    return {
      ok: false,
      reason:
        `Pagination offset "from" (${from}) exceeds the maximum of ${MAX_FROM}; narrow the ` +
        `time range or filters instead of paging deeper.`,
    };
  }

  next.timeout = SEARCH_TIMEOUT;
  const requestedSize = asNumber(next.size);
  // No truncation here (unlike clampManagerParams below) and a floor of 0, not 1 -- see
  // clampInt's doc comment for why that difference is preserved rather than unified away.
  next.size =
    requestedSize === undefined ? 20 : clampInt(requestedSize, 0, MAX_SIZE);
  next.track_total_hits = MAX_TRACK_TOTAL_HITS;
  // allow_partial_search_results is deliberately NOT set here: it is a transport/URL parameter,
  // not a body field (a body key would 400 the whole search), and the cluster default is already
  // `true`, which is the behavior we want.

  return { ok: true, body: next };
}

/**
 * Cheap upfront guard against pathological nesting depth. Checks `depth > limit` BEFORE
 * recursing further, so — unlike the tree walkers below — this itself never recurses past
 * `limit + 1` levels regardless of how deep the actual (malicious) input goes; it short-circuits
 * and returns `true` the moment the limit is crossed instead of walking all the way down first.
 */
function exceedsMaxDepth(node: unknown, limit: number, depth = 0): boolean {
  if (depth > limit) {
    return true;
  }
  if (Array.isArray(node)) {
    return node.some(item => exceedsMaxDepth(item, limit, depth + 1));
  }
  if (node && typeof node === 'object') {
    return Object.values(node as Record<string, unknown>).some(value =>
      exceedsMaxDepth(value, limit, depth + 1),
    );
  }
  return false;
}

/**
 * Rewrites every `bool.must` into `bool.filter` (recursively, returning a new tree — the input is
 * never mutated). Matching semantics are identical for the lookup-style queries this plugin runs;
 * only relevance scoring differs, and filter context additionally hits the shard filter cache.
 * This makes the escape hatch's "filter context only" contract true by normalization instead of
 * by a rejection round-trip when the model sends `must`. `should`/`must_not` are left untouched
 * (rewriting them would change matching semantics).
 */
function normalizeMustToFilter(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(normalizeMustToFilter);
  }
  if (!node || typeof node !== 'object') {
    return node;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (
      key === 'bool' &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const boolClause = { ...(value as Record<string, unknown>) };
      if (boolClause.must !== undefined) {
        const asArray = (clause: unknown): unknown[] =>
          clause === undefined ? [] : Array.isArray(clause) ? clause : [clause];
        boolClause.filter = [
          ...asArray(boolClause.filter),
          ...asArray(boolClause.must),
        ];
        delete boolClause.must;
      }
      out[key] = normalizeMustToFilter(boolClause);
      continue;
    }
    out[key] = normalizeMustToFilter(value);
  }
  return out;
}

/**
 * Low-cardinality fields vetted safe for terms/composite/cardinality/significant_terms aggs.
 * Only schema-valid `wazuh.*` fields are listed (see `common/wazuh-fields.ts`); population is
 * decoder-dependent.
 */
const AGG_FIELD_ALLOWLIST = new Set([
  WAZUH_FIELD.RULE_ID,
  WAZUH_FIELD.RULE_LEVEL,
  WAZUH_FIELD.RULE_TITLE,
  WAZUH_FIELD.AGENT_ID,
  WAZUH_FIELD.AGENT_NAME,
  'vulnerability.severity',
  // Wazuh 5.0 findings-v5 agg fields, all keyword/low-cardinality (finite rule taxonomy /
  // compliance requirement list / MITRE technique catalog).
  WAZUH_FIELD.RULE_CATEGORY,
  // `wazuh.rule.category` (above) is never populated by the active integrations in this
  // environment (rootcheck/FIM/vulnerability-detection) — `wazuh.integration.category`
  // ("security"/"system-activity") is the field that actually carries a value; get_security_summary
  // aggregates on it. Same finite, low-cardinality taxonomy as RULE_CATEGORY.
  WAZUH_FIELD.INTEGRATION_CATEGORY,
  WAZUH_FIELD.RULE_TAGS,
  ...Object.values(COMPLIANCE_FRAMEWORK_FIELDS),
  WAZUH_FIELD.RULE_MITRE_TECHNIQUE_ID,
  WAZUH_FIELD.RULE_MITRE_TECHNIQUE_NAME,
  WAZUH_FIELD.RULE_MITRE_TACTIC_NAME,
  // Wazuh 5.0: SCA policy summary is DERIVED via a terms agg on `policy.id` (keyword,
  // low-cardinality — a handful of benchmark policies per agent; mapping live-verified against
  // wazuh-states-sca on 5.0.0-beta3).
  'policy.id',
  // Entity-pivot fields for "noisiest/top X" questions (GA benchmark gap: this allowlist only
  // ever listed wazuh-findings-v5 field names, so a terms/composite/multi_terms agg on the
  // wazuh-events-v5 and wazuh-states-* families' own entity fields was rejected even though
  // WAZUH_FIELD.AGENT_ID/AGENT_NAME above already cover the *agent* pivot on those families --
  // `wazuh.agent.id`/`wazuh.agent.name` are the SAME field names on findings-v5, events-v5, and
  // every wazuh-states-* index (confirmed identical field literals in get-events-by-agent.ts:54
  // `wazuh.agent.name`, get-agent-os.ts:36/get-agent-packages.ts:43/get-fim-files.ts:72/
  // get-vulnerabilities.ts:63/get-vulnerabilities-by-agent.ts:56-57 `wazuh.agent.id`/
  // `wazuh.agent.name`) and this Set is a flat, non-index-scoped allowlist (checkAggs has no
  // `index` argument), so no new entry was needed for that pivot -- it was already unblocked.
  // The two pivots below are genuinely NEW field names, both `wazuh-states-*`-only (not present
  // on findings-v5/events-v5 at all) and both cardinality-safe regardless of MAX_AGG_SIZE's
  // (100) bucket cap, which bounds every terms/composite/multi_terms agg on this list anyway:
  //
  // - `package.name` (wazuh-states-inventory-packages, syscollector package inventory; field
  //   verified live in get-agent-packages.ts:45 `_source`, KNOWN_SAFE_STRUCTURAL_FIELDS-listed
  //   in field-policy-coverage.test.ts) -- a per-OS software catalog (distro package repositories
  //   / vendor installers), not analyst/attacker-supplied free text, unbounded IDs, file paths,
  //   or hashes; bounded by the fleet's actual installed-software catalog, not open cardinality.
  // - `host.os.name` (wazuh-states-inventory-system, syscollector OS inventory; field verified
  //   live in get-agent-os.ts:39 `_source`, KNOWN_SAFE_STRUCTURAL_FIELDS-listed) -- a finite OS
  //   name taxonomy (Ubuntu/Windows/CentOS/...), lower cardinality than the rule/technique
  //   taxonomies already on this list.
  // - `host.os.platform` (same index/tool, get-agent-os.ts:41 `_source`, also
  //   KNOWN_SAFE_STRUCTURAL_FIELDS-listed) -- an even coarser platform family bucket
  //   (linux/windows/darwin/...), lower cardinality than `host.os.name` above.
  'package.name',
  'host.os.name',
  'host.os.platform',
]);

/**
 * Exact-match ID lookup fields shared by `find_document_by_field` (and any `term`/`terms`/`ids`
 * query shaped the same way, including the search_wazuh_data escape hatch — see
 * `isExactIdLookupQuery` below): high-selectivity business-level UUID fields, distinct from the
 * OpenSearch document `_id` (handled separately via an `ids` query). Kept apart from
 * `AGG_FIELD_ALLOWLIST` above — that allowlist gates AGGREGATION cardinality; this one gates
 * exact-match LOOKUPS, a different safety property (a lookup on a high-cardinality field is fine,
 * an aggregation is not).
 */
export const ID_FIELD_ALLOWLIST = new Set([
  'wazuh.event.id',
  WAZUH_FIELD.RULE_ID,
  'vulnerability.id',
  'event.doc_id',
]);

/** DSL clause keys an exact-match ID lookup query is allowed to be built from — see
 * `isExactIdLookupQuery` below. `minimum_should_match` is a `bool` sibling key (not a clause of
 * its own), handled separately in `walkExactIdLookupShape` below rather than listed here. */
const EXACT_ID_LOOKUP_QUERY_KEYS = new Set([
  'bool',
  'filter',
  'must',
  'should',
  'must_not',
  'term',
  'terms',
  'ids',
]);

/**
 * True when `body` is a plain exact-match lookup (`term`/`terms` on an `ID_FIELD_ALLOWLIST` field,
 * and/or an `ids` query on `_id`), with no aggregation — the shape `find_document_by_field` builds
 * (a `bool.should` of one `ids` clause plus a `term`/`terms` clause per applicable business
 * field), and the reason an ID lookup has no time window to give the mandatory-time-range check.
 * Checked on QUERY SHAPE alone (not which tool produced it), so it also exempts a hand-built
 * search_wazuh_data query of the same shape — intentional: it only allows exact lookups on
 * high-selectivity ID fields, not an open-ended scan.
 */
function isExactIdLookupQuery(body: Record<string, unknown>): boolean {
  if (body.aggs !== undefined || body.aggregations !== undefined) {
    return false;
  }
  const query = body.query;
  return (
    !!query &&
    typeof query === 'object' &&
    !Array.isArray(query) &&
    walkExactIdLookupShape(query)
  );
}

function walkExactIdLookupShape(node: unknown): boolean {
  if (Array.isArray(node)) {
    return node.every(walkExactIdLookupShape);
  }
  if (!node || typeof node !== 'object') {
    return false;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'minimum_should_match') {
      continue; // A bare number sibling of `should` — nothing to validate or recurse into.
    }
    if (!EXACT_ID_LOOKUP_QUERY_KEYS.has(key)) {
      return false;
    }
    if (key === 'ids') {
      continue; // {ids: {values: [...]}} always targets _id — no field to check.
    }
    if (key === 'term' || key === 'terms') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
      }
      const fields = Object.keys(value as Record<string, unknown>);
      if (!fields.every(field => ID_FIELD_ALLOWLIST.has(field))) {
        return false;
      }
      continue;
    }
    // bool/filter/must/should/must_not: recurse into the nested clause(s).
    if (!walkExactIdLookupShape(value)) {
      return false;
    }
  }
  return true;
}

const TIME_FIELD_RE = /(^|\.)(timestamp|@timestamp)$/;
const MAX_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_AGG_SIZE = 100;

const LEADING_WILDCARD_KEYS = new Set([
  'wildcard',
  'query_string',
  'simple_query_string',
]);
/**
 * Leading `*`/`?` right after whitespace, `(`, `:`, or a Lucene prefix operator — the common
 * Lucene wildcard positions. The single-term operators `+ - ! ^ ~` must stay in the boundary
 * class: they sit directly in front of the wildcard as often as whitespace/`(`/`:` do, and a
 * `query_string: "+*powershell*"` that slips past runs an unbounded prefix scan (measured at 3.4s
 * on a small corpus).
 */
const LEADING_WILDCARD_PATTERN = /(^|[\s(:+\-!^~])[*?]/;
const TERMS_LIKE_AGG_KEYS = new Set([
  'terms',
  'cardinality',
  'significant_terms',
]);

/** Indices whose documents are events on a timeline — queries against them MUST be time-bounded.
 * Wazuh 5.0: the timeline families are wazuh-events-v5-* and
 * wazuh-findings-v5-* (@timestamp). `wazuh-states-*` is exempt: current-state snapshots (SCA, FIM,
 * inventory, vulnerabilities) have no meaningful event-time axis to bound (their time field,
 * state.modified_at, is a write time, not an event time). */
const TIME_BASED_INDEX_RE = /^wazuh-(events|findings)-v5/;

/**
 * Vulnerability STATE lives in wazuh-states-vulnerabilities, not the findings/events timeline — so
 * a bare "data.vulnerability." / "vulnerability." filter on a time-based (findings-v5/events-v5)
 * index is structurally wrong: it steers the model back to the typed vulnerability tools instead
 * of letting the escape hatch hand-build a vulnerability query against the wrong index. There is
 * no legitimate caller of vulnerability fields on a timeline index.
 */
const VULN_FIELD_RE = /^(data\.)?vulnerability\./;

/** DSL clause keys whose value's own keys ARE field paths (`{clauseKey: {"the.field.path": ...}}`)
 * — `exists` is the one exception, carrying its field path under a `field` key instead
 * (`{exists: {field: "the.field.path"}}`), handled separately in the walk below.
 * `prefix` added — same "value's own keys ARE field paths" shape
 * as match/term/terms/range above, so a bare `{prefix: {"vulnerability.severity": ...}}` was
 * bypassing this steering check entirely before (only the structural shape matters here, not the
 * matching semantics, so `prefix` needs no separate handling in the walk below either). */
const VULN_FIELD_CLAUSE_KEYS = new Set([
  'match',
  'match_phrase',
  'term',
  'terms',
  'range',
  'exists',
  'prefix',
]);

/**
 * Keyword fields where a numeric `range` bound would silently fall back to lexicographic string
 * comparison instead of erroring, mapped to a human description of their valid string values used
 * to build an accurate rejection message per field. `wazuh.rule.level` is currently the only
 * entry: it holds one of `SEVERITY_LEVELS` (`informational`/`low`/`medium`/`high`/`critical`), not
 * a numeric scale, and a numeric `range` against it does not error in OpenSearch — it silently
 * falls back to lexicographic string comparison ("informational" &lt; "low" &lt; "medium" by
 * dictionary order, NOT by severity), so it must be actively rejected. `term`/`terms` against the
 * string values is unaffected.
 */
const KEYWORD_RANGE_REJECT_FIELDS = new Map<string, string>([
  [
    WAZUH_FIELD.RULE_LEVEL,
    `one of the severity levels (${SEVERITY_LEVELS.join('/')})`,
  ],
]);

/**
 * True when a `range` clause anywhere in the tree targets one of `KEYWORD_RANGE_REJECT_FIELDS`
 * with at least one numeric bound. A non-numeric bound (e.g. a caller mistakenly trying
 * `{gte: "low"}`) is not this check's concern — that is still nonsensical on a `range` query
 * against a keyword field, but it does not silently produce a plausible-looking wrong answer the
 * way a numeric bound does, so it is left alone here.
 */
function findNumericRangeOnKeywordField(
  body: Record<string, unknown>,
): string | undefined {
  let reason: string | undefined;
  walk(body, (key, value) => {
    if (reason || key !== 'range' || !value || typeof value !== 'object') {
      return;
    }
    for (const [field, rangeValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const description = KEYWORD_RANGE_REJECT_FIELDS.get(field);
      if (!description || !rangeValue || typeof rangeValue !== 'object') {
        continue;
      }
      const bounds = rangeValue as Record<string, unknown>;
      const hasNumericBound = [
        bounds.gte,
        bounds.gt,
        bounds.lte,
        bounds.lt,
      ].some(bound => typeof bound === 'number');
      if (hasNumericBound) {
        reason =
          `Range on "${field}" is not allowed: it is a keyword field holding ${description}, ` +
          `not a number. Use "term" or "terms" against one or more of those string values instead.`;
        return;
      }
    }
  });
  return reason;
}

const VULN_FIELD_ON_FINDINGS_REASON =
  'Vulnerability data is not in the findings/events index. Use the vulnerability tools ' +
  '(get_vulnerabilities, get_critical_vulnerabilities, ' +
  'get_vulnerabilities_by_agent, get_vulnerability_by_cve) instead of querying vulnerability ' +
  'fields on a findings/events index.';

/** Shared by both the `script` and `runtime_mappings` checks in `lintDsl` below, so the two
 * trigger paths can never report drifted wording — a scripted
 * runtime_mappings hits the `script` branch first (it has a nested `script` key), a scriptless one
 * falls through to the `runtime_mappings` branch, and both are the same class of rejection. */
const SCRIPT_OR_RUNTIME_MAPPINGS_REASON =
  'Scripted queries, sorts, or aggregations ("script"/"script_fields"/"runtime_mappings") are not allowed.';

/**
 * Recursive DSL lint (static tree walk; no query execution). Rejects the query patterns the design calls
 * out and returns a reason string suitable for a bounded one-shot model retry. Checked in a fixed
 * order so the first violation found is reported deterministically. `index` (when given) enables
 * the per-index checks — the mandatory time bound on time-based indices, and the
 * vulnerability-field-on-a-timeline-index check below.
 */
export function lintDsl(
  body: Record<string, unknown>,
  index?: string,
): GuardrailCheck {
  // Same depth guard as applySafetyValves — lintDsl is exported independently and must
  // never rely on being called only after applySafetyValves to be safe from the recursive `walk`
  // calls below.
  if (exceedsMaxDepth(body, MAX_TREE_DEPTH)) {
    return { ok: false, reason: 'Query is too deeply nested.' };
  }

  if (findKey(body, 'script')) {
    return { ok: false, reason: SCRIPT_OR_RUNTIME_MAPPINGS_REASON };
  }

  // The check above only ever matched a nested `script` key, so
  // it caught a SCRIPTED runtime field (one with a Painless `script`) but let a scriptless one
  // (pure type coercion, e.g. `{runtime_mappings: {day_of_week: {type: 'keyword'}}}`) straight
  // through — even though the rejection message above already claimed to block
  // `runtime_mappings` outright. Explicit key check so the guardrail matches its own stated intent.
  if (findKey(body, 'runtime_mappings')) {
    return { ok: false, reason: SCRIPT_OR_RUNTIME_MAPPINGS_REASON };
  }

  const wildcardReason = findLeadingWildcard(body);
  if (wildcardReason) {
    return { ok: false, reason: wildcardReason };
  }

  if (findKey(body, 'regexp')) {
    return { ok: false, reason: '"regexp" queries are not allowed.' };
  }

  // Same "unfixable by editing the range" class as the structural bans above: a numeric range
  // against a keyword field does not error, it silently does the WRONG thing (lexicographic
  // string comparison), so it must be caught before any range-shaped check below that would
  // otherwise treat this body as a well-formed, in-range query.
  const keywordRangeReason = findNumericRangeOnKeywordField(body);
  if (keywordRangeReason) {
    return { ok: false, reason: keywordRangeReason };
  }

  // Same "unfixable by editing the range" reasoning as the structural bans above, so this too
  // must be reported before the mandatory-time-range check below: telling the model to add/widen
  // a range would burn its bounded retry on a correction that does not fix a wrong index/field
  // choice.
  if (
    index !== undefined &&
    TIME_BASED_INDEX_RE.test(index) &&
    findVulnerabilityFieldOnFindingsIndex(body)
  ) {
    return { ok: false, reason: VULN_FIELD_ON_FINDINGS_REASON };
  }

  // After the structural bans (script/wildcard/regexp) and the vulnerability-field check above:
  // those are unfixable by editing the range, so they must be the reason the model sees when both
  // violations are present — a "add a time range" reason on a script query (or a wrong-index
  // vulnerability query) would burn the bounded retry on the wrong correction.
  if (
    index !== undefined &&
    TIME_BASED_INDEX_RE.test(index) &&
    !hasTimeRange(body) &&
    !isExactIdLookupQuery(body)
  ) {
    return {
      ok: false,
      reason:
        `Queries against "${index}" must include a "range" clause on the "@timestamp" field ` +
        `bounded on both sides — a lower bound ("gte" or "gt") and an upper bound ("lte" or "lt") ` +
        `— spanning at most 90 days.`,
    };
  }

  const dateRangeReason = checkDateRanges(body);
  if (dateRangeReason) {
    return { ok: false, reason: dateRangeReason };
  }

  // Checked before the per-aggregation field/size
  // checks below -- cheaper, and "too many aggregations" is a different (and arguably more basic)
  // correction for the model to make than any one aggregation's own field/size violation.
  const topLevelAggCountReason = checkTopLevelAggCount(body);
  if (topLevelAggCountReason) {
    return { ok: false, reason: topLevelAggCountReason };
  }

  const aggReason = checkAggs(body);
  if (aggReason) {
    return { ok: false, reason: aggReason };
  }

  return { ok: true };
}

function walk(
  node: unknown,
  visit: (key: string, value: unknown, parent: Record<string, unknown>) => void,
): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      walk(item, visit);
    }
    return;
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      visit(key, value, record);
      walk(value, visit);
    }
  }
}

function findKey(body: Record<string, unknown>, targetKey: string): boolean {
  let found = false;
  walk(body, key => {
    if (key === targetKey) {
      found = true;
    }
  });
  return found;
}

function containsLeadingWildcard(node: unknown): boolean {
  if (typeof node === 'string') {
    return (
      node.startsWith('*') ||
      node.startsWith('?') ||
      LEADING_WILDCARD_PATTERN.test(node)
    );
  }
  if (Array.isArray(node)) {
    return node.some(containsLeadingWildcard);
  }
  if (node && typeof node === 'object') {
    return Object.values(node).some(containsLeadingWildcard);
  }
  return false;
}

function findLeadingWildcard(
  body: Record<string, unknown>,
): string | undefined {
  let reason: string | undefined;
  walk(body, (key, value) => {
    if (reason || !LEADING_WILDCARD_KEYS.has(key)) {
      return;
    }
    if (containsLeadingWildcard(value)) {
      reason = `"${key}" clauses with a leading wildcard ("*"/"?") are not allowed.`;
    }
  });
  return reason;
}

/**
 * True when a match/match_phrase/term/terms/range/exists clause anywhere in the tree references a
 * field path starting with "data.vulnerability." or a bare "vulnerability." (VULN_FIELD_RE). Reuses
 * `walk`, the same tree-walker every other check in this file already uses, so it inherits the same
 * MAX_TREE_DEPTH pre-check `lintDsl` already runs before any check below it gets here — no separate
 * recursion guard needed.
 */
function findVulnerabilityFieldOnFindingsIndex(
  body: Record<string, unknown>,
): boolean {
  let found = false;
  walk(body, (key, value) => {
    if (
      found ||
      !VULN_FIELD_CLAUSE_KEYS.has(key) ||
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return;
    }
    const clause = value as Record<string, unknown>;
    // `exists` carries its field path under a `field` key, not as the clause's own key.
    if (key === 'exists') {
      if (
        typeof clause.field === 'string' &&
        VULN_FIELD_RE.test(clause.field)
      ) {
        found = true;
      }
      return;
    }
    if (Object.keys(clause).some(field => VULN_FIELD_RE.test(field))) {
      found = true;
    }
  });
  return found;
}

/** Resolves `now`, `now-Nd/h/m`, or an ISO-8601 string to epoch ms; undefined if unparseable. */
function resolveDateMath(
  value: unknown,
  referenceNowMs: number,
): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value === 'now') {
    return referenceNowMs;
  }
  const match = /^now-(\d+)([dhm])$/.exec(value);
  if (match) {
    const amount = Number(match[1]);
    const unitMs =
      match[2] === 'd' ? 86400000 : match[2] === 'h' ? 3600000 : 60000;
    return referenceNowMs - amount * unitMs;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * True when the body contains a `range` clause on a recognized time field that is reachable
 * through REQUIRED query context. `bool.should` clauses are optional (none of them need to match
 * unless `minimum_should_match` forces it) and `bool.must_not` clauses are negated, so a time
 * range placed in either does not actually bound what the query matches — it must NOT satisfy the
 * mandatory-time-bound check. A decorative `bool.should` range next to
 * `bool.filter: [{match_all:{}}]` otherwise scans the whole corpus while looking bounded (measured
 * at 2272 docs vs. 1650 for the equivalent bounded query). Only `bool.filter`/`bool.must` (and
 * a bare top-level/filter-level `range`, i.e. anything not nested under an optional/negated clause)
 * count. `lintDsl` runs AFTER `applySafetyValves`' `normalizeMustToFilter`, so by the time this
 * runs, any `bool.must` has already been folded into `bool.filter` — both are REQUIRED context
 * here regardless, so `must` is handled for completeness/robustness against future call sites.
 * `checkDateRanges` (below) deliberately still validates EVERY range clause regardless of
 * required/optional context — being stricter there (rejecting a malformed range even inside an
 * optional clause) is safe; only "does a range exist at all" needs the required-context distinction.
 */
function hasTimeRange(body: Record<string, unknown>): boolean {
  return walkRequiredForTimeRange(body, true);
}

/** Context-aware traversal backing `hasTimeRange`: `required` is only carried into `bool.filter`
 * and `bool.must`; `bool.should` and `bool.must_not` are recursed into with `required=false` so a
 * `range` found there can never flip `found` to true. */
function walkRequiredForTimeRange(node: unknown, required: boolean): boolean {
  if (Array.isArray(node)) {
    return node.some(item => walkRequiredForTimeRange(item, required));
  }
  if (!node || typeof node !== 'object') {
    return false;
  }
  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key === 'range' && required && value && typeof value === 'object') {
      for (const field of Object.keys(value as Record<string, unknown>)) {
        if (TIME_FIELD_RE.test(field)) {
          return true;
        }
      }
    }
    if (
      key === 'bool' &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const boolClause = value as Record<string, unknown>;
      if (
        boolClause.filter !== undefined &&
        walkRequiredForTimeRange(boolClause.filter, required)
      ) {
        return true;
      }
      if (
        boolClause.must !== undefined &&
        walkRequiredForTimeRange(boolClause.must, required)
      ) {
        return true;
      }
      if (
        boolClause.should !== undefined &&
        walkRequiredForTimeRange(boolClause.should, false)
      ) {
        return true;
      }
      if (
        boolClause.must_not !== undefined &&
        walkRequiredForTimeRange(boolClause.must_not, false)
      ) {
        return true;
      }
      // Sub-clauses handled explicitly above with the correct per-clause `required` context —
      // do NOT also fall through to the generic recursion below (that would re-walk `should`/
      // `must_not` with the parent's `required`, defeating the whole point of this function).
      continue;
    }
    if (walkRequiredForTimeRange(value, required)) {
      return true;
    }
  }
  return false;
}

function checkDateRanges(body: Record<string, unknown>): string | undefined {
  let reason: string | undefined;
  const now = Date.now();
  walk(body, (key, value) => {
    if (reason || key !== 'range' || !value || typeof value !== 'object') {
      return;
    }
    for (const [field, rangeValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (
        !TIME_FIELD_RE.test(field) ||
        !rangeValue ||
        typeof rangeValue !== 'object'
      ) {
        continue;
      }
      const bounds = rangeValue as Record<string, unknown>;
      // Accept the EXCLUSIVE bound forms (`gt`/`lt`) as equivalents of `gte`/`lte`. The rule this
      // check exists to enforce is "the time window must be bounded on BOTH sides" — whether an
      // edge is inclusive or exclusive is semantically irrelevant to that, and Elasticsearch/
      // OpenSearch treat all four as first-class. Requiring the inclusive spelling specifically was
      // a user-visible failure: a model writing the perfectly ordinary `{gte: <24h ago>, lt: now}`
      // for "the last 24 hours" was rejected, retried the identical query for every MAX_TOOL_ROUNDS
      // round, and the user saw only "a technical issue". Both bounds remain mandatory; only the
      // inclusive-vs-exclusive spelling is relaxed.
      const lowerBound = bounds.gte !== undefined ? bounds.gte : bounds.gt;
      const upperBound = bounds.lte !== undefined ? bounds.lte : bounds.lt;
      if (lowerBound === undefined || upperBound === undefined) {
        reason =
          `Range on time field "${field}" must specify both a lower bound ("gte" or "gt") and ` +
          `an upper bound ("lte" or "lt").`;
        return;
      }
      const gteMs = resolveDateMath(lowerBound, now);
      const lteMs = resolveDateMath(upperBound, now);
      if (gteMs === undefined || lteMs === undefined) {
        reason = `Range on time field "${field}" has an unparseable bound.`;
        return;
      }
      if (lteMs < gteMs) {
        reason = `Range on time field "${field}" has its upper bound before its lower bound.`;
        return;
      }
      if (lteMs - gteMs > MAX_LOOKBACK_MS) {
        const maxDays = MAX_LOOKBACK_MS / 86400000;
        reason = `Range on time field "${field}" spans more than the ${maxDays}-day maximum lookback.`;
        return;
      }
    }
  });
  return reason;
}

/** Floor for date_histogram/histogram bucket width. The Indexer itself backstops bucket
 * explosion at `max_buckets=65535` (a 503), but that wastes compute and gives an ugly error for
 * something this linter can reject cheaply and clearly up front. A sub-1-minute bucket over the
 * 90-day mandatory lookback ceiling (MAX_LOOKBACK_MS above) is never a legitimate need for this
 * plugin's tools, so it's rejected unconditionally — regardless of target index (checkAggs has no
 * `index` argument to be more selective, and there's no need to be). */
const MIN_DATE_HISTOGRAM_INTERVAL_MS = 60_000;

/** Parses a date_histogram/histogram interval value into milliseconds. Accepts the common
 * `fixed_interval` duration-string forms ("1s", "30s", "5m", "1h", "1d", with or without a space)
 * and bare numbers (a raw ms count — also how a "histogram" agg's numeric `interval` would express
 * a sub-minute bucket if pointed at a date field's epoch-millis value, closing that variant of the
 * same bypass). Returns undefined when the value isn't one of these recognized forms (e.g. a
 * calendar keyword like "hour" passed via the deprecated `interval` param) — callers treat
 * "unparseable" as "cannot prove unsafe" and let it through rather than false-rejecting a
 * legitimate calendar-style value this parser doesn't model. */
function parseIntervalMs(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  const durationMatch = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)$/.exec(trimmed);
  if (durationMatch) {
    const amount = Number(durationMatch[1]);
    const unitMs: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    return amount * unitMs[durationMatch[2]];
  }
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return undefined;
}

/** Exact violation message for an aggregation field not on `AGG_FIELD_ALLOWLIST` — shared by every
 * terms-like/composite/multi_terms field check in `checkAggs` below so the near-verbatim
 * constructions can't drift out of sync. */
function aggFieldViolation(field: unknown): string {
  return `Aggregation on field "${field}" is not on the allowed low-cardinality field list.`;
}

/** Exact violation message for an aggregation size exceeding its cap — shared by every
 * terms-like/composite/multi_terms size check in `checkAggs` below. */
function aggSizeViolation(size: number, cap: number): string {
  return `Aggregation size (${size}) exceeds the maximum of ${cap}.`;
}

/** Sibling-aggregation count cap:
 * `checkAggs` below validates each individual aggregation's field/size but never bounded how MANY
 * top-level aggregations one query_dsl could declare. Many individually-valid allowlisted terms
 * aggs (all passing the per-agg checks) still cost real work downstream: digest.ts's per-aggregation
 * breakdown-text concatenation, and `capDigest`'s repeated-JSON.stringify trim loop over the whole
 * digest, both do work roughly proportional to the NUMBER of aggregations in the response, not just
 * each one's own size -- a dimension none of the existing per-agg checks bound. `digest.ts` itself
 * has no bound of its own, so capping the count here is what keeps it fed a bounded number of
 * aggregations to summarize. */
const MAX_TOP_LEVEL_AGGS = 5;

/** Counts the keys directly under the request body's OWN top-level "aggs" (or "aggregations" --
 * OpenSearch accepts either name at the request root) object -- deliberately NOT a `walk`-based
 * tree search like every other check in this file: this is a sibling-count at exactly one level
 * (the top-level aggregations a single query_dsl declares), not "does this key exist somewhere in
 * the tree" or "how deep is this nested" the way script/wildcard/regexp/runtime_mappings above
 * check. A sub-aggregation nested one level down inside a bucket agg (e.g. `aggs.by_rule.aggs.sample`)
 * is a different concern (already covered by MAX_TREE_DEPTH) and must not be double-counted here. */
function countOwnAggKeys(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }
  return Object.keys(value as Record<string, unknown>).length;
}

function checkTopLevelAggCount(
  body: Record<string, unknown>,
): string | undefined {
  // Count BOTH spellings and SUM them, rather than `body.aggs ?? body.aggregations`. OpenSearch
  // accepts either name at the request root, and a body may legally carry both — in which case the
  // `??` form only ever counted the `aggs` side, so ONE decoy entry under `aggs` hid any number of
  // real aggregations under `aggregations`. Each was still individually field/size-checked by
  // `checkAggs`'s generic walk, but the sibling-COUNT cap this function exists to enforce was
  // bypassed completely. Verified before the fix: `{aggs:{decoy}, aggregations:{a1..a10}}` passed.
  const count = countOwnAggKeys(body.aggs) + countOwnAggKeys(body.aggregations);
  if (count > MAX_TOP_LEVEL_AGGS) {
    return (
      `Query declares ${count} top-level aggregations, exceeding the maximum of ` +
      `${MAX_TOP_LEVEL_AGGS}. Split this into separate requests or narrow to only the ` +
      'aggregations you actually need.'
    );
  }
  return undefined;
}

function checkAggs(body: Record<string, unknown>): string | undefined {
  let reason: string | undefined;
  walk(body, (key, value) => {
    if (reason || !value || typeof value !== 'object') {
      return;
    }
    const aggValue = value as Record<string, unknown>;
    if (TERMS_LIKE_AGG_KEYS.has(key)) {
      const field = aggValue.field;
      if (typeof field === 'string' && !AGG_FIELD_ALLOWLIST.has(field)) {
        reason = aggFieldViolation(field);
        return;
      }
      const size = asNumber(aggValue.size);
      if (size !== undefined && size > MAX_AGG_SIZE) {
        reason = aggSizeViolation(size, MAX_AGG_SIZE);
        return;
      }
    }
    if (key === 'composite') {
      const sources = aggValue.sources;
      if (Array.isArray(sources)) {
        for (const source of sources) {
          if (!source || typeof source !== 'object') {
            continue;
          }
          for (const sourceSpec of Object.values(
            source as Record<string, unknown>,
          )) {
            const termsSpec = (
              sourceSpec as Record<string, unknown> | undefined
            )?.terms as Record<string, unknown> | undefined;
            const field = termsSpec?.field;
            if (typeof field === 'string' && !AGG_FIELD_ALLOWLIST.has(field)) {
              reason = aggFieldViolation(field);
            }
          }
        }
      }
      // `composite` needs its own size cap: its page size lives on the aggregation itself, not on
      // the `sources[].terms` specs checked above.
      const compositeSize = asNumber(aggValue.size);
      if (
        !reason &&
        compositeSize !== undefined &&
        compositeSize > MAX_AGG_SIZE
      ) {
        reason = aggSizeViolation(compositeSize, MAX_AGG_SIZE);
      }
    }
    // `multi_terms` cannot go through TERMS_LIKE_AGG_KEYS above: its fields live in `terms`, an
    // ARRAY of `{field: ...}` specs (mirroring composite.sources' shape), not a single `field`
    // string. Both the field allowlist and the size cap have to be applied here instead.
    if (key === 'multi_terms') {
      const termsSpecs = aggValue.terms;
      if (Array.isArray(termsSpecs)) {
        for (const termSpec of termsSpecs) {
          const field = (termSpec as Record<string, unknown> | undefined)
            ?.field;
          if (typeof field === 'string' && !AGG_FIELD_ALLOWLIST.has(field)) {
            reason = aggFieldViolation(field);
          }
        }
      }
      const multiTermsSize = asNumber(aggValue.size);
      if (
        !reason &&
        multiTermsSize !== undefined &&
        multiTermsSize > MAX_AGG_SIZE
      ) {
        reason = aggSizeViolation(multiTermsSize, MAX_AGG_SIZE);
      }
    }
    // `top_hits` multiplies: nested under an outer aggregation, `{top_hits:{size:10000}}` asks the
    // cluster to materialize (outer agg size) x 10000 documents. Only `size` needs capping — it
    // returns raw matched documents rather than field buckets, so the field allowlist does not
    // apply — and the cap is the MAX_AGG_SIZE every sibling aggregation uses.
    if (key === 'top_hits') {
      const topHitsSize = asNumber(aggValue.size);
      if (topHitsSize !== undefined && topHitsSize > MAX_AGG_SIZE) {
        reason = aggSizeViolation(topHitsSize, MAX_AGG_SIZE);
      }
    }
    // Defense in depth against a sub-second interval bucket-explosion: the cluster backstops at
    // max_buckets=65535 (a 503), but that wastes compute for an ugly error. Conservative and cheap
    // by design — not a full interval/calendar model, just a floor.
    if (key === 'date_histogram' || key === 'histogram') {
      if (aggValue.calendar_interval === undefined) {
        const rawInterval = aggValue.fixed_interval ?? aggValue.interval;
        if (rawInterval === undefined) {
          reason =
            `"${key}" aggregation must specify a "calendar_interval", "fixed_interval", or ` +
            `"interval".`;
        } else {
          const intervalMs = parseIntervalMs(rawInterval);
          if (
            intervalMs !== undefined &&
            intervalMs < MIN_DATE_HISTOGRAM_INTERVAL_MS
          ) {
            reason =
              `"${key}" interval (${JSON.stringify(
                rawInterval,
              )}) is too fine; use an interval ` + `of at least 1 minute.`;
          }
        }
      }
    }
  });
  return reason;
}

/** Manager API footprint: `limit` clamped regardless of what the tool/model requested.
 *
 * A non-numeric `limit` is left untouched rather than defaulted (unlike `clampLimit` in
 * server/tools/catalog/common.ts, which falls back to its own `defaultValue`): the Manager API
 * validates its own query parameters and rejects a malformed one with a clear 400, which is a
 * better error than a silently substituted value. */
export function clampManagerParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...params };
  const limit = asNumber(next.limit);
  if (limit !== undefined) {
    next.limit = clampInt(Math.trunc(limit), 1, MAX_SIZE);
  }
  return next;
}
