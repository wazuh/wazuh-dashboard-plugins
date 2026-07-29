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
  /** `agg` is set only when the executed query had more than one top-level aggregation (only the
   * search_wazuh_data escape hatch can produce that), naming which aggregation a bucket belongs
   * to — single-agg digests (every typed tool) stay byte-identical to before it existed. It also
   * lets privacy.ts's field-policy pass attribute each bucket key to the right aggregation field. */
  breakdown?: Array<{ key: string; count: number; agg?: string }>;
  samples: Array<Record<string, unknown>>;
  /** Schema hint: the column ids of the table already rendered to the user. */
  columns: string[];
  /** The Manager response's top-level `message` (e.g. "AR command was not sent to any agent"),
   * when present — some mutation endpoints report an otherwise-silent no-op only through this
   * field, with `affected_items`/`failed_items` both empty. */
  message?: string;
}

const MAX_SAMPLES = 5;
/** How many rows `deriveResultColumns` scans to build its union of columns — independent of
 * `MAX_SAMPLES` (the digest's actual sample-row cap), so a wider scan doesn't change what's sent. */
const DERIVE_COLUMN_SAMPLE_SIZE = 50;
const TABLE_ROW_CAP = 500;
/** ~1500 tokens, approximated as 6000 chars (the "compact ~1-2k token hard cap"). */
const DIGEST_CHAR_CAP = 6000;
/** Individual string field values longer than this are truncated (capDigest) before whole sample
 * rows are dropped. */
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
 * Rows from a plain hits-based `_search` response (`hits.hits[]._source`). An EMPTY hits array
 * returns undefined rather than [] so aggregation-only responses (`size:0` always carries an
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
    rows.push((hit as { _source?: Record<string, unknown> })._source ?? {});
  }
  return rows;
}

/**
 * Rows from an aggregation-only response (`size:0`, `aggs.<name>.buckets[]`), e.g. get_top_rules.
 * Any `top_hits` sub-aggregation's sampled `_source` is merged into the row (still nested, not
 * flattened) so a tool's tableSpec/digest columns can dot-path into it (e.g. "rule.description").
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
 *      preferring the common alert fields when present, capped at `DERIVED_COLUMN_CAP`.
 */
const DERIVED_COLUMN_CAP = 8;
// Wazuh 5.0 findings-v5 field names: the fields most worth surfacing
// first when the escape hatch returns rows without an explicit _source.
const PREFERRED_DERIVED_COLUMNS = [
  '@timestamp',
  'wazuh.agent.name',
  'rule.description',
  'rule.level',
  'rule.id',
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

/** Last path segment, capitalized (e.g. "rule.description" -> "Description"); falls back to the
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
    // it), not padded with nulls for every alert that never populated e.g. data.srcip.
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

  const breakdown = buildBreakdown(result);
  // Manager responses carry a top-level `message` alongside `data` (e.g. an active-response no-op:
  // error:0, affected_items/failed_items both empty, message:"AR command was not sent to any
  // agent") — surfaced here so a silent no-op is still visible to the model. Indexer responses
  // never carry this field, so the check is a no-op for every T1 search tool.
  const message = (result as { message?: unknown } | undefined)?.message;
  const digest: Digest = {
    tool: toolName,
    counts: { total, returned, truncated },
    ...(breakdown ? { breakdown } : {}),
    samples,
    columns: def.deriveColumns
      ? sampleColumns
      : def.tableSpec.columns.map(column => column.field),
    ...(typeof message === 'string' && message.length > 0 ? { message } : {}),
  };

  return capDigest(digest);
}

/** Truncates any sample field's string value longer than `MAX_FIELD_VALUE_LENGTH`, mutating each
 * sample row in place. Runs unconditionally (not gated on the overall char cap) as a cheap
 * preprocessing pass before capDigest's row-drop fallback below, since one oversized field (e.g. a
 * raw log line) shouldn't cost an entire row when trimming just that field is enough. */
function truncateLongFieldValues(digest: Digest): void {
  for (const sample of digest.samples) {
    for (const key of Object.keys(sample)) {
      const value = sample[key];
      if (typeof value === 'string' && value.length > MAX_FIELD_VALUE_LENGTH) {
        sample[key] = `${value.slice(0, MAX_FIELD_VALUE_LENGTH)}…`;
      }
    }
  }
}

/**
 * Hard cap enforcement: truncate oversized field values first, then drop samples, then trim
 * the breakdown, mutating `digest` in place and returning it. JSON.stringify already omits an
 * undefined `breakdown`, so no cap iterations run when there isn't one.
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
  return digest;
}
