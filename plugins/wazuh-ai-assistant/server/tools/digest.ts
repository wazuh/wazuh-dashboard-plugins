import { TableSpec } from '../../common/types';
import { ToolDefinition } from './types';

/**
 * Digest pipeline: what the model sees after a tool executes. The
 * full result renders locally as a `table` StreamEvent (built by buildTableSpec below); the model
 * only gets this bounded digest — counts, a breakdown when the query was an aggregation, and up
 * to 5 whitelisted-column sample rows.
 */
export interface Digest {
  tool: string;
  counts: { total?: number; returned: number; truncated: boolean };
  /** `agg` is set only when the executed query had more than one top-level aggregation — the
   * search_wazuh_data escape hatch (a hand-built multi-agg query) and, since #8870's fix, every
   * finding-hits typed tool (`catalog/common.ts`'s `FINDING_BREAKDOWN_AGGS` always attaches two:
   * by agent name and by rule title) — naming which aggregation a bucket belongs to; single-agg
   * digests stay byte-identical to before it existed. It also lets privacy.ts's field-policy pass
   * attribute each bucket key to the right aggregation field. */
  breakdown?: Array<{ key: string; count: number; agg?: string }>;
  /** Set in exactly three situations, each a distinct honesty gap the model cannot see on its own:
   *
   * 1. `breakdown` was synthesized from the RETURNED page (`buildSyntheticBreakdown`) rather than
   *    a real OpenSearch aggregation over the full matched set (`buildBreakdown`), AND that page
   *    is not the whole matched set (`counts.truncated`) — i.e. an entity whose rows sort outside
   *    the page is invisible to `breakdown`, the exact defect #8870's validation update
   *    reproduced live (limit:20 on 26 matches synthesizing 13/7 and 11/9 while the true
   *    distribution is 16/8/2 and 13/13). Tells the model `breakdown` is NOT authoritative for
   *    the full result, unlike `samplesNote` (which caveats `samples` only).
   * 2. `breakdown` came from a REAL terms aggregation whose BUCKET LIST is truncated — either
   *    OpenSearch's own `sum_other_doc_count` > 0 (a request-side `size` truncation) or this
   *    digest's own char-budgeted carry (`capBreakdownCarry`/`BREAKDOWN_CHAR_BUDGET` — issue
   *    #8935 item 1, for an enumeration-sized aggregation like `get_sca_results`), or both,
   *    merged into one figure (`mergeTruncation`). Per-bucket COUNTS are still exact and
   *    population-true, but the KEY SET is incomplete: presenting 5 agent-name buckets as "the
   *    agents affected" on a 12-agent deployment reproduces the exact
   *    sample-narrated-as-population class one layer up, with the digest's own
   *    trust-the-breakdown wording as warrant. The note states the uncounted remainder (and,
   *    when known, the hidden KEY count) explicitly, plus which end of the list the digest kept
   *    when it was the digest that trimmed (`CARRY_TRIM_SENTENCE`).
   * 3. `breakdown` was synthesized and a dimension had more than `BREAKDOWN_BUCKET_CAP` distinct
   *    values — the same "top-N key set" gap as case 2, just arising from a JS `Map` cut instead
   *    of an OpenSearch `sum_other_doc_count` (#8935's synthetic-breakdown silent-bind fix: the
   *    base disclosed nothing here, because no request-side `sum_other_doc_count` equivalent
   *    exists for a page grouped in memory). Over an UNTRUNCATED page with a KNOWN total
   *    (`returned === total`) counts are exact and the note says top-by-count (provably true —
   *    the cut is sorted in this file); over a truncated or unknown-total page the case-1
   *    page-scope note gets the hidden-values sentence appended instead, with no exactness claim.
   *
   * Omitted for a real aggregation whose buckets are complete and within the carry budget, and
   * for a synthetic one over an untruncated result whose every dimension stayed within
   * `BREAKDOWN_BUCKET_CAP` distinct values. `buildSamplesNote`'s "trust the breakdown" variant keys
   * off the SYNTHETIC-page-scope case only (see `syntheticPageScoped` in `buildDigest`): both case 2
   * and case 3's untruncated form keep exact, population-true counts, so pointing the model at
   * counts/breakdown stays truthful in either — this note is what tells it the key list is not the
   * universe. */
  breakdownNote?: string;
  /** Set only when `counts.returned` is 0 AND the executed query carried 2+ filter clauses — see
   * `buildZeroRowHint` below. A 0-row result is exactly as consistent with "a wrong field name" or
   * "an over-narrow filter" as with "genuinely no matching data"; the system prompt already tells
   * the model to retry broader in that situation, but relying on it noticing on its own has
   * measurably failed (see the issue this exists for), so this makes the ambiguity mechanical
   * instead. A single-filter 0-row result is an ordinary, unambiguous "no data" and gets no hint. */
  hint?: string;
  samples: Array<Record<string, unknown>>;
  /** Set only when `samples.length < counts.returned` — see `buildSamplesNote`: a one-sentence
   * caveat that the sample is the newest-N of the result, not a representative cut, so the model
   * does not read an entity's absence from `samples` as a fact about the whole result set. */
  samplesNote?: string;
  /**
   * POSITIVE coverage statement (issue #8935's Guarantee 2): what the numbers in this digest are
   * computed over, said explicitly, in both directions.
   *
   * Every other note here warns the model when something is NOT trustworthy. None of them ever said
   * the opposite — so even when a count was population-true (OpenSearch computes an aggregation over
   * every matched document regardless of `size`), nothing told the model that IN WORDS, and it hedged.
   * A hedged answer over an exact number reads as incomplete, which is half of why answers "feel bad"
   * on a large result set. The goal this serves: with 300k matching documents the assistant should
   * answer as well as if all 300k were in context, and it can only do that if it knows which parts of
   * the digest ARE the whole set.
   *
   * Costs no extra query. Whether a bucket list is the COMPLETE distinct set is already decidable from
   * the response: `sum_other_doc_count === 0` on a terms aggregation means nothing was left out, so
   * "all N distinct values" is a fact rather than a guess.
   */
  coverage?: string;
  /** Schema hint: the column ids of the table SPEC sent to the client — i.e. the field set each
   * row object carries. Deliberately NOT "the columns the user sees": the client may cap how
   * many spec columns render as visible table columns (its own budget), with the rest reachable
   * through the row expander — so the model must treat this as the row schema, never as proof a
   * particular column is on screen. */
  columns: string[];
  /** The Manager response's top-level `message` (e.g. "AR command was not sent to any agent"),
   * when present — some mutation endpoints report an otherwise-silent no-op only through this
   * field, with `affected_items`/`failed_items` both empty. */
  message?: string;
  /**
   * Every metric-shaped (`isMetricAggValue`) or single-bucket-count (`isSingleBucketDocCount`)
   * TOP-LEVEL aggregation, keyed by the model's own agg name — populated UNCONDITIONALLY whenever
   * at least one such aggregation is in the response (issue #8920 item 5, e.g. `aggs: {by_rule:
   * {terms...}, distinct_agents: {cardinality...}}`). It is deliberately populated even for a
   * metric-ONLY response, where `bucketsToRows`' synthesized row (see its doc comment) already
   * carries the same numbers: the synthesized row exists for the rendered table and is subject to
   * column projection (`deriveResultColumns`' `_source` priority, or a typed tool's static
   * `sampleColumns` that cannot name a model-chosen agg), either of which can silently drop the
   * value from `samples` — `metrics` is the projection-immune carrier, so the computed answer can
   * never be lost to a column mismatch. `value_as_string` is carried when OpenSearch provides it
   * (min/max on a date field return `{value: <epoch millis>, value_as_string: <ISO date>}`), so
   * the model is never left to interpret a bare epoch integer.
   * Three facts about how this interacts with the rest of the pipeline, recorded here since none
   * of them needed structural changes elsewhere:
   *  1. Privacy: `value` is always a NUMBER (a computed statistic), never analyst/attacker-supplied
   *     data, so it needs no field-policy classification. `applyFieldPolicy`'s `{...digest}` spread
   *     (privacy.ts) carries `metrics` through to the scrubbed digest untouched — it is never
   *     enumerated there, same as `columns`.
   *  2. `prescanAndMintToolContent`'s JSON-aware scan (privacy.ts) skips this key via
   *     `UNSCANNED_DIGEST_KEYS`: `value_as_string` is OpenSearch's own date/number formatting of a
   *     numeric statistic (never a hostname/IP), and scanning it would misfire on timestamp
   *     fragments ("00.000Z" is FQDN-token-shaped); `agg` is the aggregation's own name (chosen by
   *     the model, not indexed data).
   *  3. Size: `capDigest` needs no new drop stage for this field — `guardrails.ts`'s
   *     `MAX_TOP_LEVEL_AGGS` (5) already bounds how many top-level aggregations any request can
   *     declare, which bounds `metrics.length` to the same ceiling before this field exists.
   */
  metrics?: Array<{
    agg: string;
    value: number | null;
    value_as_string?: string;
    /**
     * Set when the aggregation that produced `value` is a `cardinality` — the ONLY supported metric
     * type whose result is an estimate rather than a count. OpenSearch computes distinct counts with
     * HyperLogLog++: exact up to `precision_threshold` (guardrails.ts raises every cardinality agg to
     * the maximum the engine accepts), an approximation above it.
     *
     * Carried as a field on the metric itself rather than as prose, so the caveat cannot be
     * separated from the number it qualifies (the same reason `metrics` exists at all — see this
     * interface's doc comment). Item 5 made metric aggregations answerable for the first time, so
     * without this flag "how many distinct hosts" would be the one NEW confidently-exact-looking
     * answer shipped by an issue whose whole purpose is removing confidently-wrong ones.
     */
    approximate?: true;
  }>;
}

/**
 * Metric aggregation types this digest pipeline can represent — the single source of truth both
 * `isMetricAggValue` (below) and this file's tests key off. NOT an exhaustive list of every metric
 * aggregation OpenSearch supports: `percentiles`/`stats`/`extended_stats` return a multi-value
 * object (`{values: {...}}`, `{avg, min, max, sum, count}`) that does not fit the `{value}` shape
 * `isMetricAggValue` checks for, so they are deliberately excluded here rather than silently
 * mis-handled — `search-wazuh-data.ts`'s tool description must never advertise one of those as
 * available (see this file's registry-wide sync test).
 */
export const SUPPORTED_METRIC_AGG_TYPES = [
  'cardinality',
  'avg',
  'sum',
  'min',
  'max',
  'value_count',
] as const;

/**
 * Shape predicate for a metric aggregation's response value: `{value: number | null}` with no
 * `buckets` (a bucket agg) or `hits` (a `top_hits` agg) of its own. Deliberately shape-based, not
 * keyed off the aggregation's TYPE name (which the response never carries) — every entry of
 * `SUPPORTED_METRIC_AGG_TYPES` above produces exactly this shape, and this is the one place that
 * checks it, so `bucketsToRows`' synthesized row, `extractMetricAggs`, and this file's tests all
 * agree on what "metric-shaped" means.
 */
export function isMetricAggValue(
  v: unknown,
): v is { value: number | null; value_as_string?: string } {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return false;
  }
  const record = v as Record<string, unknown>;
  const value = record.value;
  if (typeof value !== 'number' && value !== null) {
    return false;
  }
  return record.buckets === undefined && record.hits === undefined;
}

/**
 * Shape predicate for a SINGLE-BUCKET aggregation's response value — `filter`, `global`,
 * `missing`, `nested`, `sampler` all return `{doc_count: number}` with no `buckets`/`hits`/`value`
 * of their own. `bucketsToRows` already merges exactly this shape for SUB-aggregations (a
 * `filter` sub-agg's count column, e.g. get_sca_results' pass/fail counters); recognizing it at
 * the TOP level too means `aggs: {criticals: {filter: {...}}}` reports the computed count instead
 * of the pre-fix `returned: 0` — the same silent-drop class as the metric shape above, one key
 * over.
 */
export function isSingleBucketDocCount(v: unknown): v is { doc_count: number } {
  if (!v || typeof v !== 'object' || Array.isArray(v)) {
    return false;
  }
  const record = v as Record<string, unknown>;
  return (
    typeof record.doc_count === 'number' &&
    record.buckets === undefined &&
    record.hits === undefined &&
    record.value === undefined
  );
}

/**
 * Names every top-level aggregation in the response whose shape NONE of this file's extractors
 * can represent: not a bucket agg with an ARRAY of buckets (`bucketsToRows`), not a `{value}`
 * metric (`isMetricAggValue`), not a `{doc_count}` single-bucket count (`isSingleBucketDocCount`).
 * The remaining shapes — multi-value metrics (`stats`/`extended_stats`/`percentiles`/
 * `top_metrics`), OBJECT-keyed buckets (`filters` with named filters, `range`/`date_range` with
 * `keyed: true`), and a top-level `top_hits` — are reachable through the search_wazuh_data escape
 * hatch today (guardrails.ts's `checkAggs` restricts aggregation FIELDS and SIZES, never TYPES),
 * and used to serialize as a bare `returned: 0`: a silent lie about a query OpenSearch fully
 * answered. `buildDigest` turns this list into an explicit hint instead, so an unrepresentable
 * shape degrades to a disclosed gap the model can react to (rerun with a supported shape), never
 * to a fabricated "no data".
 */
function findUnrepresentableAggs(result: unknown): string[] {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return [];
  }
  const unrepresentable: string[] = [];
  for (const [aggKey, aggValue] of Object.entries(aggregations)) {
    if (
      Array.isArray((aggValue as { buckets?: unknown } | undefined)?.buckets)
    ) {
      continue;
    }
    if (isMetricAggValue(aggValue) || isSingleBucketDocCount(aggValue)) {
      continue;
    }
    unrepresentable.push(aggKey);
  }
  return unrepresentable;
}

const MAX_SAMPLES = 5;
/** How many rows `deriveResultColumns` scans to build its union of columns — independent of
 * `MAX_SAMPLES` (the digest's actual sample-row cap), so a wider scan doesn't change what's sent. */
const DERIVE_COLUMN_SAMPLE_SIZE = 50;
const TABLE_ROW_CAP = 500;
/** ~1500 tokens, approximated as 6000 chars (the "compact ~1-2k token hard cap"). Exported so
 * `breakdown-budget-coverage.test.ts` asserts against the REAL value instead of a hand-copied
 * mirror that would silently decouple if this cap were ever raised. */
export const DIGEST_CHAR_CAP = 6000;
/** Individual string field values longer than this are truncated (capDigest) before whole sample
 * rows are dropped. Also the cap applied to the Manager `message` field and each
 * `breakdown[].key` — see `capFieldValue` below. */
const MAX_FIELD_VALUE_LENGTH = 500;
/** Hard length cap on `Digest.hint`. The hint accumulates by concatenation (this file's zero-row
 * hint + unrepresentable-aggregation note, plus executor.ts's window-recount and near-miss
 * disclosures), and `capDigest`'s drop stages deliberately never remove it — an unbounded hint
 * could therefore evict every sample row and still bust `DIGEST_CHAR_CAP`. Wide enough for all
 * current writers combined (each is one bounded sentence); anything longer is trimmed rather
 * than allowed to crowd out the data it annotates. */
const MAX_HINT_LENGTH = 1000;

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

/**
 * Rows from a plain hits-based `_search` response (`hits.hits[]._source`), with the hit's own
 * OpenSearch document `_id` merged in under the `_id` key (a sibling of `_source`'s own fields,
 * not nested inside them) so it can be surfaced the same way as any other row field. An EMPTY hits
 * array returns undefined rather than [] so aggregation-only responses (`size:0` always carries an
 * empty hits section) fall through to bucketsToRows instead of short-circuiting to a blank table.
 */
function hitsToRows(
  result: unknown,
): Array<Record<string, unknown>> | undefined {
  const hits = (result as { hits?: { hits?: unknown } } | undefined)?.hits
    ?.hits;
  if (!Array.isArray(hits) || hits.length === 0) {
    return undefined;
  }
  const rows: Array<Record<string, unknown>> = [];
  for (const hit of hits) {
    // Skip a null/non-object element rather than throwing on `._source` access — a malformed hit
    // should degrade to "one fewer row", not fail the whole tool call.
    if (!hit || typeof hit !== 'object') {
      continue;
    }
    const { _source, _id } = hit as {
      _source?: Record<string, unknown>;
      _id?: unknown;
    };
    rows.push(_id !== undefined ? { ...(_source ?? {}), _id } : _source ?? {});
  }
  return rows;
}

/**
 * Rows from an aggregation-only response (`size:0`, `aggs.<name>.buckets[]`), e.g. get_top_rules.
 * Any `top_hits` sub-aggregation's sampled `_source` is merged into the row (still nested, not
 * flattened) so a tool's tableSpec/digest columns can dot-path into it (e.g. "wazuh.rule.title").
 * A metric sub-aggregation (avg/sum/min/max/cardinality — shaped `{value: number|null}`, see
 * `isMetricAggValue`) merges as `row[subAggName] = value`. A `filter` sub-aggregation (shaped
 * `{doc_count: number}` with no `buckets`/`hits` of its own — e.g. get_sca_results'
 * passed/failed/not_applicable counters) merges as `row[subAggName] = doc_count`. A nested bucket
 * sub-aggregation (its own `{buckets:[...]}`) matches none of these shapes and is left unmerged
 * rather than breaking. Generic across any single terms-style aggregation — no per-tool
 * bucket-shaping code needed.
 *
 * Which TOP-LEVEL aggregation supplies the buckets is resolved by scanning every top-level key IN
 * ORDER for the first one whose `.buckets` is an array — not just `Object.keys(aggregations)[0]`
 * (issue #8920 item 5). The escape hatch lets the model declare more than one top-level
 * aggregation in any order, so a metric agg (`aggs: {distinct_agents: {cardinality...}, by_rule:
 * {terms...}}`) that happens to sort first must not mask a bucket agg that comes after it — the
 * defect this fixes silently reported `returned: 0`/an empty table for that exact shape, even
 * though `by_rule`'s buckets were right there in the response.
 *
 * When NO top-level aggregation has an ARRAY of buckets at all (a metric-only query, e.g. a bare
 * "how many distinct X" `cardinality` aggregation, or a bare `filter` count), a single row is
 * synthesized instead — `{ [aggName]: value }` for every metric-shaped (`isMetricAggValue`)
 * top-level aggregation and `{ [aggName]: doc_count }` for every single-bucket
 * (`isSingleBucketDocCount`) one — so `extractRows`/`buildTableSpec` carry the computed answer
 * (`returned: 1`) rather than reporting 0 rows for a query OpenSearch actually answered. The row
 * keeps the NUMERIC value even when the response carries a `value_as_string`; the human-readable
 * form travels via `Digest.metrics` (see its doc comment), which is also populated alongside the
 * bucket rows when a bucket agg IS present, so a sibling metric is never dropped either way.
 */
function bucketsToRows(
  result: unknown,
): Array<Record<string, unknown>> | undefined {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return undefined;
  }
  const aggKeys = Object.keys(aggregations);

  let buckets: unknown;
  for (const aggKey of aggKeys) {
    const candidate = (
      aggregations[aggKey] as { buckets?: unknown } | undefined
    )?.buckets;
    if (Array.isArray(candidate)) {
      buckets = candidate;
      break;
    }
  }

  if (!Array.isArray(buckets)) {
    const metricRow: Record<string, unknown> = {};
    for (const aggKey of aggKeys) {
      const aggValue = aggregations[aggKey];
      if (isMetricAggValue(aggValue)) {
        metricRow[aggKey] = aggValue.value;
      } else if (isSingleBucketDocCount(aggValue)) {
        metricRow[aggKey] = aggValue.doc_count;
      }
    }
    return Object.keys(metricRow).length > 0 ? [metricRow] : undefined;
  }

  return buckets.map(bucket => {
    const bucketRecord = bucket as Record<string, unknown>;
    const row: Record<string, unknown> = {
      key: bucketRecord.key,
      doc_count: bucketRecord.doc_count,
    };
    for (const [subAggKey, subAggValue] of Object.entries(bucketRecord)) {
      if (subAggKey === 'key' || subAggKey === 'doc_count') {
        continue;
      }
      type TopHitsShape = {
        hits?: { hits?: Array<{ _source?: Record<string, unknown> }> };
      };
      const sampleSource = (subAggValue as TopHitsShape | undefined)?.hits
        ?.hits?.[0]?._source;
      if (sampleSource) {
        Object.assign(row, sampleSource);
        continue;
      }
      if (isMetricAggValue(subAggValue)) {
        row[subAggKey] = subAggValue.value;
        continue;
      }
      if (
        subAggValue &&
        typeof subAggValue === 'object' &&
        !Array.isArray(subAggValue)
      ) {
        // `filter` sub-aggregation: a bare filtered doc count (no own buckets/hits) — see doc
        // comment above. Checked AFTER top_hits (has `hits`) and metrics (`isMetricAggValue`) so
        // neither of those shapes can fall through to here.
        const subAgg = subAggValue as {
          doc_count?: unknown;
          buckets?: unknown;
          hits?: unknown;
        };
        if (
          typeof subAgg.doc_count === 'number' &&
          subAgg.buckets === undefined &&
          subAgg.hits === undefined
        ) {
          row[subAggKey] = subAgg.doc_count;
        }
      }
    }
    return row;
  });
}

/** Every top-level agg in `result.aggregations` that is metric-shaped (`isMetricAggValue`) or a
 * single-bucket count (`isSingleBucketDocCount` — surfaced as `{agg, value: doc_count}`, the same
 * "one computed number" reading), regardless of whether the response also carries hits or a
 * bucket agg — see `Digest.metrics`'s doc comment for why this is attached unconditionally.
 * `value_as_string` is carried when present so a min/max on a date field ships its ISO form, not
 * only epoch millis. */
function extractMetricAggs(
  result: unknown,
  requestBody?: Record<string, unknown>,
): Digest['metrics'] {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return undefined;
  }
  // A metric response is `{value: N}` for EVERY metric type, so the response alone cannot say
  // whether a number is a count or an estimate — only the REQUEST names the aggregation type. That
  // is why the request body is read here rather than inferring from the value.
  const requestAggs = requestBody?.aggs as
    | Record<string, Record<string, unknown>>
    | undefined;
  const isCardinality = (aggKey: string): boolean =>
    requestAggs?.[aggKey] !== undefined && 'cardinality' in requestAggs[aggKey];
  const metrics: NonNullable<Digest['metrics']> = [];
  for (const [aggKey, aggValue] of Object.entries(aggregations)) {
    if (isMetricAggValue(aggValue)) {
      const valueAsString = (aggValue as { value_as_string?: unknown })
        .value_as_string;
      metrics.push({
        agg: aggKey,
        value: aggValue.value,
        ...(typeof valueAsString === 'string'
          ? { value_as_string: valueAsString }
          : {}),
        ...(isCardinality(aggKey) ? { approximate: true as const } : {}),
      });
    } else if (isSingleBucketDocCount(aggValue)) {
      metrics.push({ agg: aggKey, value: aggValue.doc_count });
    }
  }
  return metrics.length > 0 ? metrics : undefined;
}

/** Rows from a Wazuh Manager API response. The common shape is a list under
 * `data.affected_items` (every read tool + the agent-action tools). A few endpoints answer with a
 * single non-list object instead — notably `PUT /logtest`, whose decoded/matched result is under
 * `data.output` — so when there is no `affected_items` array we fall back to wrapping `data.output`
 * (else `data` itself) as one row, letting a `deriveColumns` tool render it. This fallback only
 * fires for responses lacking `affected_items`, so every list-shaped tool is unaffected.
 *
 * Verified against a live stack and the Manager API spec: mutation endpoints' `affected_items` elements
 * are bare strings (e.g. `["001"]`), not objects — each scalar element is normalized to
 * `{item: String(x)}` here; an already-object element (every read endpoint) passes through
 * unchanged, so read-tool rows stay byte-identical. When `data.total_failed_items > 0`,
 * `data.failed_items` elements (`{error:{code,message,remediation}, id:[...]}`) are also appended
 * as one `{item: String(id), error: <error.message>}` row per id, so a partial/total failure is
 * visible in the digest/table instead of silently rendering an empty result. */
function managerToRows(
  result: unknown,
): Array<Record<string, unknown>> | undefined {
  const data = (result as { data?: Record<string, unknown> } | undefined)?.data;
  const items = data?.affected_items;
  if (Array.isArray(items)) {
    const rows: Array<Record<string, unknown>> = items.map(item =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? (item as Record<string, unknown>)
        : { item: String(item) },
    );
    const totalFailedItems = data?.total_failed_items;
    if (typeof totalFailedItems === 'number' && totalFailedItems > 0) {
      const failedItems = data?.failed_items;
      if (Array.isArray(failedItems)) {
        for (const failedItem of failedItems) {
          const failed = failedItem as
            | { error?: { message?: unknown }; id?: unknown }
            | undefined;
          const message =
            typeof failed?.error?.message === 'string'
              ? failed.error.message
              : undefined;
          const rawId = failed?.id;
          const ids = Array.isArray(rawId) ? rawId : [rawId];
          for (const id of ids) {
            rows.push({ item: String(id), error: message });
          }
        }
      }
    }
    return rows;
  }
  const output = data?.output;
  if (output && typeof output === 'object' && !Array.isArray(output)) {
    return [output as Record<string, unknown>];
  }
  return undefined;
}

interface ExtractedRows {
  rows: Array<Record<string, unknown>>;
  total?: number;
}

function extractRows(result: unknown): ExtractedRows {
  const hitsRows = hitsToRows(result);
  if (hitsRows) {
    const total = (
      result as { hits?: { total?: { value?: number } } } | undefined
    )?.hits?.total?.value;
    return { rows: hitsRows, total };
  }
  const bucketRows = bucketsToRows(result);
  if (bucketRows) {
    return { rows: bucketRows, total: bucketRows.length };
  }
  const managerRows = managerToRows(result);
  if (managerRows) {
    const total = (
      result as { data?: { total_affected_items?: number } } | undefined
    )?.data?.total_affected_items;
    return { rows: managerRows, total };
  }
  return { rows: [] };
}

/**
 * Column derivation for `deriveColumns` tools (currently only the `search_wazuh_data` escape
 * hatch — no static per-tool tableSpec exists for it, so
 * columns must be inferred from what actually came back). Priority order:
 *   1. The executed request body's `_source`, if it was a plain `string[]` — the model already
 *      told us which fields it wanted.
 *   2. For aggregation-bucket rows (`key`/`doc_count`, optionally merged `top_hits` fields, see
 *      `bucketsToRows` above): the first row's own keys, taken as-is (already the shape a bucket
 *      table wants).
 *   3. Otherwise: the union of the first `DERIVE_COLUMN_SAMPLE_SIZE` rows' flattened dot-path keys,
 *      preferring the common finding fields when present, capped at `DERIVED_COLUMN_CAP`.
 */
const DERIVED_COLUMN_CAP = 8;
// Wazuh 5.0 findings-v5 field names: the fields most worth surfacing
// first when the escape hatch returns rows without an explicit _source.
const PREFERRED_DERIVED_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'wazuh.rule.title',
  'wazuh.rule.level',
  'wazuh.rule.id',
];

/** Dot-path keys of a row's own (nested-object) fields; arrays and scalars are leaves. */
function flattenKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      keys.push(...flattenKeys(nested, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function deriveResultColumns(
  rows: Array<Record<string, unknown>>,
  requestBody: Record<string, unknown> | undefined,
): string[] {
  // Synthesized metric row (`bucketsToRows`' metric-only fallback): its keys are the request's
  // own top-level aggregation NAMES, not document fields, so neither `_source` (priority 1 below,
  // which would project the row to `{}` — a "returned: 1" sample carrying nothing) nor a flattened
  // field scan applies. Detected exactly: one row whose every key is a declared top-level agg
  // name — a hits/manager row can never satisfy that, since its keys are document fields/_id.
  if (rows.length === 1 && requestBody) {
    const declaredAggs = (requestBody.aggs ?? requestBody.aggregations) as
      | Record<string, unknown>
      | undefined;
    const rowKeys = Object.keys(rows[0]);
    if (
      declaredAggs &&
      rowKeys.length > 0 &&
      rowKeys.every(key => key in declaredAggs)
    ) {
      return rowKeys.slice(0, DERIVED_COLUMN_CAP);
    }
  }

  const source = requestBody?._source;
  if (
    Array.isArray(source) &&
    source.every(entry => typeof entry === 'string')
  ) {
    return (source as string[]).slice(0, DERIVED_COLUMN_CAP);
  }

  if (rows.length === 0) {
    return [];
  }

  if ('key' in rows[0] && 'doc_count' in rows[0]) {
    return Object.keys(rows[0]).slice(0, DERIVED_COLUMN_CAP);
  }

  const sample = rows.slice(0, DERIVE_COLUMN_SAMPLE_SIZE);
  const columns: string[] = [];
  for (const preferred of PREFERRED_DERIVED_COLUMNS) {
    if (sample.some(row => getByPath(row, preferred) !== undefined)) {
      columns.push(preferred);
    }
  }
  outer: for (const row of sample) {
    for (const key of flattenKeys(row)) {
      if (columns.length >= DERIVED_COLUMN_CAP) {
        break outer;
      }
      if (!columns.includes(key)) {
        columns.push(key);
      }
    }
  }
  return columns.slice(0, DERIVED_COLUMN_CAP);
}

/** Last path segment, capitalized (e.g. "wazuh.rule.title" -> "Title"); falls back to the
 * full path when two derived columns share a last segment (e.g. two differently-nested "id"s). */
function deriveColumnLabel(path: string, allPaths: string[]): string {
  const lastSegment = path.split('.').pop() ?? path;
  const label = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  const isDuplicate = allPaths.some(
    other =>
      other !== path && (other.split('.').pop() ?? other) === lastSegment,
  );
  return isDuplicate ? path : label;
}

/**
 * Maps normalized rows through a tool's table columns, capped at 500 rows. Static tools
 * (the default) use their declared `tableSpec.columns` — this branch is untouched by the
 * `deriveColumns` addition below, so their output is byte-identical to before it existed.
 */
export function buildTableSpec(
  result: unknown,
  def: ToolDefinition,
  requestBody?: Record<string, unknown>,
): TableSpec {
  const { rows } = extractRows(result);
  const capped = rows.slice(0, TABLE_ROW_CAP);

  if (def.deriveColumns) {
    const columnPaths = deriveResultColumns(rows, requestBody);
    const tableRows = capped.map(row => {
      const out: Record<string, unknown> = {};
      for (const path of columnPaths) {
        out[path] = getByPath(row, path);
      }
      return out;
    });
    return {
      columns: columnPaths.map(path => ({
        id: path,
        label: deriveColumnLabel(path, columnPaths),
      })),
      rows: tableRows,
    };
  }

  const severityColumn = def.tableSpec.columns.find(
    column => column.severity,
  )?.field;
  const rowFields = def.tableSpec.rowFields ?? [];

  const tableRows = capped.map(row => {
    const out: Record<string, unknown> = {};
    for (const column of def.tableSpec.columns) {
      out[column.field] = getByPath(row, column.field);
    }
    // The investigation field set (row-only, not a visible column): unlike the loop above, an
    // absent value is skipped rather than written as `undefined` — the row must stay JSON-sparse
    // (a field only costs bytes/appears in the expander when the underlying document actually has
    // it), not padded with nulls for every finding that never populated e.g. data.srcip.
    for (const field of rowFields) {
      const value = getByPath(row, field);
      if (value !== undefined) {
        out[field] = value;
      }
    }
    return out;
  });

  return {
    columns: def.tableSpec.columns.map(column => ({
      id: column.field,
      label: column.label,
    })),
    rows: tableRows,
    ...(severityColumn ? { severityColumn } : {}),
  };
}

/**
 * The search_wazuh_data escape hatch allows a query with more than one top-level aggregation
 * (a typed catalog tool's builder never produces more than one); iterating every aggregation key
 * — not just the first — keeps a second+ agg's buckets from vanishing from the digest silently.
 * With a single top-level agg (every typed tool, and most escape-hatch queries) each entry is
 * `{key, count}`, unchanged from before; with more than one, each entry also carries `agg` (the
 * aggregation's name) so the model can tell which aggregation a count belongs to — and so
 * privacy.ts's `applyFieldPolicy` can resolve each bucket key against the RIGHT aggregation's
 * field policy rather than only the first's. The rendered `table` event (buildTableSpec) still
 * only reflects the first BUCKET aggregation (`bucketsToRows`'s scan, since #8920 item 5 — a
 * metric agg ahead of it in key order is skipped over rather than masking it) — documented as a
 * known limitation in search_wazuh_data.ts's tool description — so this is a digest-only
 * improvement.
 */
function buildBreakdown(
  result: unknown,
): Array<{ key: string; count: number; agg?: string }> | undefined {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return undefined;
  }
  const aggKeys = Object.keys(aggregations);
  const multipleAggs = aggKeys.length > 1;
  const breakdown: Array<{ key: string; count: number; agg?: string }> = [];
  for (const aggKey of aggKeys) {
    const buckets = (aggregations[aggKey] as { buckets?: unknown } | undefined)
      ?.buckets;
    if (!Array.isArray(buckets)) {
      continue;
    }
    for (const bucket of buckets) {
      const bucketRecord = bucket as Record<string, unknown>;
      breakdown.push({
        key: String(bucketRecord.key),
        count: Number(bucketRecord.doc_count ?? 0),
        ...(multipleAggs ? { agg: aggKey } : {}),
      });
    }
  }
  return breakdown.length > 0 ? breakdown : undefined;
}

/** `term`/`terms`/`match`/`match_phrase`/`range` filter clauses whose value's own keys ARE field
 * paths — the same shape field-validation.ts's `FIELD_KEYED_CLAUSE_KEYS` walks for the same
 * reason, kept as a separate (smaller) list here: this one only names WHICH filters produced a
 * zero-row result for the hint below, it does not validate anything. */
const NAMED_FILTER_CLAUSE_KEYS = new Set([
  'term',
  'terms',
  'match',
  'match_phrase',
  'range',
]);

/** The field name of one `query.bool.filter[]` entry, when this function can attribute it with
 * certainty; `undefined` for a shape it doesn't recognize (e.g. a nested `bool`) — that entry
 * still counts toward the >=2 threshold in `buildZeroRowHint` below, it just isn't named. */
function describeFilterClause(clause: unknown): string | undefined {
  if (!clause || typeof clause !== 'object') {
    return undefined;
  }
  const record = clause as Record<string, unknown>;
  if (record.exists && typeof record.exists === 'object') {
    const field = (record.exists as { field?: unknown }).field;
    return typeof field === 'string' ? field : undefined;
  }
  const clauseKey = Object.keys(record)[0];
  if (!clauseKey || !NAMED_FILTER_CLAUSE_KEYS.has(clauseKey)) {
    return undefined;
  }
  const value = record[clauseKey];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return Object.keys(value)[0];
}

const MIN_FILTERS_FOR_ZERO_ROW_HINT = 2;

/**
 * Mechanical zero-row hint (issue: field-name validation's companion — one catches a wrong field
 * name before the query runs, this catches an over-narrow filter on a field that DOES exist,
 * after the fact). Fires only at `returned === 0` and 2+ top-level `query.bool.filter` clauses;
 * a single-filter 0-row result is ordinary and gets no hint (no noise on a legitimately narrow,
 * correct query). `requestBody` is only ever passed for the Indexer path (see `buildDigest`'s call
 * sites in executor.ts) — Manager responses have no DSL filters to name, so this is a no-op there.
 *
 * POST_FILTER-AWARE (#8935 item I2): a `post_filter` narrows the HITS — and `hits.total` — AFTER
 * every aggregation is computed, so a 0 total through a post_filter is NOT evidence the query
 * matched nothing, and the wrong-field/over-narrow wording below would blame the query's own
 * filter clauses while the aggregations sit in the same digest holding the real, population-true
 * answer (get_sca_checks's fragment `search` is the shipping caller: an exact-keyword field
 * legitimately matches 0 rows for a mid-word fragment while the include-scoped enumeration
 * answers the question). That case gets its own hint instead, naming the real mechanism — keyed
 * on the response's OWN post-filtered `hits.total` (passed in as `hitsTotal`), not on
 * `counts.total`: when the aggregations DO carry buckets, `bucketsToRows` turns them into the
 * digest's rows and `counts.total` becomes the bucket count, so only the raw hits total still
 * shows that the post_filter passed nothing.
 */
function buildZeroRowHint(
  requestBody: Record<string, unknown> | undefined,
  returned: number,
  hitsTotal: number | undefined,
): string | undefined {
  const postFilter = requestBody?.post_filter;
  if (
    postFilter &&
    typeof postFilter === 'object' &&
    (returned === 0 || hitsTotal === 0)
  ) {
    return (
      "This request's post_filter passed 0 rows — it narrows the returned hits AFTER every " +
      'aggregation is computed, and an exact/prefix search that matches nothing does exactly ' +
      'this. The aggregations (and the breakdown built from them) cover the full query-matched ' +
      'set and remain population-true: answer enumeration/count questions from the breakdown. ' +
      'If the breakdown is empty too, the search subject matched no values at all. Do not ' +
      "blame the query's own filters for the empty page."
    );
  }
  if (returned !== 0) {
    return undefined;
  }
  const filters = (
    requestBody?.query as { bool?: { filter?: unknown } } | undefined
  )?.bool?.filter;
  if (
    !Array.isArray(filters) ||
    filters.length < MIN_FILTERS_FOR_ZERO_ROW_HINT
  ) {
    return undefined;
  }
  const names = filters
    .map(describeFilterClause)
    .filter((name): name is string => !!name);
  const filterDescription =
    names.length > 0 ? names.join(', ') : `${filters.length} filter clauses`;
  return (
    `0 rows. Filters applied: ${filterDescription}. A wrong field name or an over-narrow filter ` +
    'produces this same result.'
  );
}

/** How many buckets `buildSyntheticBreakdown` keeps per dimension — same token-bloat reasoning as
 * `buildBreakdown`'s real-aggregation buckets (~40 tokens for a handful of {key,count} pairs).
 * Exported so `catalog/common.ts`'s `FINDING_BREAKDOWN_AGGS` can size the REAL `terms` aggregation
 * it attaches to every finding-hits tool's request identically — the token cost of a breakdown
 * must not change depending on which path (real vs. synthetic) happens to serve a given call.
 *
 * This is the SIDE-DISCLOSURE budget (a breakdown attached alongside a hits-shaped answer, e.g.
 * "which agents fired this rule" grouped onto a finding search) — it deliberately stays small.
 * `ANSWER_BUCKET_CAP` below is the larger budget for when the breakdown itself IS the answer (an
 * enumeration question, "list every failed check"). */
export const BREAKDOWN_BUCKET_CAP = 5;

/**
 * REQUEST-side `terms` size for an aggregation that IS the answer (issue #8935): the size a
 * catalog tool gives an enumeration aggregation ("name every matching check") when it does not
 * derive one from a caller `limit` via `clampAggLimit`. Exported for the same reason
 * `BREAKDOWN_BUCKET_CAP` is (catalog request sizing must reference the constant, not restate the
 * number — the #8894 drift class). 50 realistic ~45-char keys serialize to ~3,300 chars, so an
 * answer aggregation this size is carried essentially whole by the digest's char-budgeted carry
 * below (`BREAKDOWN_CHAR_BUDGET`); anything the carry cannot fit is disclosed, never dropped.
 *
 * This constant does NOT cap what the digest carries. The digest-side carry is char-budgeted
 * (`capBreakdownCarry` below), not count-capped: a flat count cap would trim a 100-bucket
 * short-key enumeration (e.g. rule ids, ~27 chars/entry, ~2,700 chars total) that demonstrably
 * fits — cutting by a number when the information fits is exactly the class this issue exists to
 * remove. Does not change `MAX_SAMPLES` (5) or `MAX_AGG_SIZE` (100).
 */
export const ANSWER_BUCKET_CAP = 50;

/**
 * DIGEST-side carry budget for `breakdown`, in serialized chars, across ALL top-level
 * aggregations combined — half of `DIGEST_CHAR_CAP` (6,000), leaving the other half for counts,
 * columns, notes and the `MAX_SAMPLES` sample rows (5 SCA sample rows serialize to roughly 500
 * chars). `capBreakdownCarry` fills each aggregation's fair share of this budget with buckets IN
 * RESPONSE ORDER and discloses whatever did not fit; it never re-ranks. A char budget rather than
 * a bucket count, in both directions deliberately (issue #8935 integration review):
 *  - short keys fit MORE buckets: a 100-bucket rule-id enumeration (~2,700 chars) is carried
 *    whole, where a flat 50-bucket cap would have trimmed information that fits;
 *  - the budget is GLOBAL: guardrails allows up to `MAX_TOP_LEVEL_AGGS` (5) top-level
 *    aggregations, and 5 × a per-agg cap of 50 long-key entries (~21,500 chars) would have blown
 *    `DIGEST_CHAR_CAP` and left `capDigest`'s silent pop loop to delete whole trailing
 *    aggregations behind a note claiming otherwise. Under this budget the carry can never exceed
 *    ~`BREAKDOWN_CHAR_BUDGET` chars (plus the `BREAKDOWN_BUCKET_CAP`-entry per-agg floor, see
 *    `capBreakdownCarry`), so `capDigest`'s breakdown pop is a true last resort again.
 */
export const BREAKDOWN_CHAR_BUDGET = 3000;

/**
 * Synthesizes a `breakdown` from EVERY row the tool call returned (not just the `MAX_SAMPLES`
 * slice `samples` draws from) for the "aggregative QUESTION, non-aggregative QUERY" gap: a
 * finding-hits typed tool ("which agents are affected", "which rules fired most") only ever runs
 * a plain hits search, so `buildBreakdown` above (which reads `result.aggregations`) never fires
 * for it — the model was left to hand-count `samples`, which are the newest
 * `MAX_SAMPLES` rows of a timestamp-descending sort and therefore miss any entity whose only
 * matching rows are older. Grouping over ALL rows (already in memory, bounded by the tool's own
 * request `size`) removes that sort bias entirely, at a fixed, small token cost. Tagged
 * `agg: dimension` — the dimension's own field path, not a real OpenSearch aggregation name — so
 * executor.ts can pass privacy.ts's `applyFieldPolicy` an identity map for these dimensions and
 * have the exact same bucket-scrubbing logic apply as for a real aggregation's breakdown.
 *
 * Also returns, per dimension, how many DISTINCT VALUES beyond the top `BREAKDOWN_BUCKET_CAP` were
 * cut and the summed row count they represent (`hiddenPerDimension`) — issue #8935's silent-bind
 * fix: on the base, when a dimension has more than `BREAKDOWN_BUCKET_CAP` distinct values, the
 * top-5 cut silently drops the rest with no `sum_other_doc_count` equivalent to disclose it —
 * unlike a real terms aggregation, which always carries one. That holds on BOTH page shapes: over
 * an untruncated page the counts are population-exact yet the key list is still a cut, and over a
 * truncated page the page-scope note alone says nothing about values cut WITHIN the returned rows.
 * The caller (`buildDigest`) discloses both — the untruncated case through the same
 * `breakdownNote` wording a real aggregation's bucket-list truncation gets
 * (`buildBucketTruncationNote`), the page-scoped case through
 * `buildSyntheticHiddenValuesSentence` appended to the page-scope note — rather than leaving
 * either silent because it happens to arise from a JS `Map`, not an OpenSearch response.
 */
function buildSyntheticBreakdown(
  rows: Array<Record<string, unknown>>,
  dimensions: string[],
):
  | {
      breakdown: Array<{ key: string; count: number; agg: string }>;
      hiddenPerDimension: Array<{
        agg: string;
        hiddenCount: number;
        hiddenSum: number;
      }>;
    }
  | undefined {
  const breakdown: Array<{ key: string; count: number; agg: string }> = [];
  const hiddenPerDimension: Array<{
    agg: string;
    hiddenCount: number;
    hiddenSum: number;
  }> = [];
  for (const dimension of dimensions) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = getByPath(row, dimension);
      if (typeof value !== 'string' || value.length === 0) {
        continue;
      }
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const sortedEntries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const topBuckets = sortedEntries.slice(0, BREAKDOWN_BUCKET_CAP);
    for (const [key, count] of topBuckets) {
      breakdown.push({ key, count, agg: dimension });
    }
    const hiddenEntries = sortedEntries.slice(BREAKDOWN_BUCKET_CAP);
    if (hiddenEntries.length > 0) {
      hiddenPerDimension.push({
        agg: dimension,
        hiddenCount: hiddenEntries.length,
        hiddenSum: hiddenEntries.reduce((sum, [, count]) => sum + count, 0),
      });
    }
  }
  return breakdown.length > 0 ? { breakdown, hiddenPerDimension } : undefined;
}

/**
 * Hidden-distinct-values disclosure for a PAGE-SCOPED synthetic breakdown (issue #8935 item 1,
 * integration review — this is the COMMON branch of the silent bind, since a synthetic breakdown
 * mostly exists because the page IS truncated): `buildBreakdownNote` already labels the breakdown
 * page-only, but on the base nothing disclosed that the returned page ITSELF held more distinct
 * values per dimension than the `BREAKDOWN_BUCKET_CAP` keys listed. Deliberately does NOT open
 * with `buildBucketTruncationNote`'s "counts are exact" claim — counts here are page-scoped, and
 * the sums are of RETURNED rows (one page), so they are stated as exactly that.
 */
function buildSyntheticHiddenValuesSentence(
  hidden: Array<{ agg: string; hiddenCount: number; hiddenSum: number }>,
  multiDimension: boolean,
): string {
  const figure = ({
    hiddenCount,
    hiddenSum,
  }: {
    hiddenCount: number;
    hiddenSum: number;
  }): string => `${hiddenCount} more distinct values on ${hiddenSum} rows`;
  const remainder = multiDimension
    ? hidden.map(entry => `${entry.agg}: ${figure(entry)}`).join(', ')
    : figure(hidden[0]);
  return (
    `Even within the returned rows, only the top ${BREAKDOWN_BUCKET_CAP} values per dimension ` +
    `are listed — the page holds more (${remainder}), so the listed keys are not the full set ` +
    'even for this page.'
  );
}

/** One-sentence caveat attached whenever `samples` is a strict subset of the returned rows: the
 * sample is always the newest end of whatever sort the underlying query ran (see `MAX_SAMPLES`'s
 * own doc comment), never a random or representative cut — so an entity absent from the sample is
 * only "not in this preview", never "not in the data". Independent of the `breakdown` synthesis
 * above: it fires for ANY tool whose result was sample-truncated, `breakdownDimensions` opt-in or
 * not, at the fixed, modest cost of one sentence.
 *
 * The instruction to fall back on `breakdown` is only truthful when `breakdown` is itself
 * population-true — telling the model to "trust the breakdown" while `breakdownNote` (see its doc
 * comment on `Digest`) simultaneously warns that the very same breakdown is page-scoped would hand
 * it two contradictory instructions. `breakdownIsPopulationTrue` (true whenever a breakdown exists
 * AND no `breakdownNote` was attached to it) selects between three variants: trust the breakdown,
 * distrust it (it shares the same page-scoping this note already warns about), or don't mention it
 * at all (no breakdown was produced, e.g. a tool with no `breakdownDimensions` opt-in).
 */
function buildSamplesNote(
  returned: number,
  sampleCount: number,
  hasBreakdown: boolean,
  breakdownIsPopulationTrue: boolean,
): string | undefined {
  if (returned <= sampleCount) {
    return undefined;
  }
  const preamble =
    `Showing ${sampleCount} of ${returned} matching rows, drawn from the newest end of the ` +
    'query order — not a representative sample.';
  if (!hasBreakdown) {
    return (
      `${preamble} Use counts, not an absence from these rows, to decide what the full result ` +
      'set contains.'
    );
  }
  if (breakdownIsPopulationTrue) {
    return (
      `${preamble} Use counts/breakdown, not an absence from these rows, to decide what the ` +
      'full result set contains.'
    );
  }
  return (
    `${preamble} The breakdown below is ALSO scoped to only these returned rows (see its own ` +
    'note) — use counts, not an absence from either, to decide what the full result set contains.'
  );
}

/** One-sentence caveat for a `breakdown` synthesized from the returned page rather than a real
 * aggregation over the full matched set — see `Digest.breakdownNote`'s doc comment for why this is
 * a hard requirement (#8870's validation-gate update): a page-scoped breakdown presented without
 * this caveat is worse than no breakdown at all, because the model treats it as authoritative for
 * entities it never saw. */
function buildBreakdownNote(
  total: number | undefined,
  returned: number,
): string {
  const totalDescription = typeof total === 'number' ? `all ${total}` : 'all';
  return (
    `This breakdown covers only the ${returned} returned rows, not ${totalDescription} matching ` +
    'rows — do not present it as the full distribution.'
  );
}

/**
 * `sum_other_doc_count` PER top-level bucket aggregation, for every aggregation whose bucket list
 * OpenSearch truncated by `size`. Non-terms bucket aggs (date_histogram etc.) lack the field and
 * are skipped.
 *
 * Deliberately NOT summed across aggregations. `buildBreakdown` emits buckets from EVERY top-level
 * agg (tagging each with `agg` when there is more than one), so each DIMENSION has its own
 * truncated key set and the remainders are not addable. Summing produced a number with no
 * referent: on a finding-hits call over this lab's own data — 918 matched rows, an agent dimension
 * truncating ~20 and a rule-title dimension truncating ~908 (772 distinct titles) — the summed
 * note claimed "~928 additional rows" for a 918-row result.
 */
function perAggOtherDocCounts(
  result: unknown,
): Array<{ agg: string; other: number }> {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return [];
  }
  const truncated: Array<{ agg: string; other: number }> = [];
  for (const [aggKey, aggValue] of Object.entries(aggregations)) {
    const other = (aggValue as { sum_other_doc_count?: unknown } | undefined)
      ?.sum_other_doc_count;
    if (typeof other === 'number' && other > 0) {
      truncated.push({ agg: aggKey, other });
    }
  }
  return truncated;
}

/**
 * The response's sole top-level aggregation NAME, when there is exactly one. `buildBreakdown` only
 * tags each entry with `agg` when the response carries MORE than one top-level aggregation (see its
 * doc comment) — an untagged (single-aggregation) breakdown therefore has no per-entry name to key
 * a merge off of, but there is never any ambiguity about which real aggregation it came from: with
 * exactly one top-level key, every breakdown entry can only have come from it. Returns `undefined`
 * for zero or 2+ top-level keys (the 2+ case is exactly when entries ARE already tagged, so callers
 * never need this fallback there).
 */
function soleAggKey(result: unknown): string | undefined {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return undefined;
  }
  const keys = Object.keys(aggregations);
  return keys.length === 1 ? keys[0] : undefined;
}

/**
 * CHAR-BUDGETED carry of a REAL breakdown (issue #8935 item 1): fills each top-level
 * aggregation's fair share of `BREAKDOWN_CHAR_BUDGET` (grouped by `entry.agg`; an untagged
 * single-aggregation breakdown is one group with the whole budget) with buckets IN RESPONSE
 * ORDER, so an enumeration-sized aggregation (`get_sca_results`' up-to-`MAX_AGG_SIZE` `policies`
 * agg, a model-authored `search_wazuh_data` enumeration) reaches the model as completely as the
 * budget allows instead of riding the char-cap `capDigest` would otherwise silently pop it
 * against. Buckets that do not fit are never dropped un-disclosed — their KEY COUNT and summed
 * `doc_count` are returned in `trimmed` for `buildDigest` to fold into the same `breakdownNote` a
 * request-side `sum_other_doc_count` already produces (see `mergeTruncation` below).
 *
 * RESPONSE ORDER, deliberately, with the ordering disclosed rather than assumed (integration
 * review of the first cut of this fix): a default `terms` aggregation returns buckets
 * count-descending, but `buildBreakdown` carries buckets from ANY top-level agg with a `buckets`
 * array — a `date_histogram` is key-ascending (oldest first), and the escape hatch can set an
 * explicit `terms` `order` — and this function has no request in hand to tell those apart. It
 * therefore keeps the FIRST entries (a size cut, not a re-ranking) and `buildBucketTruncationNote`
 * says exactly that, instead of claiming "top N by count" for a list that may be nothing of the
 * sort.
 *
 * Every group always carries at least `BREAKDOWN_BUCKET_CAP` entries regardless of its share —
 * a side-disclosure-sized breakdown (5 buckets) must never shrink below what the base shipped.
 * With `MAX_TOP_LEVEL_AGGS` (5) groups that floor is 25 entries; only keys approaching
 * `MAX_FIELD_VALUE_LENGTH` could push the floor itself past the budget, and `capDigest` still
 * backstops that (disclosed as its known residual). A no-op (no `trimmed` entries) for every
 * breakdown that fits its share — every side-disclosure breakdown in the codebase does.
 */
function capBreakdownCarry(
  breakdown: Array<{ key: string; count: number; agg?: string }>,
): {
  carried: Array<{ key: string; count: number; agg?: string }>;
  trimmed: Array<{ agg: string; hiddenCount: number; hiddenSum: number }>;
} {
  const groups = new Map<
    string,
    Array<{ key: string; count: number; agg?: string }>
  >();
  const groupOrder: string[] = [];
  for (const entry of breakdown) {
    const groupKey = entry.agg ?? '';
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
      groupOrder.push(groupKey);
    }
    groups.get(groupKey)!.push(entry);
  }
  const share = Math.floor(BREAKDOWN_CHAR_BUDGET / groups.size);
  const carried: Array<{ key: string; count: number; agg?: string }> = [];
  const trimmed: Array<{
    agg: string;
    hiddenCount: number;
    hiddenSum: number;
  }> = [];
  for (const groupKey of groupOrder) {
    const entries = groups.get(groupKey)!;
    let usedChars = 0;
    let kept = 0;
    for (const entry of entries) {
      // +1 for the JSON array comma — the same unit the budget is stated in.
      const cost = JSON.stringify(entry).length + 1;
      if (kept >= BREAKDOWN_BUCKET_CAP && usedChars + cost > share) {
        break;
      }
      carried.push(entry);
      usedChars += cost;
      kept++;
    }
    const hidden = entries.slice(kept);
    if (hidden.length > 0) {
      trimmed.push({
        agg: groupKey,
        hiddenCount: hidden.length,
        hiddenSum: hidden.reduce((sum, entry) => sum + entry.count, 0),
      });
    }
  }
  return { carried, trimmed };
}

/**
 * Merges the REQUEST-side truncation (`perAggOtherDocCounts`, OpenSearch's own
 * `sum_other_doc_count`) with the DIGEST-side carry trim (`capBreakdownCarry`, `ANSWER_BUCKET_CAP`)
 * into one per-aggregation `other` figure, so a single `breakdownNote` discloses the full uncounted
 * remainder regardless of which layer did the cutting — the model must never see only one half of a
 * two-stage trim. Keyed by the real top-level aggregation NAME in both inputs: `perAggOtherDocCounts`
 * already reports that name; a `capBreakdownCarry` trim group is tagged with the same name only when
 * `buildBreakdown` saw more than one top-level aggregation (its tagging rule) — for the untagged
 * single-aggregation case, `soleAgg` supplies the name instead (see `soleAggKey`'s doc comment for
 * why that resolution is always unambiguous there).
 */
function mergeTruncation(
  requestSideOther: Array<{ agg: string; other: number }>,
  digestSideTrim: Array<{
    agg: string;
    hiddenCount: number;
    hiddenSum: number;
  }>,
  soleAgg: string | undefined,
): { merged: TruncatedAggFigure[]; digestTrimmed: boolean } {
  const byAgg = new Map<
    string,
    { other: number; hiddenKeys: number; requestSide: boolean }
  >();
  const order: string[] = [];
  const add = (
    agg: string,
    other: number,
    hiddenKeys: number,
    requestSide: boolean,
  ): void => {
    if (!byAgg.has(agg)) {
      order.push(agg);
      byAgg.set(agg, { other: 0, hiddenKeys: 0, requestSide: false });
    }
    const entry = byAgg.get(agg)!;
    entry.other += other;
    entry.hiddenKeys += hiddenKeys;
    entry.requestSide = entry.requestSide || requestSide;
  };
  for (const { agg, other } of requestSideOther) {
    // OpenSearch's `sum_other_doc_count` reports the MATCH remainder only — it never says how
    // many distinct keys it covers, so the request side contributes 0 known hidden keys and
    // marks the figure as a lower bound (`requestSide`).
    add(agg, other, 0, true);
  }
  let digestTrimmed = false;
  for (const { agg, hiddenCount, hiddenSum } of digestSideTrim) {
    digestTrimmed = true;
    add(agg || soleAgg || '(breakdown)', hiddenSum, hiddenCount, false);
  }
  return {
    merged: order.map(agg => {
      const { other, hiddenKeys, requestSide } = byAgg.get(agg)!;
      return {
        agg,
        other,
        // An enumeration answer needs the hidden KEY count, not only the hidden match sum (a
        // model counting policies must be able to say "50 of 63 listed"). Exact when only the
        // digest trimmed; a lower bound whenever the request side also cut keys it never counted.
        ...(hiddenKeys > 0
          ? { hiddenKeys, hiddenKeysAreLowerBound: requestSide }
          : {}),
      };
    }),
    digestTrimmed,
  };
}

/** One truncated aggregation's disclosure figures — see `mergeTruncation` above for how the two
 * trim layers fold into it and `buildBucketTruncationNote` below for how it is worded. */
interface TruncatedAggFigure {
  agg: string;
  other: number;
  hiddenKeys?: number;
  hiddenKeysAreLowerBound?: boolean;
}

/**
 * The one true sentence about WHICH buckets a digest-side carry trim kept (see
 * `capBreakdownCarry`'s "RESPONSE ORDER" paragraph): the digest keeps the first entries of each
 * trimmed aggregation as the response ordered them. Claiming "top N by count" here was the first
 * cut of this fix, and it is FALSE for every non-count-ordered aggregation reachable through the
 * escape hatch (a `date_histogram` trimmed this way keeps the OLDEST buckets; an explicit
 * `order: {_count: 'asc'}` keeps the RAREST) — a confidently-wrong disclosure is the exact class
 * this issue exists to remove, so the sentence states the mechanism and lets the model judge the
 * ordering from the aggregation it asked for.
 */
const CARRY_TRIM_SENTENCE =
  ' The listed buckets are the FIRST ones of each trimmed aggregation, in the order the response ' +
  'returned them (count-descending only for a default terms aggregation) — a size-budget cut, ' +
  'not a re-ranking.';

/**
 * Caveat for a `breakdown` whose bucket LIST is truncated — either OpenSearch's own
 * `sum_other_doc_count` (a request-side `size` truncation) or this digest's own `capBreakdownCarry`
 * (a char-budget carry trim), or both, already merged into one per-agg figure by `mergeTruncation`
 * — see `Digest.breakdownNote`'s doc comment, case 2. Counts stay exact; the key set is what must
 * not be read as complete.
 * Builds `Digest.coverage` (see its doc comment). Deliberately assembled from what the response
 * ALREADY carries -- no extra aggregation, no second query:
 *  - a REAL aggregation is population-true by construction, so its counts cover `total` documents;
 *  - `sum_other_doc_count === 0` proves the bucket list is the complete distinct set;
 *  - `samples.length` vs `total` is the row-sample ratio.
 * A SYNTHETIC breakdown (grouped from the returned page, see `buildSyntheticBreakdown`) is NOT
 * population-true when the page is truncated, so it never claims to be.
 */
function buildCoverageNote(args: {
  total: number | undefined;
  returned: number;
  sampleCount: number;
  hasRealBreakdown: boolean;
  bucketListComplete: boolean;
  listedBuckets: number;
  syntheticPageScoped: boolean;
}): string | undefined {
  const parts: string[] = [];
  const scope =
    typeof args.total === 'number'
      ? `all ${args.total} matching rows`
      : undefined;
  if (args.hasRealBreakdown && scope) {
    parts.push(
      `counts and the breakdown are computed over ${scope}, not over the sample`,
    );
    parts.push(
      args.bucketListComplete
        ? `the breakdown lists all ${args.listedBuckets} distinct value(s)`
        : `the breakdown lists the top ${args.listedBuckets} value(s) only`,
    );
  } else if (args.syntheticPageScoped) {
    // Grouped from the returned page, which is smaller than the matched set: say so plainly rather
    // than let a page-scoped distribution read as the population.
    parts.push(
      `the breakdown is grouped from the ${
        args.returned
      } returned row(s) only, not from ${scope ?? 'the full matched set'}`,
    );
  } else if (scope) {
    parts.push(`counts are computed over ${scope}`);
  }
  if (args.sampleCount > 0 && typeof args.total === 'number') {
    parts.push(
      args.sampleCount >= args.total
        ? `the ${args.sampleCount} row(s) in "samples" are the complete set`
        : `the ${args.sampleCount} row(s) in "samples" are a sample of those ${args.total}`,
    );
  }
  return parts.length > 0 ? `Coverage: ${parts.join('; ')}.` : undefined;
}

/**
 * Caveat for a REAL breakdown whose bucket LIST is truncated (`sum_other_doc_count` > 0) — see
 * `Digest.breakdownNote`'s doc comment, case 2. Counts stay exact; the key set is what must not be
 * read as complete.
 *
 * Named per dimension (matching `breakdown[].agg`) so a multi-dimension breakdown attributes each
 * remainder to the dimension it belongs to. Worded as further MATCHES, never as additional ROWS:
 * on a multi-valued keyword field — `wazuh.rule.mitre.technique.id` and `wazuh.rule.tags` are
 * arrays — the remainder can be the SAME documents counted again under other keys, so a row count
 * would be false even for a single aggregation. When the hidden KEY count is known (a digest-side
 * trim counted exactly what it cut) it is stated too — an enumeration answer needs "50 of 63 keys
 * listed", which a bare match sum cannot supply and which the model would otherwise misread the
 * match sum as.
 *
 * `trimSentence` is the caller-supplied sentence describing WHICH keys the digest itself kept —
 * `CARRY_TRIM_SENTENCE` for a real breakdown (response order, honestly), or the synthetic
 * builder's top-by-count sentence (provably true there: `buildSyntheticBreakdown` sorts by count
 * itself). Absent when only the request side truncated (the digest kept everything it was given).
 */
function buildBucketTruncationNote(
  truncatedAggs: TruncatedAggFigure[],
  breakdownIsMultiDimension: boolean,
  trimSentence?: string,
): string {
  const figure = ({
    other,
    hiddenKeys,
    hiddenKeysAreLowerBound,
  }: TruncatedAggFigure): string =>
    hiddenKeys
      ? `${other} matches across ${
          hiddenKeysAreLowerBound ? 'at least ' : ''
        }${hiddenKeys} keys`
      : String(other);
  const remainder = breakdownIsMultiDimension
    ? truncatedAggs.map(entry => `${entry.agg}: ${figure(entry)}`).join(', ')
    : figure(truncatedAggs[0]);
  return (
    'Per-bucket counts are exact, but the bucket list is incomplete — further matches fall under ' +
    `keys not listed (${remainder}).${
      trimSentence ?? ''
    } On a multi-valued field those may be ` +
    'the same rows counted under other keys, so do not add them to the row total; do not present ' +
    'the listed keys as the complete set of values.'
  );
}

/**
 * PRIVACY SEAM: the field-level pseudonymizer
 * (server/tools/privacy.ts's `applyFieldPolicy`) wraps this function's output, not its inside.
 * server/tools/executor.ts calls `buildDigest` then, immediately before serializing the result as
 * `toolResultContent`, threads it through `applyFieldPolicy` + `capDigest` (below) when privacy
 * mode is active — every tool's output still passes through that one chokepoint regardless of
 * which catalog module produced it, it just lives one layer up so this function (and the `Digest`
 * shape it returns) stays privacy-agnostic and byte-identical when privacy mode is off.
 */
export function buildDigest(
  toolName: string,
  result: unknown,
  def: ToolDefinition,
  requestBody?: Record<string, unknown>,
): Digest {
  const { rows, total } = extractRows(result);
  const returned = rows.length;
  const truncated = typeof total === 'number' ? total > returned : false;

  const sampleColumns = def.deriveColumns
    ? deriveResultColumns(rows, requestBody)
    : def.digest.sampleColumns;

  const samples = rows.slice(0, MAX_SAMPLES).map(row => {
    const sample: Record<string, unknown> = {};
    for (const column of sampleColumns) {
      const value = getByPath(row, column);
      if (value !== undefined) {
        sample[column] = value;
      }
    }
    return sample;
  });

  // `buildBreakdown` only ever fires when the response itself carries `aggregations` — real
  // aggregations are ALWAYS population-true (OpenSearch computes them over every matched doc
  // regardless of `size`/limit), so they take priority whenever present and need no page-only
  // caveat. When there is no real aggregation, but this tool opted into `breakdownDimensions` (the
  // finding-hits tools) and there are more rows than the sample can show, synthesize an equivalent
  // breakdown from every RETURNED row instead — the "aggregative QUESTION, non-aggregative QUERY"
  // case (see `buildSyntheticBreakdown`'s doc comment). That synthetic breakdown is exact only when
  // `returned === total` (grouping every returned row already covers the whole matched set); when
  // `truncated` (returned < total), it can only ever see the page the tool happened to return —
  // the exact defect #8870's validation-gate update caught live — so it gets `breakdownNote`
  // labeling it as page-only instead of being presented as the population.
  const realBreakdown = buildBreakdown(result);
  let breakdown = realBreakdown;
  let breakdownNote: string | undefined;
  // Distinguishes the two breakdownNote cases (see its doc comment): only the SYNTHETIC
  // page-scope case makes the breakdown untrustworthy as a whole — a real breakdown with a
  // truncated key set still has exact, population-true counts, so `buildSamplesNote` must not
  // tell the model to distrust it.
  let syntheticPageScoped = false;
  // `sum_other_doc_count === 0` on every terms agg means no key was left out -- that is what makes
  // "all N distinct values" a fact rather than a guess (see buildCoverageNote).
  let bucketListComplete = false;
  if (
    !realBreakdown &&
    def.digest.breakdownDimensions &&
    returned > MAX_SAMPLES
  ) {
    const synthetic = buildSyntheticBreakdown(
      rows,
      def.digest.breakdownDimensions,
    );
    breakdown = synthetic?.breakdown;
    if (breakdown) {
      const hidden = synthetic!.hiddenPerDimension;
      const multiDimension = def.digest.breakdownDimensions.length > 1;
      // Page-scoped whenever the page is truncated OR `total` is UNKNOWN: with nothing to compare
      // `returned` against, `returned === total` cannot be established, and asserting exact
      // population counts over a population of unknown size is the confidently-wrong substitution
      // this issue exists to prevent (integration review of this fix's first cut, which claimed
      // exactness whenever `truncated` happened to be false — including the undefined-total case).
      if (truncated || typeof total !== 'number') {
        breakdownNote = buildBreakdownNote(total, returned);
        syntheticPageScoped = true;
        // #8935's silent-bind fix, PAGE-SCOPED branch — the COMMON one (a synthetic breakdown
        // exists precisely because the page usually is truncated): the page-scope sentence above
        // says rows outside the page are unseen, but on the base nothing said that distinct
        // values INSIDE the returned page were also cut at BREAKDOWN_BUCKET_CAP. Both binds must
        // be disclosed, or "which vendors ship packages here" silently loses every vendor beyond
        // the top 5 of the very rows the model was given.
        if (hidden.length > 0) {
          breakdownNote += ` ${buildSyntheticHiddenValuesSentence(
            hidden,
            multiDimension,
          )}`;
        }
      } else if (hidden.length > 0) {
        // #8935's silent-bind fix, UNTRUNCATED branch: `returned === total` (established against
        // a real numeric total), so every count is exact over the full matched set — but the KEY
        // LIST per dimension is still a top-`BREAKDOWN_BUCKET_CAP` cut of the distinct values
        // seen, exactly the same "exact counts, top-N key set" situation a real aggregation's
        // `sum_other_doc_count` already discloses. `breakdownIsPopulationTrue` in
        // `buildSamplesNote` below stays true for this case (only `syntheticPageScoped` flips it)
        // — grouping every returned row IS grouping the population; only which KEYS are shown is
        // truncated. The top-by-count sentence is provably true here (buildSyntheticBreakdown
        // sorts by count itself), unlike the real-breakdown carry where ordering is the
        // response's own — see CARRY_TRIM_SENTENCE.
        breakdownNote = buildBucketTruncationNote(
          hidden.map(({ agg, hiddenCount, hiddenSum }) => ({
            agg,
            other: hiddenSum,
            hiddenKeys: hiddenCount,
          })),
          multiDimension,
          ` The listed keys are the top ${BREAKDOWN_BUCKET_CAP} by count.`,
        );
      }
    }
  } else if (realBreakdown) {
    // #8935 item 1: carry an enumeration-sized real breakdown up to its char budget instead of
    // shipping it whole (base behavior — see `buildBreakdown`, which is itself unbounded) and
    // relying on `capDigest`'s char-cap pop to silently degrade it. Any bucket this carry hides
    // is folded into the same disclosure a request-side `sum_other_doc_count` produces, so the
    // model never sees an unmarked gap regardless of which layer did the trimming.
    const { carried, trimmed } = capBreakdownCarry(realBreakdown);
    breakdown = carried;
    const requestSideOther = perAggOtherDocCounts(result);
    const { merged, digestTrimmed } = mergeTruncation(
      requestSideOther,
      trimmed,
      soleAggKey(result),
    );
    // The bucket list is the COMPLETE distinct set only when NEITHER layer cut it: not the request
    // side (`sum_other_doc_count`) and not this digest's own char-budgeted carry. `merged` is
    // already the union of both, which is why it — and not `perAggOtherDocCounts` alone — decides
    // this. Getting that wrong would make `Digest.coverage` claim "lists all N distinct values" on a
    // list the carry had silently shortened: a NEW confidently-false statement, in the issue whose
    // whole purpose is removing them.
    bucketListComplete = merged.length === 0;
    if (merged.length > 0) {
      // `buildBreakdown` tags rows with `agg` only when the response carried more than one
      // aggregation, so that same flag decides whether the note has to name its dimensions.
      breakdownNote = buildBucketTruncationNote(
        merged,
        realBreakdown.some(row => row.agg !== undefined),
        digestTrimmed ? CARRY_TRIM_SENTENCE : undefined,
      );
    }
  }
  // The raw post-filtered hits total, straight off the response — deliberately NOT `total` from
  // extractRows, which the bucket-rows path rewrites to the bucket count (see buildZeroRowHint's
  // POST_FILTER-AWARE paragraph).
  const rawHitsTotal = (
    result as { hits?: { total?: { value?: number } } } | undefined
  )?.hits?.total?.value;
  const hint = buildZeroRowHint(requestBody, returned, rawHitsTotal);
  const samplesNote = buildSamplesNote(
    returned,
    samples.length,
    !!breakdown,
    !!breakdown && !syntheticPageScoped,
  );
  // Manager responses carry a top-level `message` alongside `data` (e.g. an active-response no-op:
  // error:0, affected_items/failed_items both empty, message:"AR command was not sent to any
  // agent") — surfaced here so a silent no-op is still visible to the model. Indexer responses
  // never carry this field, so the check is a no-op for every T1 search tool.
  const message = (result as { message?: unknown } | undefined)?.message;
  // See `Digest.metrics`'s doc comment: attached UNCONDITIONALLY whenever a metric-shaped or
  // single-bucket-count top-level agg is in the response — even when `bucketsToRows`' synthesized
  // row carries the same numbers, because that row is subject to column projection and `metrics`
  // is the projection-immune carrier.
  const metrics = extractMetricAggs(result, requestBody);
  const coverage = buildCoverageNote({
    total,
    returned,
    sampleCount: samples.length,
    hasRealBreakdown: !!realBreakdown,
    bucketListComplete,
    listedBuckets: realBreakdown ? realBreakdown.length : 0,
    syntheticPageScoped,
  });
  // Terminal class guard (#8920 item 5): an aggregation OpenSearch computed but no extractor in
  // this file can represent must never be silently absent — a bare `returned: 0` (or a digest
  // missing a sibling agg's answer) reads as "no data" for a query that WAS answered. Named
  // explicitly in the hint so the model can rerun with a supported shape instead of fabricating
  // an empty result. See `findUnrepresentableAggs` for which shapes land here and why they are
  // reachable (checkAggs never restricts aggregation types).
  const unrepresentableAggs = findUnrepresentableAggs(result);
  const unrepresentableNote =
    unrepresentableAggs.length > 0
      ? `Aggregation(s) ${unrepresentableAggs.join(
          ', ',
        )} returned a shape this digest cannot ` +
        'represent (multi-value metrics such as stats/percentiles, keyed buckets, or top_hits ' +
        'at the top level); their results are NOT included above — do not read their absence ' +
        'as 0. Re-query with terms buckets, a single-value metric, or a filter count instead.'
      : undefined;
  const combinedHint = [hint, unrepresentableNote]
    .filter((part): part is string => !!part)
    .join(' ');
  const digest: Digest = {
    tool: toolName,
    counts: { total, returned, truncated },
    ...(combinedHint ? { hint: combinedHint } : {}),
    ...(breakdown ? { breakdown } : {}),
    ...(breakdownNote ? { breakdownNote } : {}),
    samples,
    ...(samplesNote ? { samplesNote } : {}),
    columns: def.deriveColumns
      ? sampleColumns
      : def.tableSpec.columns.map(column => column.field),
    ...(typeof message === 'string' && message.length > 0 ? { message } : {}),
    ...(metrics ? { metrics } : {}),
    ...(coverage ? { coverage } : {}),
  };

  return capDigest(digest);
}

/** Strips ASCII control characters (code points 0-31, and 127/DEL) — a tool-derived string field
 * (a Manager `message`, an aggregation `breakdown[].key` built from indexed data) can carry these
 * verbatim from attacker-influenced source data; stripping them defends against escape-sequence
 * or other control-byte smuggling into the model's context. Filters by code point rather than a
 * regex control-character class (which `no-control-regex` flags, for good reason elsewhere: those
 * escapes usually indicate a typo) — this is the one place that legitimately wants exactly that
 * range. */
function stripControlChars(value: string): string {
  let result = '';
  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0;
    if (codePoint >= 0x20 && codePoint !== 0x7f) {
      result += char;
    }
  }
  return result;
}

/** Control-char strip + length cap for the Manager `message` field and `breakdown[].key` —
 * unlike `samples`, neither was bounded at all before this; both can originate in free text the
 * Manager API returns or an aggregation bucket key built from indexed (attacker-influenced)
 * data. */
function capFieldValue(value: string): string {
  const stripped = stripControlChars(value);
  return stripped.length > MAX_FIELD_VALUE_LENGTH
    ? `${stripped.slice(0, MAX_FIELD_VALUE_LENGTH)}…`
    : stripped;
}

/** Truncates any sample field's string value longer than `MAX_FIELD_VALUE_LENGTH`, mutating each
 * sample row in place. Runs unconditionally (not gated on the overall char cap) as a cheap
 * preprocessing pass before capDigest's row-drop fallback below, since one oversized field (e.g. a
 * raw log line) shouldn't cost an entire row when trimming just that field is enough. Also caps
 * (length + control-char strip, via `capFieldValue`) the two other previously-unbounded string
 * fields: the Manager `message` and each `breakdown[].key`. */
function truncateLongFieldValues(digest: Digest): void {
  for (const sample of digest.samples) {
    for (const key of Object.keys(sample)) {
      const value = sample[key];
      if (typeof value === 'string' && value.length > MAX_FIELD_VALUE_LENGTH) {
        sample[key] = `${value.slice(0, MAX_FIELD_VALUE_LENGTH)}…`;
      }
    }
  }
  if (digest.message !== undefined) {
    digest.message = capFieldValue(digest.message);
  }
  if (digest.hint !== undefined && digest.hint.length > MAX_HINT_LENGTH) {
    digest.hint = `${digest.hint.slice(0, MAX_HINT_LENGTH)}…`;
  }
  if (digest.breakdown) {
    for (const entry of digest.breakdown) {
      entry.key = capFieldValue(entry.key);
    }
  }
}

/**
 * Hard cap enforcement: truncate oversized field values first, then drop samples, then trim
 * the breakdown, then — last resort — drop the Manager `message` entirely, mutating `digest` in
 * place and returning it. JSON.stringify already omits an undefined `breakdown`/`message`, so no
 * cap iterations run when either is absent.
 *
 * `message` is dropped whole rather than trimmed char-by-char: `truncateLongFieldValues` above
 * already caps it at `MAX_FIELD_VALUE_LENGTH`, so on its own it can only ever push an
 * already-near-the-cap digest over the edge, never dominate it — by the time samples and
 * breakdown are both fully exhausted and the digest is STILL oversized, dropping the one
 * remaining small field is enough (there is nothing left to partially trim).
 *
 * Exported (not just an inline step of `buildDigest` above) so server/tools/executor.ts can re-run
 * it after server/tools/privacy.ts's `applyFieldPolicy` substitutes pseudonyms for real values:
 * pseudonym tokens ("HOST_3") are usually shorter than the real value they replace but are not
 * guaranteed to be (e.g. a 3-character username becoming "USER_1"), so the cap this function
 * enforces — measured against the REAL values below — is not automatically still respected after
 * that substitution. digest.ts itself stays privacy-agnostic (see privacy.ts's `extractAggFields`
 * comment for why); it only needs to expose this cap step for the caller to re-apply.
 *
 * KNOWN RESIDUAL (issue #8935 item 1): this loop's drops are UNDISCLOSED — a sample or breakdown
 * entry popped here is not folded into `samplesNote`/`breakdownNote`, both already worded before
 * this function runs. `capBreakdownCarry`'s char-budgeted carry (applied earlier, in
 * `buildDigest`) makes this residual rare by construction rather than eliminating it: the whole
 * carried breakdown is bounded at ~`BREAKDOWN_CHAR_BUDGET` (half of `DIGEST_CHAR_CAP`, global
 * across ALL top-level aggregations — never the 5 × per-agg-cap overrun the first cut of this fix
 * allowed), so this loop only pops breakdown entries when the per-agg
 * `BREAKDOWN_BUCKET_CAP`-entry floor is hit by keys running unusually long (approaching
 * `MAX_FIELD_VALUE_LENGTH`) or when another oversized field (a long sample column, a large
 * `hint`) has already consumed most of the budget — no longer the routine path an untrimmed
 * 100-bucket breakdown used to take on the base. Left as a residual rather than re-worded here
 * because doing so would mean recomputing `samplesNote`/`breakdownNote` inside this loop against
 * whatever got popped, which this function deliberately does not have the context for (it runs
 * post-privacy-substitution too, see above, where the original row/bucket counts are no longer at
 * hand). A future fix would need to move disclosure to run AFTER this cap, not before it.
 */
export function capDigest(digest: Digest): Digest {
  truncateLongFieldValues(digest);
  while (
    JSON.stringify(digest).length > DIGEST_CHAR_CAP &&
    digest.samples.length > 0
  ) {
    digest.samples.pop();
  }
  while (
    JSON.stringify(digest).length > DIGEST_CHAR_CAP &&
    digest.breakdown &&
    digest.breakdown.length > 0
  ) {
    digest.breakdown.pop();
  }
  if (
    JSON.stringify(digest).length > DIGEST_CHAR_CAP &&
    digest.message !== undefined
  ) {
    delete digest.message;
  }
  return digest;
}
