/**
 * Pure helpers for the "Open in Discover" link (result-table.tsx / discover-link.tsx): a minimal
 * rison encoder and a time-range extractor over an Indexer query DSL clause. Kept dependency-free
 * (no EUI/React) and under common/ specifically so unit tests (colocated as discover-url.test.ts)
 * can import it directly — tsconfig.test.json only includes common/** and server/**, not
 * public/**.
 */

/** Fallback window when the query DSL carries no recognizable time-range clause. */
export interface TimeRange {
  from: string;
  to: string;
}

export const DEFAULT_TIME_RANGE: TimeRange = { from: 'now-24h', to: 'now' };

// Time fields a tool's DSL range clause might use, to reconstruct the Discover time window:
// @timestamp (Wazuh 5.0 findings-v5/events-v5), state.modified_at (the wazuh-states-* families),
// and legacy `timestamp` (4.14). extractTimeRange scans for whichever is present.
const TIMESTAMP_FIELDS = ['@timestamp', 'state.modified_at', 'timestamp'];

/**
 * Rison-encodes a single string value: always single-quoted (never emitted bare, even when the
 * string would be a valid bare rison token) — this keeps the encoder minimal at the cost of
 * slightly more verbose output than a full rison implementation would produce; quoted strings are
 * valid rison anywhere a bare one is, so this never changes what a decoder reads back. `!` (the
 * rison escape character) is escaped first so a literal `!'` in the input can't be produced by
 * escaping the quote before the bang.
 */
function risonString(value: string): string {
  const escaped = value.replace(/!/g, '!!').replace(/'/g, "!'");
  return `'${escaped}'`;
}

/** A bare (unquoted) rison identifier is only valid for plain alphanumeric/underscore keys; any
 * other key falls back to the same always-quoted string form as a string value. Object *keys*
 * still use this bare form when possible so the fixed literal skeleton in `buildDiscoverUrl` below
 * (hand-written with bare keys) stays consistent with whatever this encoder would produce for the
 * same key — only string *values* are unconditionally quoted. */
function risonKey(key: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : risonString(key);
}

/**
 * Minimal rison encoder covering exactly the value shapes an OpenSearch query DSL clause (and the
 * small literal app-state objects built around it) can contain: strings, finite numbers, booleans,
 * null, plain objects, and arrays. Anything else (undefined, function, etc.) is encoded as its
 * string form, which should never happen for JSON-shaped input.
 */
export function risonEncode(value: unknown): string {
  if (value === null) {
    return '!n';
  }
  if (value === true) {
    return '!t';
  }
  if (value === false) {
    return '!f';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    return risonString(value);
  }
  if (Array.isArray(value)) {
    return `!(${value.map(entry => risonEncode(entry)).join(',')})`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return `(${entries
      .map(([key, entryValue]) => `${risonKey(key)}:${risonEncode(entryValue)}`)
      .join(',')})`;
  }
  return risonString(String(value));
}

/** Reads a `{range: {<field>: {gte, lte}}}` clause for one of the recognized timestamp fields,
 * returning the recognized bound(s) (missing gte/lte falls back to the default window's edge). */
function rangeFromClause(clause: unknown): TimeRange | undefined {
  if (!clause || typeof clause !== 'object') {
    return undefined;
  }
  const range = (clause as Record<string, unknown>).range;
  if (!range || typeof range !== 'object') {
    return undefined;
  }
  for (const field of TIMESTAMP_FIELDS) {
    const fieldRange = (range as Record<string, unknown>)[field];
    if (fieldRange && typeof fieldRange === 'object') {
      // All three bound spellings OpenSearch accepts are read (gte/lte, the exclusive gt/lt,
      // and the legacy from/to): a model-authored range in any of them is a real window, and
      // failing to read it silently replaced the promised window with the 24h default (issue
      // #8920 item 9's time-range half).
      const bounds = fieldRange as Record<string, unknown>;
      const lower = bounds.gte ?? bounds.gt ?? bounds.from;
      const upper = bounds.lte ?? bounds.lt ?? bounds.to;
      if (lower !== undefined || upper !== undefined) {
        return {
          from: lower !== undefined ? String(lower) : DEFAULT_TIME_RANGE.from,
          to: upper !== undefined ? String(upper) : DEFAULT_TIME_RANGE.to,
        };
      }
    }
  }
  return undefined;
}

/** Recursive companion to `extractTimeRange`: walks `bool.filter`/`bool.must` whether each is a
 * single clause OBJECT or an array of them (both are legal DSL — the single-object form was
 * previously unread, silently defaulting the window), and one `bool` level deeper. `should`/
 * `must_not` are deliberately not walked: an optional or negated range does not bound what the
 * query matches. */
function findTimeRangeClause(clause: unknown): TimeRange | undefined {
  const direct = rangeFromClause(clause);
  if (direct) {
    return direct;
  }
  if (!clause || typeof clause !== 'object' || Array.isArray(clause)) {
    return undefined;
  }
  const bool = (clause as Record<string, unknown>).bool as
    | Record<string, unknown>
    | undefined;
  if (!bool || typeof bool !== 'object') {
    return undefined;
  }
  for (const key of ['filter', 'must']) {
    const clauses = bool[key];
    const list = Array.isArray(clauses)
      ? clauses
      : clauses !== undefined
      ? [clauses]
      : [];
    for (const entry of list) {
      const found = findTimeRangeClause(entry);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/** Whether `dsl` carries a readable timestamp range at all — i.e. whether `extractTimeRange`
 * below would return the model's own window rather than silently substituting the 24h default.
 * Exported for suggest-discover-query.ts, whose disclosure must SAY when the window was
 * defaulted (issue #8920 item 9). */
export function hasExplicitTimeRange(
  dsl: Record<string, unknown> | undefined,
): boolean {
  return !!dsl && findTimeRangeClause(dsl) !== undefined;
}

/**
 * Walks an executed Indexer query DSL clause (TableSpec.discover.dsl — the `query` object itself,
 * not a `{query: ...}` wrapper; see common/types.ts) looking for a range filter on `timestamp` or
 * `@timestamp`, checked at the top level and inside `bool.filter`/`bool.must`. Falls back to the
 * last-24-hours default when none is found (or `dsl` is absent), so the Discover link always opens
 * to a well-defined window.
 */
export function extractTimeRange(
  dsl: Record<string, unknown> | undefined,
): TimeRange {
  if (!dsl) {
    return DEFAULT_TIME_RANGE;
  }
  return findTimeRangeClause(dsl) ?? DEFAULT_TIME_RANGE;
}

/**
 * Builds the OSD 2.x data-explorer Discover URL (rison-encoded hash state) for one result table's
 * backing index/query. The static parts of the app-state skeleton (columns, sort, filter meta,
 * etc.) are written as literal rison rather than run through `risonEncode` so they stay byte-stable
 * and match the real OSD data-explorer URL shape (bare tokens like `discover`/`view` etc); only the
 * genuinely dynamic pieces — the index-pattern id, the time bounds, and the query DSL itself — are
 * rison-encoded, which quotes them (valid rison, just not the bare form a hand-written literal
 * would use for a simple token).
 *
 * `discoverAppUrl` must already be basePath-prepended (core.http.basePath.prepend(
 * '/app/data-explorer/discover')) and carry no hash/query of its own. The whole string is passed
 * through `encodeURI` at the end (NOT `encodeURIComponent`, which would over-escape and break the
 * rison punctuation) so the only characters actually percent-escaped are the ones illegal in a URL
 * (e.g. spaces inside a quoted alias string).
 */
export function buildDiscoverUrl(params: {
  discoverAppUrl: string;
  indexPatternId: string;
  dsl: Record<string, unknown>;
  timeRange: TimeRange;
}): string {
  const { discoverAppUrl, indexPatternId, dsl, timeRange } = params;
  // `encodeURI` at the end leaves `&`, `#`, `+` and `%` untouched (they are legal URL characters),
  // but a literal one INSIDE a dynamic rison string value would be read as a hash-param separator
  // (or fragment/space) by the URL parser before the rison decoder ever runs — percent-escape them
  // in the dynamic segments only; the static skeleton is known not to contain any.
  const uriSafe = (rison: string): string =>
    rison
      .replace(/%/g, '%25')
      .replace(/&/g, '%26')
      .replace(/#/g, '%23')
      .replace(/\+/g, '%2B');
  const patternRison = uriSafe(risonEncode(indexPatternId));
  const fromRison = uriSafe(risonEncode(timeRange.from));
  const toRison = uriSafe(risonEncode(timeRange.to));
  const dslRison = uriSafe(risonEncode(dsl));

  const hash =
    `#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:${patternRison},view:discover))` +
    `&_q=(filters:!((meta:(alias:'AI Assistant query',disabled:!f,index:${patternRison},key:query,negate:!f,type:custom,value:''),query:${dslRison})),query:(language:kuery,query:''))` +
    `&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:${fromRison},to:${toRison}))`;

  return encodeURI(`${discoverAppUrl}${hash}`);
}
