/**
 * Indexer footprint guardrails. The cluster itself is assumed
 * permissive (OpenSearch 2.x defaults: no default search timeout, `allow_leading_wildcard=true`,
 * `search.allow_expensive_queries=true`) — the plugin enforces everything itself, on every
 * outbound `_search`, regardless of whether the query came from a typed catalog tool (defense in
 * depth) or the future free-DSL escape hatch (its only line of defense).
 *
 * BOUND-DISCLOSURE AUDIT (issue #8935 item I4). Every bound the model can hit against the
 * Indexer/Manager through this plugin, as of this base commit — kept as one list because the
 * class issue #8935 targets is "an unmarked bound", and a single list is what makes "did we miss
 * one" answerable at a glance rather than scattered across call sites. Cross-references are by
 * SYMBOL name, never line number (line numbers in an audit rot the moment code is inserted above
 * them — integration review found every number in the first cut already stale).
 *
 * - MAX_SIZE=500 (hits `size`) — `applySafetyValves`: silent clamp, but STRUCTURALLY disclosed
 *   (`Digest.counts` carries {total, returned, truncated} plus a `samplesNote`). Adequate; no
 *   change.
 * - MAX_FROM=1000 (`from`) — `applySafetyValves`: rejection with reason — disclosed (the model
 *   sees why and can self-correct).
 * - track_total_hits=10000 — `applySafetyValves`: SILENT on this base — digest.ts's count
 *   extraction reads `hits.total.value` and ignores `relation: 'gte'`, so a >10k result set
 *   reports exactly 10000 unmarked (only `appendWindowRecountHint`'s own probe words it "at
 *   least N"). NOT FIXED HERE: issue #8909 removes this clamp and merges ahead of this branch in
 *   the team's stated order — re-fixing here guarantees a conflict. Recorded as "silent on this
 *   base, resolved upstream by #8909".
 * - MAX_LOOKBACK_MS (90d time-range span) — `checkDateRanges`: THE DEFECT this item fixes. The
 *   rejection reaches the model as an error, but a bare retry inside the cap is indistinguishable
 *   from a default-window query — nothing marks the eventual ANSWER as capped. Fixed by
 *   `clampLookbackWindow` below (required-context clauses only): clamp-and-disclose on the
 *   successful call's own digest, the layer measured at 3/3 (not the prompt layer, measured 0/3).
 *   The span REJECTION itself is UNCHANGED for every other clause shape — `lintDsl` is the
 *   documented standalone boundary and still guards any call site that skips the clamp.
 * - MAX_AGG_SIZE=100 (terms/composite/multi_terms/top_hits `size`) — `checkAggs`: rejection with
 *   reason — disclosed.
 * - MAX_TOP_LEVEL_AGGS=5 — `checkTopLevelAggCount`: rejection with reason — disclosed.
 * - MIN_DATE_HISTOGRAM_INTERVAL_MS=60000 — `checkAggs`: rejection with reason — disclosed.
 * - script/runtime_mappings/regexp/leading-wildcard bans — `lintDsl`: rejection with reason —
 *   disclosed.
 * - Request-side `terms` size truncation (more distinct values than the agg `size`) —
 *   cluster-side, not this file: disclosed via `sum_other_doc_count` -> digest.ts's
 *   `breakdownNote` (case 2). The SYNTHETIC-breakdown top-5 trim (`buildSyntheticBreakdown` in
 *   digest.ts) is a SEPARATE instance owned and fixed by issue #8935 item I1 — cross-referenced,
 *   not duplicated here.
 * - MAX_SAMPLES=5 (digest sample rows) — digest.ts: `samplesNote` — disclosed.
 * - MAX_FIELD_VALUE_LENGTH / MAX_HINT_LENGTH — digest.ts: visible "…" ellipsis — disclosed
 *   inline. NOTE: this item's own lookback disclosure adds up to ~MAX_LOOKBACK_DISCLOSURES
 *   sentences (~250 chars each) to `hint` on exactly the wide-window calls that return the most
 *   data — bounded by design (see MAX_LOOKBACK_DISCLOSURES), but it does consume hint budget the
 *   recount/near-miss writers share, which is why it is prepended first (executor.ts orders it
 *   ahead of longer hints).
 * - `capDigest` drop stages (samples beyond the worded samplesNote count; breakdown buckets
 *   beyond the disclosed count) — digest.ts: SILENT RESIDUAL — a sample/breakdown bucket popped
 *   by the hard char cap can fall below what the ALREADY-EMITTED note claims. Rare after item
 *   I1's char-budgeted carry; recorded, deliberately NOT fixed here — a fix needs note
 *   recomputation from INSIDE the cap loop, a digest.ts change out of this item's file list.
 * - `clampManagerParams` limit -> MAX_SIZE (Manager API `limit`) — this file: silent clamp,
 *   disclosed structurally via Manager digest counts (`total_affected_items` vs `returned`).
 * - MAX_TOOL_ROUNDS — orchestration layer (not this file): owned by issue #8893's final-round
 *   instruction and issue #8935 item I3 — out of scope here.
 * - TABLE_ROW_CAP / DERIVED_COLUMN_CAP — client rendering / row schema: never model-facing
 *   completeness (the table renders locally and never reaches the model, per executor.ts's own
 *   comment on that boundary) — noted only, nothing to disclose to the model.
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
// `threatintel-(rules|decoders|integrations|policies|filters|kvdbs)` is enumerated explicitly
// (a sub-family list, not a bare `threatintel-[^,\s]*`), so opening a NEW sub-family always
// requires a conscious edit here rather than silently inheriting from the wildcard prefix. This
// allowlist is documented as the standalone boundary that must hold on its own, independent of
// what today's tool schemas happen to permit.
//
// Workstream A1a (AI/plan/coverage-validation-design.md, TC-8/MS-6/MS-7): widened past the
// original 3-family + threatintel-{rules..kvdbs} + sap-detectors-config set left by workstream B.
// Every addition below is a family/index with REAL data on `wazuh-aio-5` (live-verified 2026-08-19,
// see this branch's own verification notes) and no owning typed tool -- the mission is "every
// family with real data is queryable by construction", not "a new typed tool per family", so these
// widen the SAME escape hatch (`search_wazuh_data`) rather than spawning one-off tools. Each entry
// below documents its own live evidence; entries considered and DELIBERATELY EXCLUDED are
// documented immediately after the regex so "why isn't X in here" is answerable without git log
// archaeology.
//
//  - `wazuh-metrics-[^,\s]*` -- covers `wazuh-metrics-comms`/`wazuh-metrics-agents`/
//    `wazuh-metrics-normalization`/`wazuh-metrics-comms-v4` as one family (coverage doc's open gap
//    G1: fleet-health/comms metrics, real data -- 1,040/716/16,620/0 docs respectively on this VM
//    at verification time -- and no workstream owned it before this one). One wildcard rather than
//    four literals: all four are the plugin's own emitted operational-metrics data streams (no
//    tool ever needs to see one without being able to see the others), and `comms-v4`'s live doc
//    count is volatile (drift noted in the coverage doc, 0 here vs 1,032 observed elsewhere) so a
//    literal would have to be re-verified on every drift; the wildcard is stable regardless.
//  - `\.wazuh-cti-consumers` / `\.wazuh-content-manager-jobs` -- CTI freshness status (coverage
//    doc MS-6/MS-7, retiers CV-050 from "can't diagnose" to answerable): live-verified 3 docs
//    (per-feed `status`/`local_offset`/`remote_offset`) and 2 docs (sync-schedule metadata) --
//    config/status documents written by the content-manager service itself, never
//    analyst/attacker-supplied.
//  - `\.opensearch-sap-[^,\s]*-findings` -- the 15 per-log-type Security Analytics findings
//    indices (coverage doc G2, "findings now flowing after the `alert_finding_enabled=true`
//    fix"), live-verified reachable via their aliases (`.opensearch-sap-wazuh-generic-findings`
//    etc., `_cat/aliases` confirms one alias per family, no ambiguity with the sibling
//    `-detectors-queries-optimized-<uuid>` internal artifact indices, which end in a UUID suffix
//    and a differently-worded family name, never `-findings`). Deliberately does NOT open
//    `-alerts` (see exclusions below) or the `-detectors-queries-optimized-*` compiled-query
//    indices (already out of scope per the coverage doc's own appendix -- an internal artifact,
//    not a question surface).
//  - `\.opensearch-sap-pre-packaged-rules-config` -- the 1,472-doc pre-packaged Sigma catalog
//    (coverage doc G3, live-verified 126 docs at re-check time -- count drift, still real,
//    non-empty). Vendor-curated rule metadata, same class as `get_rules`'s own corpus.
//  - `\.opensearch-sap-correlation-metadata` -- coverage doc MS-12 correction: NOT empty like its
//    correlation-alerts/history siblings (live-verified 2 docs: `root`/`counter`/`finding1`/
//    `finding2`/`logType`/`timestamp`, internal correlation bookkeeping, not analyst data).
//  - `\.wazuh-threatintel-vulnerabilities-a` -- the raw CTI CVE feed (coverage doc, "one of only
//    two cover-now rows with production-shaped volume", TC-8 sequences it first). Live-verified
//    372,301 docs, public CVE-record JSON (cveMetadata/containers.cna, the same public NVD-sourced
//    schema `get_rules`' own vendor content descends from).
//  - `wazuh-threatintel-enrichments-a` -- IOC enrichment feed (coverage doc, same TC-8 sequencing
//    as vulnerabilities-a above). REVERSES the prior "deliberately out of scope" decision recorded
//    on this same line by workstream B/earlier phases (see `guardrails.test.ts`'s prior assertion,
//    now updated) -- that decision predates the A1a mission ("every family with real data must be
//    queryable by construction") and TC-8's explicit resequencing of this exact row to cover-now.
//    Live-verified 257,071+ docs, third-party threat-intel indicator records (domain/hash/IP
//    values IDENTIFYING KNOWN-MALICIOUS INFRASTRUCTURE, not the customer's own network -- see this
//    branch's `privacy.ts` additions for why these are 'allow', not anonymized).
//
// DELIBERATELY EXCLUDED (documented so a future reader doesn't silently rediscover the same
// live-checks and reach a different conclusion):
//  - `.opendistro-ism-config` (retention-policy config, coverage doc G8) -- live-verified BLOCKED:
//    `_cat/indices` reports 82 docs, but `_search`/`_count` against it both return 0 hits/0 count
//    for the plugin's own `admin` credential (same behavior verified live against
//    `.opendistro_security`, a known system-protected index) -- OpenSearch Security's system-index
//    protection filters document reads even for an admin REST credential. Skipped per this
//    workstream's own instruction ("verify live and skip with a note if perms block it") rather
//    than allowlisted-but-nonfunctional; G8 remains an open product-decision gap, unresolved by
//    this branch.
//  - `wazuh-ai-assistant-sessions` -- explicitly excluded (privacy: this plugin's own chat-history
//    store; a user must never be able to read another user's session content, including through
//    this escape hatch -- coverage doc MS-1, "not a coverage gap, a security assertion").
//  - `.opendistro_security` / any other `.opendistro-security`-family index -- explicitly excluded
//    (internal authz plane; reading it directly IS the information leak the RBAC-troubleshooting
//    decline exists to prevent -- coverage doc MS-11's corrected reasoning).
//  - `.opensearch-sap-*-alerts` / `.opensearch-sap-correlation-alerts` /
//    `.opensearch-sap-correlation-history*` -- left out: all are empty on this VM by a provisioning
//    defect (`triggers: []` on every detector, coverage doc G2) rather than by design, so allowing
//    the pattern would let the model run a real query that can only ever return zero -- no
//    escape-hatch value until the provisioning defect is fixed upstream.
//  - `.opendistro-alerting-config` / `.opensearch-notifications-config` -- open product-decision
//    gaps (coverage doc G7/G9) with no workstream ownership assigned; NOT this workstream's call to
//    make unilaterally, so left closed pending that decision.
// `.opensearch-sap-detectors-config` (get_detectors.ts) is an exact single index, not a wildcard
// family -- OpenSearch Security Analytics' own config store for detector definitions, confirmed
// live to be indexer-reachable and to hold no analyst/attacker-supplied data (name/type/schedule/
// enabled/source, all vendor- or admin-configured).
const INDEX_ALLOWLIST_RE =
  /^wazuh-(events-v5|findings-v5|states|threatintel-(rules|decoders|integrations|policies|filters|kvdbs)|metrics)[^,\s]*$|^wazuh-threatintel-enrichments-a$|^\.opensearch-sap-detectors-config$|^\.opensearch-sap-pre-packaged-rules-config$|^\.opensearch-sap-correlation-metadata$|^\.opensearch-sap-[^,\s]*-findings$|^\.wazuh-cti-consumers$|^\.wazuh-content-manager-jobs$|^\.wazuh-threatintel-vulnerabilities-a$/;

/** The escape hatch's (and every catalog tool's) index-pattern allowlist. */
export function checkIndexAllowlist(index: string): GuardrailCheck {
  if (!INDEX_ALLOWLIST_RE.test(index)) {
    return {
      ok: false,
      reason:
        `Index "${index}" is not in the allowed set (wazuh-events-v5-*, wazuh-findings-v5-*, ` +
        'wazuh-states-*, wazuh-metrics-*, ' +
        'wazuh-threatintel-{rules,decoders,integrations,policies,filters,kvdbs,enrichments}-*, ' +
        '.wazuh-threatintel-vulnerabilities-a, .wazuh-cti-consumers, .wazuh-content-manager-jobs, ' +
        '.opensearch-sap-detectors-config, .opensearch-sap-*-findings, ' +
        '.opensearch-sap-pre-packaged-rules-config, .opensearch-sap-correlation-metadata).',
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
/** The largest `precision_threshold` OpenSearch honours for a `cardinality` aggregation. Below the
 * threshold a distinct count is EXACT; above it, HyperLogLog++ returns an estimate. */
export const MAX_CARDINALITY_PRECISION_THRESHOLD = 40000;

/**
 * Raises every `cardinality` aggregation's `precision_threshold` to the engine maximum, recursively
 * (a cardinality can sit under a bucket agg as a sub-aggregation).
 *
 * Distinct counts are the one supported metric that is an ESTIMATE rather than a count, and the
 * default threshold is only 3000 — so "how many distinct hosts/rules/CVEs" silently became
 * approximate on any real fleet while looking exactly as authoritative as an exact count. Raising it
 * costs a bounded amount of memory per aggregation and buys exactness across the whole range any
 * Wazuh deployment plausibly reaches. Above it, `Digest.metrics[].approximate` marks the number so
 * the caveat travels with the value instead of being lost.
 *
 * Deliberately raises rather than REJECTS a high-cardinality request: refusing to answer, or
 * answering with an unmarked estimate, are both worse than answering exactly wherever the engine
 * can.
 */
function raiseCardinalityPrecision(aggs: unknown): void {
  if (!aggs || typeof aggs !== 'object') {
    return;
  }
  for (const aggBody of Object.values(aggs as Record<string, unknown>)) {
    if (!aggBody || typeof aggBody !== 'object') {
      continue;
    }
    const agg = aggBody as Record<string, unknown>;
    const cardinality = agg.cardinality;
    if (cardinality && typeof cardinality === 'object') {
      (cardinality as Record<string, unknown>).precision_threshold =
        MAX_CARDINALITY_PRECISION_THRESHOLD;
    }
    // Sub-aggregations: a cardinality under a terms/date_histogram bucket is the common "distinct X
    // per Y" shape and needs the same treatment.
    raiseCardinalityPrecision(agg.aggs ?? agg.aggregations);
  }
}

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
  // Forced to `true` (an exact count) regardless of whatever the model/catalog tool set, the same
  // "enforced value always wins" precedence every other valve in this function applies -- this
  // assignment runs unconditionally, after `next` already carries through any caller-supplied
  // `track_total_hits`, so a search_wazuh_data query_dsl setting its own value (true/false/a
  // number) is silently overwritten here, never honored. Previously this was clamped to a
  // NUMERIC cap (10000): OpenSearch stops counting past that number and reports
  // `hits.total = {value: 10000, relation: 'gte'}` for any match count above it, so `digest.ts`'s
  // "total" (and therefore its "truncated" flag) silently under-reported/mis-flagged once a
  // fleet's real match count crossed 10k -- observed as "10,000 total, capped" answers that were
  // not actually the true count. `true` asks OpenSearch for the EXACT count on every shard
  // (`hits.total = {value: <exact>, relation: 'eq'}` always) with no upper bound of its own.
  // Accepted trade-off, not a regression: exact counting costs strictly more than a capped count
  // on a very large index -- COUNTING work, not RETURNED-volume work, so it is NOT actually bounded
  // by the <=90-day time range or by `MAX_SIZE`/`MAX_AGG_SIZE`: those valves cap how many documents/
  // buckets are ever RETURNED to the caller, but `track_total_hits: true` makes every shard walk
  // its ENTIRE matching set to produce an exact count regardless of how few hits are returned or
  // how narrow the declared time window is -- a 90-day range against a high-volume index can still
  // match millions of documents that all have to be counted. The actual backstop against that cost
  // is `SEARCH_TIMEOUT` ('10s', above): every search this valve applies to already carries that
  // timeout, so a pathologically expensive exact count fails the request (a clean, bounded error)
  // rather than running unbounded -- that timeout, not the time-range/size valves, is what makes
  // this acceptable. Trade-off accepted because `counts.total` drives user-facing, often
  // compliance-adjacent answers ("how many critical vulnerabilities") where an approximate/capped
  // number is the wrong kind of wrong to ship silently, and this plugin's traffic is bounded
  // lab/production security telemetry, not an unbounded web-scale corpus.
  // Recorded follow-up concern, NOT mitigated by anything above: there is no per-TURN cap on how
  // many tool calls a single conversation turn can issue, so a turn that fans out several expensive
  // exact-count aggregations back-to-back has no aggregate cost ceiling beyond each individual
  // call's own 10s timeout -- worth revisiting if this valve's cost profile turns out to matter in
  // practice.
  next.track_total_hits = true;
  raiseCardinalityPrecision(next.aggs ?? next.aggregations);
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
 * Fields vetted BOUNDED-BUCKET SAFE for terms/composite/cardinality/significant_terms aggs. Only
 * schema-valid `wazuh.*` fields are listed where applicable (see `common/wazuh-fields.ts`);
 * population is decoder-dependent.
 *
 * Originally documented as a "low-cardinality" allowlist, which described every entry until
 * `source.ip` below: safety here does NOT actually come from the underlying field's cardinality
 * being small -- it comes from `MAX_AGG_SIZE` (100) capping how many buckets any terms/composite/
 * multi_terms agg on ANY of these fields can ever RETURN, and from every such query already being
 * bounded by this file's other valves (the mandatory time range on timeline indices, `MAX_SIZE`
 * on returned hits, the index allowlist). A field with unbounded underlying cardinality (like an
 * IP address space) still only ever returns at most 100 buckets and costs the Indexer one bounded
 * terms aggregation over an already time-/scope-bounded shard set -- the same resource shape as a
 * genuinely low-cardinality field, just with more candidate terms to bucket over on the way there.
 * Every entry below except `source.ip` also happens to be low-cardinality in the traditional
 * sense (a finite taxonomy/catalog); that is a property of THOSE fields, not a requirement this
 * list enforces. Field-level PRIVACY exposure (a bucket's `key` being a raw analyst-identifying
 * value) is a SEPARATE, already-solved concern handled by `privacy.ts`'s `extractAggFields`/
 * `applyFieldPolicy` -- see `source.ip`'s own comment below for how that applies here.
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
  // Issue #8920 item 1 (population-disclosure): the three fields below back the per-kind/per-tool
  // breakdown aggregations added to close the "sample narrated as population" class ("named 2 of
  // 10 failed checks" on get_sca_checks; a truncated ports inventory page with no view of the
  // closed-set field's true distribution). This is a PERFORMANCE guard widening (aggregation
  // cardinality), not a privacy guard: every field below is a small closed enum, not
  // analyst/attacker-supplied free text, terms `size` still caps at MAX_AGG_SIZE via checkAggs
  // for any caller including the escape hatch, and privacy.ts's field policy (a separate
  // boundary) is unaffected by this list either way. Each entry cites in-repo aggregation
  // evidence, per the standard `policy.id` (above) set — a terms agg on a text-mapped field is a
  // hard 400 ("Fielddata is disabled"), so "probably keyword" is not enough. `process.state` is
  // deliberately NOT here: its only in-repo use is a KQL filter
  // (plugins/main/public/components/overview/it-hygiene/processes/dashboard.ts), which a text
  // mapping would also satisfy — get_agent_inventory covers it with the digest-level
  // breakdownDimensions fallback (no mapping requirement) until a live terms agg on
  // wazuh-states-inventory-processes is verified.
  //
  // SCA per-check result — a closed enum ("Passed"/"Failed"/"Not applicable");
  // get-sca-results.ts's own capitalized `term` filters on this field are checked-in proof it is
  // keyword-mapped (a `term` filter with those exact capitalized values on a text mapping would
  // never match).
  'check.result',
  // SCA check NAME enumeration (#8935 item I2, scoped-enumeration): keyword-mapped, proven by
  // this tool's own checked-in `prefix` clause on `check.name` in get-sca-checks.ts's `search`
  // filter -- a `prefix` clause on a text-mapped field would not behave as a prefix match, and
  // the 5.0 field-rename comment at the top of that file records the live mapping verification
  // against a real 5.0 stack. Cardinality is bounded by the finite CIS/benchmark check catalog
  // per policy (~207 checks for cis_ubuntu22-04) -- same class as the already-listed RULE_TITLE
  // (772 distinct live). PERFORMANCE guard widening (aggregation cardinality), not a privacy one,
  // same framing as this block's header comment above.
  'check.name',
  // Syscollector ports: this repo's IT Hygiene network dashboard runs a real terms agg on it
  // (plugins/main/public/components/overview/it-hygiene/dashboards/dashboard-panels.ts). Code
  // review B10: this comment previously claimed live values include "Inactive"/"Unknown" --
  // corrected per live spot-check (AI/plan/b-review.md P1.3): actual values are
  // "established"/"listening"/"time_wait"/"close_wait".
  'interface.state',
  // Syscollector ports: aggregated by the IT Hygiene services/traffic dashboards. Code review B10:
  // this comment previously claimed live values are uppercase ("TCP"/"UDP") -- corrected per live
  // spot-check (AI/plan/b-review.md P1.3): actual values are lowercase "tcp"/"tcp6"/"udp".
  'network.transport',
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
  // Entity pivot for "top attacking/connecting source IPs" questions. Field name verified live:
  // `source.ip` is the exact literal already used as a findings-v5 investigation field
  // (`server/tools/catalog/common.ts:265` `FINDING_INVESTIGATION_ROW_FIELDS` and `:283`
  // `FINDING_DIGEST_EXTRA_COLUMNS` -- sent to the model today in every finding-hits tool's digest,
  // see `get-brute-force.ts`) and as the syscollector local-IP field
  // (`get-agent-ports.ts:46,62,74`). HONEST cardinality note, unlike every other entry above:
  // an IP address is HIGH-cardinality, not a finite taxonomy -- safety here rests entirely on
  // `MAX_AGG_SIZE` capping the returned bucket count and the query's other mandatory bounds (time
  // range, index allowlist), per this Set's contract comment above, NOT on `source.ip` itself
  // having few distinct values. PRIVACY: `source.ip` already has a `FIELD_POLICY_DEFAULTS` entry
  // (`privacy.ts`, `{action: 'anonymize', kind: 'IP'}`) from its existing use as a sample field,
  // and `privacy.ts`'s `applyFieldPolicy` `breakdown` loop resolves EVERY bucket's aggregation
  // field(s) via `extractAggFields`/`scrubAggKey` and applies that SAME policy entry to the bucket
  // key (or, for a `multi_terms`/`composite` pivot, to each of its components) -- the "a top-agents
  // terms agg leaks hostnames otherwise" mechanism documented on `applyFieldPolicy`, which already
  // covers ANY aggregated field, not just agent fields. So a `source.ip` terms agg's buckets are
  // pseudonymized under privacy mode exactly like a `source.ip` sample value is today; no new
  // privacy plumbing was needed for a plain `terms` pivot on this field (a `multi_terms`/
  // `composite` pivot combining `source.ip` with another field required fixing a separate,
  // pre-existing gap in that same mechanism -- see `scrubAggKey`'s doc comment in privacy.ts).
  // Privacy-off (the default) surfaces raw IPs in buckets, same as it already does in
  // every finding-hits tool's digest samples via `FINDING_DIGEST_EXTRA_COLUMNS` -- no new exposure.
  'source.ip',
  // Code review B1 (CEO-scenario dead-end, AI/plan/b-review.md P1.1): the three fields below are
  // the POPULATED `wazuh.agent.host.*`/`wazuh.integration.*` twins of already-listed
  // findings/events-side fields (`host.os.name`/`host.os.platform` above, which are largely
  // UNPOPULATED on findings/events -- see FIELD_ALIASES in common/field-catalog.ts). Without these,
  // the model could enumerate the empty field but was guardrail-blocked from ever reaching the
  // twin that actually carries the answer. All three verified live on this v31 environment as
  // `keyword`-mapped, aggregatable, single-digit-to-low cardinality -- safer than `host.os.name`,
  // which is already on this list:
  //
  // - `wazuh.agent.host.os.name` / `wazuh.agent.host.os.platform` (wazuh-findings-v5*/
  //   wazuh-events-v5*): live terms agg returns `ubuntu` 2,825 (single dominant bucket) on this
  //   fleet's findings retention -- coarser, lower-cardinality than the already-listed
  //   `host.os.name`/`host.os.platform` pair, same finite OS taxonomy, just on the surface that is
  //   actually populated.
  // - `wazuh.integration.name` (wazuh-findings-v5*/wazuh-events-v5*): live terms agg returns
  //   `linux` 2,022, `wazuh-vd` 796, `wazuh-fim` 10, `wazuh-sca` 8, `wazuh-it-hygiene` 2 -- a
  //   finite, single-digit-cardinality integration catalog, same class and shape as the
  //   already-listed `wazuh.integration.category` ("system-activity"/"security"/...), just one
  //   level more specific.
  WAZUH_FIELD.AGENT_OS_NAME,
  WAZUH_FIELD.AGENT_OS_PLATFORM,
  WAZUH_FIELD.INTEGRATION_NAME,
]);

/**
 * Read-only accessor for `AGG_FIELD_ALLOWLIST` (workstream B, get_field_values -- server/tools/
 * catalog/get-field-values.ts): that tool must refuse a `field` this allowlist would reject
 * anyway, with a helpful message, INSTEAD OF letting the call reach `lintDsl`/`checkAggs` and come
 * back as an opaque guardrail rejection -- the same "fail with a useful message, not a generic
 * guardrail error" shape every other typed tool's own parameter validation already gets. Kept as
 * a function rather than exporting the `Set` itself so this file stays the only place that can
 * mutate the allowlist.
 */
export function isAggAllowedField(field: string): boolean {
  return AGG_FIELD_ALLOWLIST.has(field);
}

/** The allowlist's members as a stable, sorted array -- for `get_field_values`'s "closest known
 * field" suggestion when a caller's `field` is not on the list (a plain prefix/substring scan
 * needs something iterable; the `Set` itself is fine for membership checks but awkward to scan). */
export function listAggAllowedFields(): string[] {
  return [...AGG_FIELD_ALLOWLIST].sort();
}

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
/**
 * Hard cap on any aggregation's `size`, enforced by `checkAggs` below on EVERY indexer request
 * (executor.ts runs `lintDsl` unconditionally — a typed catalog tool is not exempt).
 *
 * Exported because a catalog tool that derives an aggregation `size` from its own `limit` parameter
 * must clamp to the SAME number, and hard-coding it a second time is how issue #8894 happened:
 * `get_sca_results` clamped `limit` to 500, fed it to a `terms` size, and every call in the 101-500
 * range was rejected here — while its parameter description advertised 500 to the model, so a
 * compliant model was steered straight into the failure. Catalog code must reach this value through
 * `catalog/common.ts`'s `clampAggLimit`/`aggLimitProperty` rather than restating it, so the enforced
 * cap and the advertised cap cannot drift apart again. `catalog/agg-size-coverage.test.ts` asserts
 * no tool in the registry can build a request this rejects.
 */
export const MAX_AGG_SIZE = 100;

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
 * Whether `lintDsl` will REQUIRE a bounded `@timestamp` range for this index — exported so a
 * caller that hand-builds a body (executor.ts's near-miss probe) can satisfy the rule instead of
 * being silently rejected by it. A rangeless probe against a findings index fails `lintDsl` and the
 * caller's early return then swallows the failure, so the feature disappears with no error: exactly
 * what happened before this was exported.
 */
export function requiresBoundedTimeRange(index: string): boolean {
  return TIME_BASED_INDEX_RE.test(index);
}

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

// Cross-category tool audit: this reason reaches the model via lintDsl, which
// executor.ts's executeIndexerRequest runs against EVERY Indexer-backed tool call with "no
// per-tool exemptions" (see that file) -- in practice the realistic caller is search_wazuh_data
// or find_document_by_field, both `free_search` (server/tools/router.ts), which is one of the two
// categories ALWAYS offered whenever any tools are offered at all (resolveStage2Tools always adds
// search_wazuh_data). The four named tools below, though, all live in the separate
// `vulnerabilities` category, which stage-1 routing has no obligation to also offer on the SAME
// turn -- an unconditional "use the vulnerability tools" here would be the same "instruction names
// a tool that may not be offered" shape as issue #8913. Worded conditionally, with an explicit
// fallback, so the model degrades to telling the user about the gap instead of stalling on tools
// it was not given.
const VULN_FIELD_ON_FINDINGS_REASON =
  'Vulnerability data is not in the findings/events index. The vulnerability tools ' +
  '(get_vulnerabilities, get_critical_vulnerabilities, get_vulnerabilities_by_agent, ' +
  'get_vulnerability_by_cve) cover this instead -- use whichever of those is offered to you this ' +
  'turn rather than querying vulnerability fields on a findings/events index. If none of them ' +
  'are available to you this turn, tell the user this assistant cannot check vulnerability data ' +
  'from here.';

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

// Exported so server/tools/field-validation.ts's field-name extractor can reuse the exact same
// tree-walk shape this file's own checks (findKey, findLeadingWildcard, checkAggs, ...) already
// rely on, instead of a second hand-rolled walker drifting out of sync with this one.
export function walk(
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

/** How many clamped-window sentences one disclosure may carry. digest.ts's MAX_HINT_LENGTH
 * invariant is "every hint writer contributes bounded, sentence-sized text" — six clamped clauses
 * once produced a 1,499-char disclosure that evicted the zero-row recount hint and truncated
 * mid-timestamp (issue #8935 integration review). Identical (requested, clamped) pairs are
 * de-duplicated before this cap applies; anything beyond it is summarized in one counted tail. */
const MAX_LOOKBACK_DISCLOSURES = 2;

/**
 * Clamp-and-disclose for a time-range span above `MAX_LOOKBACK_MS` (the fix for the one row
 * marked THE DEFECT in this file's module-header bound-disclosure audit). Returns a NEW body —
 * `applySafetyValves`'s and `normalizeMustToFilter`'s no-mutation convention — plus a
 * `disclosure` whenever at least one clause was actually clamped.
 *
 * SCOPE: REQUIRED query context ONLY — `body.query` through `bool.filter`/`bool.must` chains,
 * exactly the context-tracking `walkRequiredForTimeRange` above applies. `bool.should`,
 * `bool.must_not`, `aggs`-nested filters and `post_filter` are passed through UNTOUCHED and left
 * to `checkDateRanges`'s existing span REJECTION. This deliberately REVERSES the first cut of
 * this fix, which clamped every clause in the tree "for scope parity with checkDateRanges"
 * (integration review): the disclosure asserts a property of the RESULT SET ("results cover X to
 * Y"), and that claim is only derivable from a clause that BOUNDS what the query matches — for a
 * `should` clause it is irrelevant-and-false, and for `must_not` it is exactly INVERTED (the
 * named window would be the one window the results exclude, and the clamp would silently NARROW
 * the exclusion the caller asked for). Rejection-with-reason is the honest, base-identical
 * behaviour for those shapes; clamping is only honest where the sentence is true.
 *
 * CLAMPS ONLY the well-formed, over-wide case: both bounds present, both parseable via
 * `resolveDateMath`, and upper >= lower. Every other shape (a single-sided range, an unparseable
 * bound, an inverted window) is passed through UNCHANGED and left to `checkDateRanges`'s existing
 * rejections -- those are "unfixable by clamping", not a narrower instance of this bound.
 *
 * THE OFF-BY-EPSILON TRAP (why both bounds are rewritten to concrete ISO strings, not just the
 * lower one): if only the lower bound were rewritten while the upper bound stayed a live
 * `'now'`/`'now-Nd'` date-math string, the span this function computed at clamp time and the span
 * `checkDateRanges` computes moments later (it calls `Date.now()` again, independently) would
 * differ by however many milliseconds elapsed in between -- reopening the window by that epsilon
 * and defeating the "exactly `MAX_LOOKBACK_MS`" guarantee `lintDsl`'s strict `>` check depends on.
 * Resolving BOTH bounds to absolute ISO timestamps up front removes the second `Date.now()` call
 * from the equation entirely: `Date.parse` on an ISO string never depends on when it runs.
 *
 * Bound-key handling on a clamped clause (integration review, all three):
 *  - the inclusive/exclusive spelling (`gte`/`gt`, `lte`/`lt`) is preserved;
 *  - when BOTH spellings of one side are present, the non-preferred one is DROPPED — leaving a
 *    stale `gt: now-400d` beside the clamped `gte` would let the engine pick the wider bound
 *    while the disclosure claims the capped window;
 *  - a sibling `format` key is DROPPED — the rewritten bounds are full ISO date-times, which a
 *    caller's `format: 'yyyy-MM-dd'` would make unparseable cluster-side, converting a clear,
 *    self-correctable rejection into an opaque one (`time_zone` is kept: the rewritten values
 *    carry an explicit Z offset, which overrides it harmlessly).
 *
 * DISCLOSURE WORDING: derives the day figure from `MAX_LOOKBACK_MS` (never a hardcoded "90", so
 * raising the cap cannot make the sentence false), and only claims "results cover X to Y" when
 * the clamped clause is the SOLE required-context time range in the query — with more than one,
 * the effective window is their INTERSECTION and the sentence says so instead of overstating
 * coverage.
 */
export function clampLookbackWindow(body: Record<string, unknown>): {
  body: Record<string, unknown>;
  disclosure?: string;
} {
  if (!body.query || typeof body.query !== 'object') {
    return { body };
  }
  const state: LookbackClampState = {
    clamped: [],
    requiredTimeRanges: 0,
  };
  const nowMs = Date.now();
  const clampedQuery = clampLookbackNode(body.query, true, nowMs, state);
  if (state.clamped.length === 0) {
    return { body };
  }
  return {
    body: { ...body, query: clampedQuery as Record<string, unknown> },
    disclosure: buildLookbackDisclosure(state),
  };
}

interface LookbackClampState {
  clamped: Array<{
    requestedLower: string;
    requestedUpper: string;
    clampedLowerIso: string;
    clampedUpperIso: string;
  }>;
  /** Every well-formed (both-bounds, parseable) time-range clause seen in REQUIRED context,
   * clamped or not — what decides whether the disclosure may claim whole-result coverage or must
   * speak of an intersection. */
  requiredTimeRanges: number;
}

/** One bounded disclosure from every clamp this body needed: de-duplicated, capped at
 * `MAX_LOOKBACK_DISCLOSURES` sentences with a counted tail, day figure derived from
 * `MAX_LOOKBACK_MS`, and coverage claimed only when it is actually derivable — see
 * `clampLookbackWindow`'s DISCLOSURE WORDING paragraph. */
function buildLookbackDisclosure(state: LookbackClampState): string {
  const maxDays = MAX_LOOKBACK_MS / 86400000;
  const seen = new Set<string>();
  const unique = state.clamped.filter(entry => {
    const key = JSON.stringify(entry);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  const soleWindow = state.requiredTimeRanges === 1;
  const sentences = unique
    .slice(0, MAX_LOOKBACK_DISCLOSURES)
    .map(
      ({ requestedLower, requestedUpper, clampedLowerIso, clampedUpperIso }) =>
        soleWindow
          ? `Time window capped: the requested range (${requestedLower} to ${requestedUpper}) ` +
            `spans more than the ${maxDays}-day maximum; results cover ${clampedLowerIso} to ` +
            `${clampedUpperIso} only. State to the user that the answer covers this capped ` +
            'window, not the full requested range.'
          : `Time window capped: a requested range (${requestedLower} to ${requestedUpper}) ` +
            `spanning more than the ${maxDays}-day maximum was narrowed to ${clampedLowerIso} ` +
            `to ${clampedUpperIso}. Other time filters in this query still apply — the ` +
            'effective window is the intersection of all of them; state the answer window ' +
            'accordingly.',
    );
  const overflow = unique.length - MAX_LOOKBACK_DISCLOSURES;
  if (overflow > 0) {
    sentences.push(
      `${overflow} more over-wide time filter(s) were capped the same way.`,
    );
  }
  return sentences.join(' ');
}

/** Rebuilds a QUERY node, clamping `range` clauses only while `required` context holds -- same
 * recursive rebuild-the-tree shape as `normalizeMustToFilter` above (never mutates its input),
 * same required/optional context rules as `walkRequiredForTimeRange` (bool.filter/bool.must keep
 * the parent's context; bool.should/bool.must_not are copied VERBATIM — nothing under them may be
 * clamped, and `walkRequiredForTimeRange` never restores `required` under them either, so a
 * verbatim copy is exactly equivalent). */
function clampLookbackNode(
  node: unknown,
  required: boolean,
  nowMs: number,
  state: LookbackClampState,
): unknown {
  if (Array.isArray(node)) {
    return node.map(item => clampLookbackNode(item, required, nowMs, state));
  }
  if (!node || typeof node !== 'object') {
    return node;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (
      key === 'range' &&
      required &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      out[key] = clampRangeClause(
        value as Record<string, unknown>,
        nowMs,
        state,
      );
      continue;
    }
    if (
      key === 'bool' &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const boolClause = value as Record<string, unknown>;
      const rebuilt: Record<string, unknown> = {};
      for (const [subKey, subValue] of Object.entries(boolClause)) {
        if (subKey === 'filter' || subKey === 'must') {
          rebuilt[subKey] = clampLookbackNode(subValue, required, nowMs, state);
        } else {
          // should / must_not / minimum_should_match / boost / ...: verbatim — optional and
          // negated context is never clamped (see the SCOPE paragraph above).
          rebuilt[subKey] = subValue;
        }
      }
      out[key] = rebuilt;
      continue;
    }
    out[key] = clampLookbackNode(value, required, nowMs, state);
  }
  return out;
}

/** Clamps every `TIME_FIELD_RE` field inside one REQUIRED-context `range` clause's value
 * (`{"@timestamp": {...}}`), field-by-field -- a clause could in principle carry more than one
 * recognized time field. Fields that are not time fields, or that fail any of the "clampable"
 * preconditions documented on `clampLookbackWindow` above, pass through with their original
 * bounds object reference. */
function clampRangeClause(
  rangeValue: Record<string, unknown>,
  nowMs: number,
  state: LookbackClampState,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, bounds] of Object.entries(rangeValue)) {
    if (
      !TIME_FIELD_RE.test(field) ||
      !bounds ||
      typeof bounds !== 'object' ||
      Array.isArray(bounds)
    ) {
      out[field] = bounds;
      continue;
    }
    const boundsRecord = bounds as Record<string, unknown>;
    // Same "gte wins over gt" preference as checkDateRanges, so the two functions agree on which
    // key is "the" lower/upper bound whenever a caller (unusually) sends both spellings.
    const lowerKey: 'gte' | 'gt' | undefined =
      boundsRecord.gte !== undefined
        ? 'gte'
        : boundsRecord.gt !== undefined
        ? 'gt'
        : undefined;
    const upperKey: 'lte' | 'lt' | undefined =
      boundsRecord.lte !== undefined
        ? 'lte'
        : boundsRecord.lt !== undefined
        ? 'lt'
        : undefined;
    if (!lowerKey || !upperKey) {
      // Single-sided range -- unfixable by clamping; checkDateRanges' "must specify both" rejection
      // stays the correction path.
      out[field] = bounds;
      continue;
    }
    const lowerRaw = boundsRecord[lowerKey];
    const upperRaw = boundsRecord[upperKey];
    const lowerMs = resolveDateMath(lowerRaw, nowMs);
    const upperMs = resolveDateMath(upperRaw, nowMs);
    if (lowerMs === undefined || upperMs === undefined) {
      // Unparseable bound -- unfixable by clamping; checkDateRanges' own rejection stays the
      // correction path.
      out[field] = bounds;
      continue;
    }
    if (upperMs < lowerMs) {
      // Inverted window -- unfixable by clamping; checkDateRanges' own rejection stays the
      // correction path.
      out[field] = bounds;
      continue;
    }
    // A well-formed required-context time window (clamped or not) — counted for the disclosure's
    // sole-window-vs-intersection wording decision.
    state.requiredTimeRanges += 1;
    if (upperMs - lowerMs <= MAX_LOOKBACK_MS) {
      // Already within the cap -- nothing to clamp or disclose.
      out[field] = bounds;
      continue;
    }
    const clampedUpperMs = upperMs;
    const clampedLowerMs = clampedUpperMs - MAX_LOOKBACK_MS;
    const clampedUpperIso = new Date(clampedUpperMs).toISOString();
    const clampedLowerIso = new Date(clampedLowerMs).toISOString();
    const {
      gte: _gte,
      gt: _gt,
      lte: _lte,
      lt: _lt,
      format: _format,
      ...passthrough
    } = boundsRecord;
    out[field] = {
      // Everything except the four bound spellings and `format` (see the bound-key handling
      // paragraph on clampLookbackWindow for why the duplicate spellings and `format` must go).
      ...passthrough,
      [lowerKey]: clampedLowerIso,
      [upperKey]: clampedUpperIso,
    };
    state.clamped.push({
      requestedLower: String(lowerRaw),
      requestedUpper: String(upperRaw),
      clampedLowerIso,
      clampedUpperIso,
    });
  }
  return out;
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
            if (
              !sourceSpec ||
              typeof sourceSpec !== 'object' ||
              Array.isArray(sourceSpec)
            ) {
              continue;
            }
            const sourceSpecRecord = sourceSpec as Record<string, unknown>;
            // Only a `terms` composite source was ever field/allowlist-checked below --
            // `histogram`/`date_histogram`/`geotile_grid` sources were silently let through
            // regardless of what field they aggregated on, and their bucket component then
            // reached privacy.ts's field-policy scrub as an "unresolved property" (pass-through
            // for a typed tool, since composite is escape-hatch-only in practice, this closes a
            // real gap rather than a defense-in-depth one). Rejected here rather than merely
            // routed to privacy.ts's fail-closed default: the field itself was NEVER checked
            // against AGG_FIELD_ALLOWLIST for these source types, so a high-cardinality field
            // (e.g. a raw numeric field bucketed by `histogram`) could reach a bucket regardless
            // of this file's field-allowlist contract -- an aggregation-safety gap, not just a
            // privacy one, and this file's job is the former.
            if (!('terms' in sourceSpecRecord)) {
              const sourceType = Object.keys(sourceSpecRecord)[0] ?? 'unknown';
              reason =
                `Composite source type "${sourceType}" is not allowed; only "terms" composite ` +
                'sources are supported.';
              continue;
            }
            const termsSpec = sourceSpecRecord.terms as
              | Record<string, unknown>
              | undefined;
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
