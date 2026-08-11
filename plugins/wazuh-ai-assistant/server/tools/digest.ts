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
   * attribute each bucket key to the right aggregation field.
   *
   * `key` is `unknown`, not `string`: a plain terms/significant_terms/cardinality bucket's key is
   * always a string (unchanged from before), but a `multi_terms` bucket's key is an ARRAY of
   * component values and a `composite` bucket's key is an OBJECT of `{sourceName: value}` pairs —
   * see `buildBreakdown` below. Forcing either through `String()` loses the per-component
   * structure privacy.ts's field-policy pass needs to scrub each component against its own field
   * (and, for `composite`, produced the literal string "[object Object]", a separate display
   * bug). digest.ts stays privacy-agnostic either way: it just stops DESTROYING the structure a
   * privacy-aware consumer needs, it does not interpret it. */
  breakdown?: Array<{ key: unknown; count: number; agg?: string }>;
  /** Set only when `breakdown` was synthesized from the RETURNED page (`buildSyntheticBreakdown`)
   * rather than a real OpenSearch aggregation over the full matched set (`buildBreakdown`), AND
   * that page is not the whole matched set (`counts.truncated`) — i.e. an entity whose rows sort
   * outside the page is invisible to `breakdown`, the exact defect #8870's validation update
   * reproduced live (limit:20 on 26 matches synthesizing 13/7 and 11/9 while the true distribution
   * is 16/8/2 and 13/13). Tells the model `breakdown` is NOT authoritative for the full result,
   * unlike `samplesNote` (which caveats `samples` only) — see `buildSamplesNote`'s own updated
   * wording for how the two combine. Omitted whenever `breakdown` is a real aggregation (always
   * population-true: OpenSearch computes `aggregations` over every matched doc regardless of
   * `size`) or a synthetic one over an untruncated result (`returned === total`, where grouping
   * every returned row already IS grouping the full population). */
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
  /** Schema hint: the column ids of the table already rendered to the user. */
  columns: string[];
  /** The Manager response's top-level `message` (e.g. "AR command was not sent to any agent"),
   * when present — some mutation endpoints report an otherwise-silent no-op only through this
   * field, with `affected_items`/`failed_items` both empty. */
  message?: string;
  /** Set only when a `ToolDefinition.resolveParams` hook (types.ts; issue #8913) inferred a
   * parameter the caller omitted rather than erroring — e.g. get_agent_inventory resolving "this
   * server"/"the host" to the one active agent when neither `agent_id` nor `agent_name` was
   * supplied, because a live run found the model does not reliably call `get_agents` first on its
   * own even when told to. Surfaced the same way `samplesNote`/`hint` are: a plain sentence the
   * model is expected to relay to the user as an explicit assumption, never to act on silently.
   * Omitted for every tool without a `resolveParams` hook, and for a `resolveParams` call that
   * needed no inference (every relevant param was already supplied). */
  assumptionNote?: string;
}

const MAX_SAMPLES = 5;
/** How many rows `deriveResultColumns` scans to build its union of columns — independent of
 * `MAX_SAMPLES` (the digest's actual sample-row cap), so a wider scan doesn't change what's sent. */
const DERIVE_COLUMN_SAMPLE_SIZE = 50;
const TABLE_ROW_CAP = 500;
/** ~1500 tokens, approximated as 6000 chars (the "compact ~1-2k token hard cap"). */
const DIGEST_CHAR_CAP = 6000;
/** Individual string field values longer than this are truncated (capDigest) before whole sample
 * rows are dropped. Also the cap applied to the Manager `message` field and each
 * `breakdown[].key` — see `capFieldValue` below. */
const MAX_FIELD_VALUE_LENGTH = 500;

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
 * A metric sub-aggregation (avg/sum/min/max/cardinality — shaped `{value: number|null}`) merges as
 * `row[subAggName] = value`. A `filter` sub-aggregation (shaped `{doc_count: number}` with no
 * `buckets`/`hits` of its own — e.g. get_sca_results' passed/failed/not_applicable counters)
 * merges as `row[subAggName] = doc_count`. A nested bucket sub-aggregation (its own
 * `{buckets:[...]}`) matches none of these shapes and is left unmerged rather than breaking.
 * Generic across any single terms-style aggregation — no per-tool bucket-shaping code needed.
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
  const firstAggKey = Object.keys(aggregations)[0];
  if (!firstAggKey) {
    return undefined;
  }
  const buckets = (
    aggregations[firstAggKey] as { buckets?: unknown } | undefined
  )?.buckets;
  if (!Array.isArray(buckets)) {
    return undefined;
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
      if (
        subAggValue &&
        typeof subAggValue === 'object' &&
        !Array.isArray(subAggValue)
      ) {
        const metricValue = (subAggValue as { value?: unknown }).value;
        if (typeof metricValue === 'number' || metricValue === null) {
          row[subAggKey] = metricValue;
          continue;
        }
        // `filter` sub-aggregation: a bare filtered doc count (no own buckets/hits) — see doc
        // comment above. Checked AFTER top_hits (has `hits`) and metrics (has `value`) so neither
        // of those shapes can fall through to here.
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

/**
 * Reads a `_search` response's `hits.total` in whichever shape it actually arrives in.
 * `guardrails.ts`'s `applySafetyValves` forces `track_total_hits: true` on every outbound
 * request, which makes the Indexer (OpenSearch, ES-compatible response shape) always return the
 * modern object form -- `{value: <exact count>, relation: 'eq'}` -- never the pre-7.x bare-number
 * form. This function accepts a bare number too anyway: it costs nothing, and it means this
 * extraction keeps working unchanged if a future call site (or a test fixture) ever hands it the
 * legacy shape directly, rather than silently reading `undefined` off a plain number's `.value`.
 * `relation` is not inspected here -- with `track_total_hits: true` it is always `'eq'` (an exact
 * count, never the capped `'gte'` a numeric `track_total_hits` can produce), so `total` below is
 * always the true match count, not a lower bound.
 */
function resolveHitsTotal(result: unknown): number | undefined {
  const total = (
    result as { hits?: { total?: number | { value?: number } } } | undefined
  )?.hits?.total;
  if (typeof total === 'number') {
    return total;
  }
  return typeof total?.value === 'number' ? total.value : undefined;
}

function extractRows(result: unknown): ExtractedRows {
  const hitsRows = hitsToRows(result);
  if (hitsRows) {
    return { rows: hitsRows, total: resolveHitsTotal(result) };
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

/** Segments whose conventional rendering is an acronym rather than a capitalized word (e.g.
 * "ip" -> "IP", not "Ip") — issue #8921's inconsistent-labels item: a derived column's label must
 * read like the hand-written labels the static-column tools use (get_vulnerabilities' "CVE"/
 * "Architecture"), not like a raw field segment with its first letter capitalized. */
const LABEL_ACRONYMS: Record<string, string> = {
  ip: 'IP',
  id: 'ID',
  os: 'OS',
  pid: 'PID',
  cve: 'CVE',
};

function capitalizeSegment(segment: string): string {
  return (
    LABEL_ACRONYMS[segment.toLowerCase()] ??
    segment.charAt(0).toUpperCase() + segment.slice(1)
  );
}

/**
 * Last path segment, capitalized (e.g. "wazuh.rule.title" -> "Title"). Issue #8921's
 * inconsistent-labels item: two derived columns sharing a last segment (e.g. get_agent_inventory's
 * `ports` kind — "source.port" and "destination.port" both end in "port") used to fall back to the
 * RAW dot-path for BOTH, so a reader saw friendly labels ("State", "Name", "Transport") sitting
 * next to un-humanized ones ("source.port", "destination.ip", "source.ip") in the same header row.
 * A collision is disambiguated with the PARENT segment instead ("Source Port"/"Destination Port"),
 * which stays a real label rather than degrading to the raw path — the raw path remains one hover
 * away via the column header's `title` tooltip (result-table.tsx), so nothing about the field's
 * real dot-path name is lost, only demoted from "always visible" to "on demand".
 */
function deriveColumnLabel(path: string, allPaths: string[]): string {
  const segments = path.split('.');
  const lastSegment = segments[segments.length - 1] ?? path;
  const isDuplicate = allPaths.some(
    other =>
      other !== path && (other.split('.').pop() ?? other) === lastSegment,
  );
  const label = capitalizeSegment(lastSegment);
  if (!isDuplicate) {
    return label;
  }
  const parentSegment =
    segments.length > 1 ? segments[segments.length - 2] : undefined;
  return parentSegment ? `${capitalizeSegment(parentSegment)} ${label}` : label;
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
 * only reflects the first aggregation — documented as a known limitation in search_wazuh_data.ts's
 * tool description — so this is a digest-only improvement.
 */
/**
 * Bucket keys arrive in three shapes: a plain string/number for terms/significant_terms/
 * cardinality (unchanged: `String()`-coerced same as always), an ARRAY for `multi_terms`, or an
 * OBJECT (`{sourceName: value}`) for `composite`. The latter two are returned AS-IS rather than
 * `String()`-coerced -- `String()` on an object produces the literal, useless "[object Object]"
 * (a display bug on its own) and, more importantly, throws away the per-component structure
 * privacy.ts's field-policy pass needs to scrub each component against its own field (see
 * `Digest.breakdown`'s doc comment). `String()` on an array already produces a readable
 * comma-joined string in JS, so that shape was never the display bug -- it is kept structural here
 * too, for the same privacy reason, not because it was broken before.
 */
function normalizeBucketKey(rawKey: unknown): unknown {
  if (rawKey !== null && typeof rawKey === 'object') {
    return rawKey;
  }
  return String(rawKey);
}

function buildBreakdown(
  result: unknown,
): Array<{ key: unknown; count: number; agg?: string }> | undefined {
  const aggregations = (
    result as { aggregations?: Record<string, unknown> } | undefined
  )?.aggregations;
  if (!aggregations) {
    return undefined;
  }
  const aggKeys = Object.keys(aggregations);
  const multipleAggs = aggKeys.length > 1;
  const breakdown: Array<{ key: unknown; count: number; agg?: string }> = [];
  for (const aggKey of aggKeys) {
    const buckets = (aggregations[aggKey] as { buckets?: unknown } | undefined)
      ?.buckets;
    if (!Array.isArray(buckets)) {
      continue;
    }
    for (const bucket of buckets) {
      const bucketRecord = bucket as Record<string, unknown>;
      breakdown.push({
        key: normalizeBucketKey(bucketRecord.key),
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
 */
function buildZeroRowHint(
  requestBody: Record<string, unknown> | undefined,
  returned: number,
): string | undefined {
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
 * must not change depending on which path (real vs. synthetic) happens to serve a given call. */
export const BREAKDOWN_BUCKET_CAP = 5;

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
 */
function buildSyntheticBreakdown(
  rows: Array<Record<string, unknown>>,
  dimensions: string[],
): Array<{ key: string; count: number; agg: string }> | undefined {
  const breakdown: Array<{ key: string; count: number; agg: string }> = [];
  for (const dimension of dimensions) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = getByPath(row, dimension);
      if (typeof value !== 'string' || value.length === 0) {
        continue;
      }
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const topBuckets = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, BREAKDOWN_BUCKET_CAP);
    for (const [key, count] of topBuckets) {
      breakdown.push({ key, count, agg: dimension });
    }
  }
  return breakdown.length > 0 ? breakdown : undefined;
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
  // Issue #8913: threaded through from executor.ts's `executeToolCall`, which is the only place
  // that knows whether a `resolveParams` hook (types.ts) inferred a parameter -- this function
  // itself never resolves anything, it just carries the note into the Digest shape unchanged.
  assumptionNote?: string,
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
  if (
    !realBreakdown &&
    def.digest.breakdownDimensions &&
    returned > MAX_SAMPLES
  ) {
    breakdown = buildSyntheticBreakdown(rows, def.digest.breakdownDimensions);
    if (breakdown && truncated) {
      breakdownNote = buildBreakdownNote(total, returned);
    }
  }
  const hint = buildZeroRowHint(requestBody, returned);
  const samplesNote = buildSamplesNote(
    returned,
    samples.length,
    !!breakdown,
    !!breakdown && !breakdownNote,
  );
  // Manager responses carry a top-level `message` alongside `data` (e.g. an active-response no-op:
  // error:0, affected_items/failed_items both empty, message:"AR command was not sent to any
  // agent") — surfaced here so a silent no-op is still visible to the model. Indexer responses
  // never carry this field, so the check is a no-op for every T1 search tool.
  const message = (result as { message?: unknown } | undefined)?.message;
  const digest: Digest = {
    tool: toolName,
    counts: { total, returned, truncated },
    ...(hint ? { hint } : {}),
    ...(breakdown ? { breakdown } : {}),
    ...(breakdownNote ? { breakdownNote } : {}),
    samples,
    ...(samplesNote ? { samplesNote } : {}),
    columns: def.deriveColumns
      ? sampleColumns
      : def.tableSpec.columns.map(column => column.field),
    ...(typeof message === 'string' && message.length > 0 ? { message } : {}),
    ...(assumptionNote ? { assumptionNote } : {}),
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

/**
 * `capFieldValue`, generalized to `breakdown[].key`'s three possible shapes (see `Digest.breakdown`
 * doc comment: `key` widened from `string` to `unknown` when this file learned about `multi_terms`
 * (array) and `composite` (object) bucket keys — a scalar `terms`/`significant_terms`/`cardinality`
 * key is still always a plain string, unchanged). Caps every STRING leaf it finds and leaves any
 * other leaf (a numeric `terms` key component, for instance) untouched; the array/object structure
 * itself is preserved either way, so this never corrupts a `multi_terms`/`composite` key's shape
 * the way naively coercing the whole key through `capFieldValue` (which expects a `string`) would.
 */
function capKeyValue(key: unknown): unknown {
  if (typeof key === 'string') {
    return capFieldValue(key);
  }
  if (Array.isArray(key)) {
    return key.map(capKeyValue);
  }
  if (key !== null && typeof key === 'object') {
    const out: Record<string, unknown> = {};
    for (const [prop, value] of Object.entries(
      key as Record<string, unknown>,
    )) {
      out[prop] = capKeyValue(value);
    }
    return out;
  }
  return key;
}

/** Truncates any sample field's string value longer than `MAX_FIELD_VALUE_LENGTH`, mutating each
 * sample row in place. Runs unconditionally (not gated on the overall char cap) as a cheap
 * preprocessing pass before capDigest's row-drop fallback below, since one oversized field (e.g. a
 * raw log line) shouldn't cost an entire row when trimming just that field is enough. Also caps
 * (length + control-char strip, via `capFieldValue`/`capKeyValue`) the two other previously-
 * unbounded string fields: the Manager `message` and each `breakdown[].key`. */
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
  if (digest.breakdown) {
    for (const entry of digest.breakdown) {
      entry.key = capKeyValue(entry.key);
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
