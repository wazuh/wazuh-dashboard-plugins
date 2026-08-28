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
 * "The beginning of time" — the lower edge used wherever a query did not state one. TWO
 * independent defects converge on this one constant:
 *
 * 1. A ONE-SIDED clause. An `lte`-only clause ("findings before
 *    2020-01-01") whose missing lower bound was filled from `DEFAULT_TIME_RANGE.from` produced
 *    `from: 'now-24h', to: '2020-01-01T00:00:00.000Z'` — a window whose start is AFTER its end,
 *    which Discover shows zero rows for while the answer above it showed rows. A missing lower
 *    bound means "from the beginning", so `readRangeClause` fills it from here.
 * 2. A query with NO range clause at all. That is not "a last-24-hours query with
 *    the bound left implicit" — it has no time filter, so its totals cover the whole index. Opening
 *    the link on `DEFAULT_TIME_RANGE` narrowed it to a 24-hour slice of the same query, guaranteeing
 *    a smaller total than the answer above it the moment any matching document was older than a day.
 *    `resolveDiscoverTimeRange` opens that case here instead.
 *
 * An absolute ISO instant rather than date-math (`now-99y`): OSD resolves date-math in `_g` against
 * the browser's clock, and a bound that far out is not expressible as a fixed shorthand anyway.
 *
 * `DEFAULT_TIME_RANGE` survives for the two places that still legitimately mean "last 24 hours": the
 * missing UPPER edge of a one-sided clause (a query stating `gte: now-7d` and no upper bound really
 * does mean "up to now" — that direction is unchanged), and server/tools/suggest-discover-query.ts,
 * which materializes a range-less suggestion into a runnable clause and reads it for its own
 * disclosure text.
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
 * only by tool-call-label.ts's duration formatter. Deliberately NO week/month bucket: a week/month
 * approximation would format the guardrail's exact 90-day lookback
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
 *
 * Lives here, not in tool-call-label.ts (`public/`), so the evidence popover and the "Open in
 * Discover" link resolve a bound through ONE function: the popover stating "ran against Jun 1 –
 * Aug 30" while the link opened `now-90d` re-resolved against the reader's clock is exactly the
 * divergence that shared use prevents.
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
 * One recognized `{range: {<field>: {gte, lte}}}` clause, as read off a DSL — which timestamp
 * FIELD it bounds, the window it resolves to, and which of the two bounds it actually STATED.
 *
 * Carrying all of that in one shape is what lets a single leaf reader serve every caller in this
 * module. Two near-identical readers behind two near-identical recursive walks — one filling a
 * missing bound for the link, one refusing to for the provenance FACT record — would let a fix
 * applied to one copy but not the other silently reintroduce the requested-vs-effective
 * inconsistency this file exists to prevent.
 *
 * There is one reader, one walk, and one RESOLUTION: every public entry point in this file goes
 * through `effectiveRangeClause` below, so the window
 * the Discover link opens, the coverage its label discloses, and the window recorded as provenance
 * are the same computation over the same clauses. They cannot disagree by construction; what
 * differs between the callers is only what each does with `statedLower`/`statedUpper`.
 */
interface ReadRangeClause {
  /** The timestamp field this clause bounds — one of `TIMESTAMP_FIELDS`. Clauses are intersected
   * WITHIN a field and never across two; see `effectiveRangeClause`. */
  field: string;
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
      // failing to read it would silently replace the promised window with the 24h default.
      const bounds = fieldRange as Record<string, unknown>;
      const lower = bounds.gte ?? bounds.gt ?? bounds.from;
      const upper = bounds.lte ?? bounds.lt ?? bounds.to;
      if (lower !== undefined || upper !== undefined) {
        return {
          field,
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
 * an array of them (both are legal DSL — missing the single-object form would silently default
 * the window), and follows a nested `bool` arbitrarily deep. `should`/`must_not` are
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
 * The ONE window a DSL resolves to — the single source of truth every public entry point in this
 * file reads. `extractTimeRange` (what the Discover link OPENS),
 * `describeTimeRangeCoverage` (what its label DISCLOSES) and `rangeBoundsFromDsl` (what the
 * evidence popover STATES as a recorded fact) all return a view of this same result, so the link
 * and the popover cannot describe the same query differently: computing the window via
 * `clauses[0]` in one place and via intersection in another would let the two disagree the moment
 * a DSL carries two range clauses.
 *
 * TWO rules decide the result:
 *
 * 1. FIELD PARTITIONING. Clauses are intersected only WITHIN one timestamp field, never
 *    across two. A DSL bounding both `@timestamp` and `state.modified_at` describes two independent
 *    axes; taking the latest lower of one against the earliest upper of the other produces a window
 *    that exists in neither — routinely an INVERTED one, which would then be recorded as a
 *    provenance fact. The winning field is the first entry of `TIMESTAMP_FIELDS` any clause bounds,
 *    so the choice is deterministic and matches the priority `readRangeClause` already uses inside a
 *    single clause. Clauses on the other field are dropped, exactly as first-clause-wins dropped
 *    them before — this narrows nothing it cannot justify.
 *
 * 2. INTERSECTION within that field: the LATEST stated lower bound and the EARLIEST stated upper
 *    bound. Those clauses all sit in `bool.filter`/`bool.must`, so every row that came back
 *    satisfied all of them; naming only the first stated a window wider (or narrower) than what the
 *    query actually matched. Only sides a clause actually STATED take part — a bound is never
 *    invented — so two complementary one-sided clauses (`{lte: X}` plus `{gte: Y}`) together bound
 *    both edges and are reported as such, while a side no clause stated stays unstated and each
 *    caller decides what to do about it. An intersection can legitimately come out EMPTY
 *    (`gte` after `lte`) when the clauses genuinely exclude each other; that is a property of the
 *    query, not an artifact of this function, and it is reported rather than hidden.
 *
 * `nowMs` orders `now`/`now-Nd` bounds against the instant they meant — `provenance.executedAt` for
 * a recorded query. It is only ever used to COMPARE; the strings returned are always the literal
 * bounds the DSL carried.
 */
function effectiveRangeClause(
  dsl: Record<string, unknown> | undefined,
  nowMs?: number,
): ReadRangeClause | undefined {
  if (!dsl) {
    return undefined;
  }
  const clauses = collectRangeClauses(dsl);
  const field = TIMESTAMP_FIELDS.find(candidate =>
    clauses.some(clause => clause.field === candidate),
  );
  if (field === undefined) {
    return undefined;
  }
  const sameField = clauses.filter(clause => clause.field === field);
  const lowers = sameField
    .filter(clause => clause.statedLower)
    .map(clause => clause.window.from);
  const uppers = sameField
    .filter(clause => clause.statedUpper)
    .map(clause => clause.window.to);
  return {
    field,
    window: {
      from:
        lowers.length > 0
          ? lowers.reduce((left, right) => pickBound(left, right, nowMs, true))
          : UNBOUNDED_TIME_RANGE.from,
      to:
        uppers.length > 0
          ? uppers.reduce((left, right) => pickBound(left, right, nowMs, false))
          : DEFAULT_TIME_RANGE.to,
    },
    statedLower: lowers.length > 0,
    statedUpper: uppers.length > 0,
  };
}

/** Whether `dsl` carries a readable timestamp range at all — i.e. whether `extractTimeRange`
 * below would return the model's own window rather than silently substituting the 24h default.
 * A ONE-SIDED clause counts as explicit here, because the query really did state a window: what
 * the reader has to be told about that case is a different thing (which side was left open), and
 * `describeTimeRangeCoverage` below is what says it. Exported for suggest-discover-query.ts, whose
 * disclosure must SAY when the window was defaulted. */
export function hasExplicitTimeRange(
  dsl: Record<string, unknown> | undefined,
): boolean {
  return effectiveRangeClause(dsl) !== undefined;
}

/** How completely a DSL states its own time window — what the "Open in Discover" link's disclosure
 * label is driven by (discover-link.tsx). This describes only what the DSL SAID; what each case
 * then opens is `resolveDiscoverTimeRange`'s decision, and the two disagree for the last one:
 *  - `stated`: a clause with both bounds. The link opens exactly the window the query ran.
 *  - `openStart`/`openEnd`: a one-sided clause. The link has to fill the other side, so it says so.
 *  - `defaulted`: no clause at all — "the query stated no window", NOT "the 24h default applies".
 *    The link actually opens the UNBOUNDED window (all of history) for this case, precisely
 *    because `DEFAULT_TIME_RANGE` would under-count a query that had no time filter; the label
 *    reads "all time". The value keeps this name because it names the DSL fact this enum is
 *    about, and renaming it would churn every caller for no gain.
 *    `DEFAULT_TIME_RANGE` still applies for a missing UPPER bound and in
 *    server/tools/suggest-discover-query.ts. */
export type TimeRangeCoverage =
  | 'stated'
  | 'openStart'
  | 'openEnd'
  | 'defaulted';

export interface TimeRangeDisclosure {
  /** Which of the four cases the DSL's effective window (`effectiveRangeClause`) falls into. */
  coverage: TimeRangeCoverage;
  /** The one bound the clause actually stated — set only for `openStart`/`openEnd`, so the label
   * can name the edge the query really did bound ("up to Jan 1, 2020"). */
  statedBound?: string;
}

/**
 * A one-sided range clause is indistinguishable from a fully-stated one to `hasExplicitTimeRange`
 * alone: it returns `true` for it (correctly — the query did state a window), so the link would
 * render a plain "Open in Discover" while quietly opening a window with one edge the query never
 * asked for. This function supplies the fact the label needs to disclose that case, read off the
 * SAME `effectiveRangeClause` result `extractTimeRange` resolves the link's window from — so a
 * label can never describe a window other than the one its own button opens. Pass the same
 * `nowMs` (`provenance.executedAt`) the link is built with.
 */
export function describeTimeRangeCoverage(
  dsl: Record<string, unknown> | undefined,
  nowMs?: number,
): TimeRangeDisclosure {
  const clause = effectiveRangeClause(dsl, nowMs);
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
 * The window the "Open in Discover" link OPENS: `effectiveRangeClause`'s result (see it for the
 * field-partitioning and intersection rules), with any side the DSL left unstated filled in so the
 * link always has an openable window. Falls back to the last-24-hours default when the DSL carries
 * no recognizable clause at all (or is absent).
 *
 * `nowMs` must be the same reference `rangeBoundsFromDsl` was given for the same DSL —
 * `provenance.executedAt`, which discover-link.tsx passes from the spec — or a multi-clause DSL
 * could resolve its intersection one way here and another way there.
 */
export function extractTimeRange(
  dsl: Record<string, unknown> | undefined,
  nowMs?: number,
): TimeRange {
  return effectiveRangeClause(dsl, nowMs)?.window ?? DEFAULT_TIME_RANGE;
}

/**
 * `{gte, lte}` form of a DSL's effective time window — the FACT record behind
 * `TableSpec.provenance.requestedRange`/`effectiveRange` (common/types.ts), read by
 * server/tools/executor.ts.
 *
 * The same `effectiveRangeClause` result `extractTimeRange` above returns, differing ONLY in what
 * it does with a side the DSL never stated: the link owes Discover an openable window and so fills
 * it, while a FACT record has no such licence and reports nothing at all instead. So `undefined`
 * here means "the DSL did not bound both edges" — no recognizable
 * clause, or every clause it did carry left the same side open — never "the default window".
 *
 * `nowMs` orders date-math bounds while intersecting; pass the value recorded as
 * `provenance.executedAt`. The returned strings are always the literal bounds the DSL carried.
 */
export function rangeBoundsFromDsl(
  dsl: Record<string, unknown> | undefined,
  nowMs?: number,
): { gte: string; lte: string } | undefined {
  const clause = effectiveRangeClause(dsl, nowMs);
  if (!clause || !clause.statedLower || !clause.statedUpper) {
    return undefined;
  }
  return { gte: clause.window.from, lte: clause.window.to };
}

/**
 * Pins one bound to the absolute instant it meant WHEN THE QUERY RAN, so a link clicked later opens
 * the window the query actually used rather than the same date-math re-resolved against the
 * reader's clock. Falls back to the literal bound when it cannot be resolved (no `executedAt` on a
 * conversation persisted before that field existed) — the pre-existing behavior, and still better
 * than a fabricated instant.
 */
function pinBound(value: string, executedAt: number | undefined): string {
  const resolved = resolveBoundMs(value, executedAt);
  return resolved === undefined ? value : new Date(resolved).toISOString();
}

/**
 * The window the "Open in Discover" link must carry, resolved from what the SERVER recorded about
 * the query it actually ran rather than from a client-side default:
 *
 *  1. `effectiveRange` — `TableSpec.provenance.effectiveRange`, the post-guardrail `{gte, lte}` the
 *     executor read off the executed body (see `TableSpec.provenance` in common/types.ts). This is
 *     the same fact the evidence popover states as "the window this ran against", so taking it
 *     first makes it structurally impossible for the link to open a window the popover contradicts
 *     — even if `discover.dsl` and the recorded provenance ever stop being derived from the same
 *     body.
 *  2. A range clause read out of `dsl` itself — the path for a table persisted before provenance
 *     existed, which still carries its DSL. Read through `effectiveRangeClause`, so this inherits
 *     that function's field partitioning and multi-clause intersection: a DSL with two
 *     `@timestamp` clauses opens the window they actually agree on, the same one the popover
 *     states. Deliberately NOT `extractTimeRange`, whose own no-clause fallback is
 *     `DEFAULT_TIME_RANGE` — routing through it would swallow case 3 below before it could fire.
 *  3. `UNBOUNDED_TIME_RANGE` — no recorded range and no clause in the DSL means the query had no
 *     time filter, so the link opens on all of history rather than silently narrowing to
 *     `DEFAULT_TIME_RANGE`'s 24 hours and under-counting the answer it sits under.
 *
 * Case 3 is the behavior change: cases 1 and 2 agree on every query whose DSL states a window
 * (they are read off the same body), so this only ever moves the range-less case.
 *
 * `executedAt` does double duty: it pins the bounds below, and it is the reference
 * `effectiveRangeClause` orders date-math against when intersecting case 2's clauses — the same
 * reference server/tools/executor.ts recorded the provenance with, so the two cannot intersect the
 * same DSL differently.
 *
 * Whichever case wins, a date-math bound is PINNED to the absolute instant it meant at
 * `executedAt` (`pinBound`). OSD resolves `now-90d` in `_g` against the browser's clock at click
 * time, so an unpinned bound made a conversation reopened a week later open a window shifted a week
 * forward — a different window from the one the evidence popover states for the same query, and a
 * different total from the answer. `executedAt` comes from `TableSpec.provenance.executedAt`; with
 * no `executedAt` recorded the literal bound is kept, exactly as before.
 */
export function resolveDiscoverTimeRange(params: {
  dsl?: Record<string, unknown>;
  effectiveRange?: { gte: string; lte: string };
  executedAt?: number;
}): TimeRange {
  const { dsl, effectiveRange, executedAt } = params;
  const resolved = effectiveRange
    ? { from: effectiveRange.gte, to: effectiveRange.lte }
    : effectiveRangeClause(dsl, executedAt)?.window ?? UNBOUNDED_TIME_RANGE;
  return {
    from: pinBound(resolved.from, executedAt),
    to: pinBound(resolved.to, executedAt),
  };
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
