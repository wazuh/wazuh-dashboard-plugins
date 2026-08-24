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

/**
 * The lower edge a range clause that states no lower bound resolves to: the beginning of time, NOT
 * `DEFAULT_TIME_RANGE.from`.
 *
 * Issue #9008 review, finding 1: an `lte`-only clause ("findings before 2020-01-01") whose missing
 * lower bound was filled from `DEFAULT_TIME_RANGE.from` produced `from: 'now-24h', to:
 * '2020-01-01T00:00:00.000Z'` — a window whose start is AFTER its end, which Discover shows zero
 * rows for while the answer above it showed rows. A missing lower bound means "from the beginning",
 * so it fills from here instead; a missing UPPER bound still fills from `DEFAULT_TIME_RANGE.to`,
 * because a clause stating only `gte` really does mean "up to now".
 *
 * An absolute ISO instant rather than date-math (`now-99y`): OSD resolves date-math in `_g` against
 * the browser's clock, and a bound this far out is not expressible as a fixed shorthand anyway.
 */
export const UNBOUNDED_TIME_RANGE: TimeRange = {
  from: '1970-01-01T00:00:00.000Z',
  to: 'now',
};

// Time fields a tool's DSL range clause might use, to reconstruct the Discover time window:
// @timestamp (Wazuh 5.0 findings-v5/events-v5), state.modified_at (the wazuh-states-* families),
// and legacy `timestamp` (4.14). extractTimeRange scans for whichever is present.
const TIMESTAMP_FIELDS = ['@timestamp', 'state.modified_at', 'timestamp'];

/** Millisecond span of the date-math units `resolveBoundMs` recognizes, plus a year bucket used
 * only by tool-call-label.ts's duration formatter. Deliberately NO week/month bucket (issue #9008
 * review, minor 5): a week/month approximation would format the guardrail's exact 90-day lookback
 * cap as something other than "90d". Lives here rather than in tool-call-label.ts (`public/`) so
 * `resolveBoundMs` below — which this module itself needs, to order two bounds when intersecting
 * several range clauses — can stay isomorphic; that file imports both from here. */
export const MS_PER_UNIT = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  y: 365 * 86_400_000,
} as const;

/**
 * Resolves a date-math (`now`, `now-90d`) or ISO-8601 bound to an absolute epoch ms.
 *
 * `nowMs` is the instant `now` refers to — for a recorded query that is the FACT the server stored
 * (`TableSpec.provenance.executedAt`, the instant the query actually ran), never the render-time
 * clock: a date-math bound only means something relative to WHEN it ran, so resolving it against
 * the reader's clock would describe a window the query never ran against. When `nowMs` is
 * `undefined` (a conversation persisted before that field existed) a date-math bound is left
 * UNRESOLVED — `undefined`, never a guess — and callers fall back to the literal bound string
 * rather than a fabricated instant. An ISO-8601 bound needs no "now" reference at all and resolves
 * the same either way.
 */
export function resolveBoundMs(
  value: string,
  nowMs: number | undefined,
): number | undefined {
  if (value === 'now') {
    return nowMs;
  }
  const match = /^now-(\d+)([dhm])$/.exec(value);
  if (match) {
    return nowMs === undefined
      ? undefined
      : nowMs - Number(match[1]) * MS_PER_UNIT[match[2] as 'd' | 'h' | 'm'];
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

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

/**
 * One recognized `{range: {<field>: {gte, lte}}}` clause, as read off a DSL — the window it
 * resolves to for the "Open in Discover" link PLUS which of the two bounds the clause itself
 * actually STATED.
 *
 * Carrying both in one shape is what lets a single leaf reader serve every caller in this module
 * (issue #9008 review, cleanup 1). There used to be two near-identical readers behind two
 * near-identical recursive walks — one filling a missing bound for the link, one refusing to for
 * the provenance FACT record — and a fix applied to one copy but not the other would silently
 * reintroduce the requested-vs-effective inconsistency this file exists to prevent. There is now
 * one reader and one walk; the difference between the callers is what each does with
 * `statedLower`/`statedUpper`, not a second copy of the traversal.
 */
interface ReadRangeClause {
  /**
   * The clause as an openable window, with a missing side filled in. The two sides fill from
   * DIFFERENT defaults, because a one-sided clause means different things in each direction: a
   * missing UPPER bound means "up to now" (`DEFAULT_TIME_RANGE.to`), a missing LOWER bound means
   * "from the beginning" (`UNBOUNDED_TIME_RANGE.from` — see that constant for the inverted-window
   * bug filling it from `DEFAULT_TIME_RANGE.from` caused).
   */
  window: TimeRange;
  /** Whether the clause stated a lower bound (`gte`/`gt`/`from`) at all. */
  statedLower: boolean;
  /** Whether the clause stated an upper bound (`lte`/`lt`/`to`) at all. */
  statedUpper: boolean;
}

/** Reads one clause object; `undefined` when it is not a range clause on a recognized timestamp
 * field, or states neither bound. */
function readRangeClause(clause: unknown): ReadRangeClause | undefined {
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
          window: {
            from:
              lower !== undefined
                ? String(lower)
                : UNBOUNDED_TIME_RANGE.from /* see `ReadRangeClause.window` */,
            to: upper !== undefined ? String(upper) : DEFAULT_TIME_RANGE.to,
          },
          statedLower: lower !== undefined,
          statedUpper: upper !== undefined,
        };
      }
    }
  }
  return undefined;
}

/**
 * The ONE recursive DSL walk in this module: collects every recognized range clause, in the order
 * the walk reaches them. Walks `bool.filter`/`bool.must` whether each is a single clause OBJECT or
 * an array of them (both are legal DSL — the single-object form was previously unread, silently
 * defaulting the window), and follows a nested `bool` arbitrarily deep. `should`/`must_not` are
 * deliberately not walked: an optional or negated range does not bound what the query matches.
 *
 * A node that IS itself a range clause is not descended into further, so the first entry is exactly
 * the clause the previous first-match-wins implementation returned.
 */
function collectRangeClauses(clause: unknown): ReadRangeClause[] {
  const found: ReadRangeClause[] = [];
  const walk = (node: unknown): void => {
    const direct = readRangeClause(node);
    if (direct) {
      found.push(direct);
      return;
    }
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return;
    }
    const bool = (node as Record<string, unknown>).bool as
      | Record<string, unknown>
      | undefined;
    if (!bool || typeof bool !== 'object') {
      return;
    }
    for (const key of ['filter', 'must']) {
      const clauses = bool[key];
      const list = Array.isArray(clauses)
        ? clauses
        : clauses !== undefined
        ? [clauses]
        : [];
      for (const entry of list) {
        walk(entry);
      }
    }
  };
  walk(clause);
  return found;
}

/** Whether `dsl` carries a readable timestamp range at all — i.e. whether `extractTimeRange`
 * below would return the model's own window rather than silently substituting the 24h default.
 * A ONE-SIDED clause counts as explicit here, because the query really did state a window: what
 * the reader has to be told about that case is a different thing (which side was left open), and
 * `describeTimeRangeCoverage` below is what says it. Exported for suggest-discover-query.ts, whose
 * disclosure must SAY when the window was defaulted (issue #8920 item 9). */
export function hasExplicitTimeRange(
  dsl: Record<string, unknown> | undefined,
): boolean {
  return !!dsl && collectRangeClauses(dsl).length > 0;
}

/** How completely a DSL states its own time window — what the "Open in Discover" link's disclosure
 * label is driven by (discover-link.tsx):
 *  - `stated`: a clause with both bounds. The link opens exactly the window the query ran.
 *  - `openStart`/`openEnd`: a one-sided clause. The link has to fill the other side, so it says so.
 *  - `defaulted`: no clause at all, so the whole window is `DEFAULT_TIME_RANGE`. */
export type TimeRangeCoverage =
  | 'stated'
  | 'openStart'
  | 'openEnd'
  | 'defaulted';

export interface TimeRangeDisclosure {
  coverage: TimeRangeCoverage;
  /** The one bound the clause actually stated — set only for `openStart`/`openEnd`, so the label
   * can name the edge the query really did bound ("up to Jan 1, 2020"). */
  statedBound?: string;
}

/**
 * Issue #9008 review, finding 1: a one-sided range clause used to be indistinguishable from a
 * fully-stated one in the UI. `hasExplicitTimeRange` returned `true` for it (correctly — the query
 * did state a window), so the link rendered a plain "Open in Discover" while quietly opening a
 * window with one edge the query never asked for. This is the fact the label needs to disclose
 * that case, read off the SAME clause `extractTimeRange` resolves the link's window from.
 */
export function describeTimeRangeCoverage(
  dsl: Record<string, unknown> | undefined,
): TimeRangeDisclosure {
  const clause = dsl ? collectRangeClauses(dsl)[0] : undefined;
  if (!clause) {
    return { coverage: 'defaulted' };
  }
  if (!clause.statedLower) {
    return { coverage: 'openStart', statedBound: clause.window.to };
  }
  if (!clause.statedUpper) {
    return { coverage: 'openEnd', statedBound: clause.window.from };
  }
  return { coverage: 'stated' };
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
  return collectRangeClauses(dsl)[0]?.window ?? DEFAULT_TIME_RANGE;
}

/** Picks whichever of two bounds is later (`keepLater`) or earlier, for intersecting several range
 * clauses. Falls back to `first` whenever the two cannot BOTH be resolved to an absolute instant
 * (`resolveBoundMs`) — e.g. an ISO bound against date-math with no `nowMs` reference. That keeps
 * the previous first-clause-wins result for an unorderable pair rather than picking arbitrarily:
 * narrowing a window on a guess would be a worse lie than leaving it as it was. */
function pickBound(
  first: string,
  second: string,
  nowMs: number | undefined,
  keepLater: boolean,
): string {
  const firstMs = resolveBoundMs(first, nowMs);
  const secondMs = resolveBoundMs(second, nowMs);
  if (firstMs === undefined || secondMs === undefined) {
    return first;
  }
  return (keepLater ? secondMs > firstMs : secondMs < firstMs) ? second : first;
}

/**
 * `{gte, lte}` form of a DSL's effective time window — the FACT record behind
 * `TableSpec.provenance.requestedRange`/`effectiveRange` (common/types.ts), read by
 * server/tools/executor.ts. Unlike `extractTimeRange` (which always owes the Discover link an
 * openable window) this returns `undefined` rather than substituting anything the DSL did not
 * state: no recognizable clause at all, or only ONE-SIDED clauses, means no range is reported.
 * A one-sided clause is deliberately dropped here instead of being filled in — the popover would
 * otherwise state a bound as a recorded fact when the query never carried it (issue #9008 review,
 * major 5).
 *
 * When SEVERAL fully-bounded clauses are present the result is their INTERSECTION — the latest
 * lower bound and the earliest upper bound — not the first one the walk happens to reach (issue
 * #9008 review, finding 2). A query can legitimately carry more than one required `@timestamp`
 * range clause (`guardrails.ts`'s `clampLookbackWindow` doc comment says so), and since they are
 * all `bool.filter`/`bool.must` clauses the rows that came back satisfy every one of them; naming
 * only the first stated a window wider or narrower than what the query actually matched.
 *
 * `nowMs` is the instant `now`/`now-Nd` bounds are ordered against while intersecting — pass the
 * same value recorded as `provenance.executedAt`. It is only ever used to COMPARE two bounds; the
 * returned strings are always the literal bounds the DSL carried, never resolved instants.
 */
export function rangeBoundsFromDsl(
  dsl: Record<string, unknown> | undefined,
  nowMs?: number,
): { gte: string; lte: string } | undefined {
  if (!dsl) {
    return undefined;
  }
  const bounded = collectRangeClauses(dsl).filter(
    clause => clause.statedLower && clause.statedUpper,
  );
  if (bounded.length === 0) {
    return undefined;
  }
  return bounded
    .map(clause => ({ gte: clause.window.from, lte: clause.window.to }))
    .reduce((intersection, clause) => ({
      gte: pickBound(intersection.gte, clause.gte, nowMs, true),
      lte: pickBound(intersection.lte, clause.lte, nowMs, false),
    }));
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
