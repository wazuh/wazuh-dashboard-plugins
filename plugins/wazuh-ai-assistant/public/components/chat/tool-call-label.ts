import { TableSpec, ToolCall } from '../../../common/types';

/**
 * Human-worded provenance chip labels for the tool calls a turn ran.
 *
 * ISSUE #9008 REWORK — the "never infer, never invent" principle: everything this file renders
 * about an index or a time window comes STRAIGHT off `TableSpec.provenance` (common/types.ts),
 * which server/tools/executor.ts populates purely from what it factually observed executing the
 * query. This file used to default a missing `time_range_gte`/`time_range_lte` argument to
 * "now-90d"/"now" itself and compare that invented value against the query's actual DSL — for
 * the ~18 catalog tools that carry no time-range concept at all, that fabricated a "requested"
 * window (and, for an over-wide escape-hatch query, a false clamp claim) for a call the server
 * never clamped. It is now purely a RENDERER over `provenance`: a field the server did not
 * report means nothing is shown for it — no line, no badge, no invented default.
 */

/** Truncates the humanized NAME segment of a chip label; the window text (once known) is always
 * appended AFTER truncation, never truncated itself (issue #9008 review, major 3 — truncating the
 * composed string used to cut a clamp badge mid-numeral, e.g. "requested 7…" for "requested
 * 720d"). The untruncated string is always still available via `title`/`aria-label`. */
const NAME_MAX_LENGTH = 32;

/**
 * Turns a tool identifier into a readable name: `get_critical_findings` -> "Critical findings",
 * `search_findings_by_agent` -> "Findings by agent". The chip names WHAT WAS ASKED, which is the
 * only part that differs between one call and the next — labelling by index instead produced two
 * identical chips whenever a turn ran two tools against the same index, which told the reader
 * nothing and read as a rendering bug.
 */
function humanizeToolName(name: string): string {
  const words = name
    .replace(/^(get|search|find|list)_/, '')
    .split('_')
    .filter(Boolean);
  if (words.length === 0) {
    return name;
  }
  const phrase = words.join(' ');
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** `now-24h` -> "24h", `now-90d` -> "90d". This is the SAME date-math shorthand reader used
 * everywhere a bound needs a short label — a bound that is not this shape (a plain ISO instant,
 * or literal "now") returns `undefined` rather than being approximated, so the only other path
 * (`spanShortLabel` below) is the one that ever computes a duration from two resolved instants. */
function shortDateMath(value: string): string | undefined {
  const match = /^now-(\d+[dhm])$/.exec(value);
  return match ? match[1] : undefined;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;
}

export interface ToolCallLabel {
  /** Truncated text for the chip itself. */
  short: string;
  /** Untruncated text for `title`/`aria-label` — the raw tool name plus whatever provenance facts
   * are known, so the hover answers "what precisely ran" without opening the raw view. */
  full: string;
}

/** Millisecond span of the date-math units `shortDateMath` above recognizes (day/hour/minute),
 * plus a year bucket for a genuinely long ISO-to-ISO span — deliberately NO week/month bucket
 * (issue #9008 review, minor 5): a week/month approximation would format the guardrail's exact
 * 90-day lookback cap as something other than "90d". These feed only a human-worded DURATION
 * label for an ABSOLUTE (ISO) span; a date-math bound is always rendered via `shortDateMath`
 * instead, never through this table. */
const MS_PER_UNIT = {
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  y: 365 * 86_400_000,
} as const;

/** Formats a millisecond duration as the coarsest whole unit that divides it exactly, falling back
 * to whole days when nothing divides evenly. Only ever called on the span between two RESOLVED
 * instants (see `spanShortLabel`) — never a substitute for `shortDateMath`'s literal rendering of
 * a date-math bound. */
function formatDurationShort(durationMs: number): string {
  const abs = Math.abs(durationMs);
  const units: Array<[string, number]> = [
    ['y', MS_PER_UNIT.y],
    ['d', MS_PER_UNIT.d],
    ['h', MS_PER_UNIT.h],
    ['m', MS_PER_UNIT.m],
  ];
  for (const [unit, unitMs] of units) {
    if (abs >= unitMs && abs % unitMs === 0) {
      return `${Math.round(abs / unitMs)}${unit}`;
    }
  }
  return `${Math.max(1, Math.round(abs / MS_PER_UNIT.d))}d`;
}

/**
 * Resolves a date-math (`now`, `now-90d`) or ISO-8601 bound to an absolute epoch ms.
 *
 * `executedAt` is the FACT the server recorded (`TableSpec.provenance.executedAt`) for the
 * instant the query actually ran — issue #9008 review, blocker 2: a date-math bound only means
 * something relative to WHEN it ran, so resolving `now`/`now-90d` against the render-time clock
 * instead (the pre-fix behavior) showed a restored conversation a window the query never ran
 * against. When `executedAt` is `undefined` (a conversation persisted before this field existed),
 * a date-math bound is left UNRESOLVED — `undefined`, never a guess against the current clock.
 * The two callers react to that differently: `spanShortLabel`'s last-resort path falls back to
 * the literal bound STRING (never blank), while `formatAbsoluteRangeLabel` has no such string
 * fallback and simply returns `undefined`, which is what makes the popover's "Time range:" line
 * OMITTED entirely rather than showing a fabricated absolute instant. An ISO-8601 bound needs no
 * "now" reference at all and resolves the same either way, `executedAt` present or not.
 */
function resolveBoundMs(
  value: string,
  executedAt: number | undefined,
): number | undefined {
  if (value === 'now') {
    return executedAt;
  }
  const match = /^now-(\d+)([dhm])$/.exec(value);
  if (match) {
    return executedAt === undefined
      ? undefined
      : executedAt -
          Number(match[1]) * MS_PER_UNIT[match[2] as 'd' | 'h' | 'm'];
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * One bound-pair's short label: `shortDateMath` first (so `now-7d`/`now-720d` read exactly as
 * they already do everywhere else this shorthand appears — this path needs no `executedAt` at
 * all), falling back to a computed span only when at least one bound is not that shape — an
 * absolute ISO instant, which is exactly what the server's own lookback clamp rewrites BOTH
 * bounds to when it fires (`guardrails.ts`'s `clampLookbackWindow` doc comment). The raw bound
 * strings are the last-resort fallback for a pair neither path can resolve (e.g. `executedAt` is
 * unknown and a bound is date-math, or the window is inverted/malformed) — never blank, but also
 * never a guess at a duration.
 */
function spanShortLabel(
  range: { gte: string; lte: string },
  executedAt: number | undefined,
): string {
  if (range.lte === 'now') {
    const short = shortDateMath(range.gte);
    if (short) {
      return short;
    }
  }
  const gteMs = resolveBoundMs(range.gte, executedAt);
  const lteMs = resolveBoundMs(range.lte, executedAt);
  if (gteMs !== undefined && lteMs !== undefined) {
    return formatDurationShort(lteMs - gteMs);
  }
  return `${range.gte} → ${range.lte}`;
}

/** Locale-formatted absolute instant, mirroring result-table.tsx's own `formatTimestamp` (same
 * options, plus a year — a provenance range can span calendar years where a single table cell
 * timestamp never needs to) so a resolved range reads in the same date+time style the table body
 * already uses. Time-of-day is included on purpose (issue #9008 review, minors): a same-day
 * "now-24h" window without it would render as a single, misleadingly degenerate date. */
function formatInstant(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

/** `{gte, lte}` -> "Jul 26, 2026, 05:58 – Oct 24, 2026, 05:58"; `undefined` when either bound
 * cannot be resolved to an absolute instant (including: `executedAt` unknown and a bound is
 * date-math — see `resolveBoundMs`'s doc comment, issue #9008 review blocker 2). */
function formatAbsoluteRangeLabel(
  range: { gte: string; lte: string },
  executedAt: number | undefined,
): string | undefined {
  const gteMs = resolveBoundMs(range.gte, executedAt);
  const lteMs = resolveBoundMs(range.lte, executedAt);
  return gteMs !== undefined && lteMs !== undefined
    ? `${formatInstant(gteMs)} – ${formatInstant(lteMs)}`
    : undefined;
}

/** The provenance fields a table can carry — re-exported here under a short alias purely so this
 * file's own signatures stay readable. */
type Provenance = TableSpec['provenance'];

export interface ProvenanceDisplay {
  /** The concrete index the call queried; `undefined` when the server recorded none (a
   * Manager-API call, or no provenance at all). */
  index?: string;
  /** Human, absolute rendering of the EFFECTIVE window; `undefined` when the server recorded no
   * `effectiveRange` (the query's DSL carried no recognizable time-range clause at all), no
   * `executedAt` and the bound is date-math, or a bound could not be resolved at all. */
  resolvedRangeLabel?: string;
  /** "90d" normally; "90d · requested 720d" once the server reports `clamped: true` AND the
   * requested window actually differs from the effective one (issue #9008 review, minor 6 — a
   * clamp whose requested/effective spans happen to render identically would otherwise show
   * "90d · requested 90d", which states nothing a reader doesn't already see). `undefined`
   * whenever `resolvedRangeLabel`'s source (`effectiveRange`) is absent (nothing to label a
   * window with if the server never reported an effective one). */
  windowBadgeLabel?: string;
}

/**
 * Renders `TableSpec.provenance` for display — the ONLY function in this file (or its callers)
 * that may read index/time-range facts, and it renders EXACTLY what `provenance` reports, nothing
 * more: a `provenance` of `undefined` (a Manager-API table, or a call this table did not produce
 * — see `toolCallId` matching at the call site) yields an empty `ProvenanceDisplay`, and a
 * `provenance` with no `effectiveRange` (the DSL had no time-range clause) yields one with `index`
 * set but no range/badge at all. Reads `provenance.executedAt` for every date-math resolution —
 * never a caller-supplied or ambient "now" — so this function needs no such parameter itself.
 */
export function describeProvenance(provenance: Provenance): ProvenanceDisplay {
  if (!provenance) {
    return {};
  }
  const { index, effectiveRange, requestedRange, clamped, executedAt } =
    provenance;
  if (!effectiveRange) {
    return { index };
  }
  const effectiveShort = spanShortLabel(effectiveRange, executedAt);
  const requestedShort =
    clamped && requestedRange
      ? spanShortLabel(requestedRange, executedAt)
      : undefined;
  // Issue #9008 review, minor 6: only state the requested window when it actually reads
  // differently from the effective one — a clamp whose two spans happen to render identically
  // (e.g. both round to "90d") has nothing further to disclose.
  const windowBadgeLabel =
    requestedShort && requestedShort !== effectiveShort
      ? `${effectiveShort} · requested ${requestedShort}`
      : effectiveShort;
  return {
    index,
    resolvedRangeLabel: formatAbsoluteRangeLabel(effectiveRange, executedAt),
    windowBadgeLabel,
  };
}

/**
 * Builds a provenance chip's label for one tool call: a readable name plus, ONLY when `provenance`
 * is supplied (the caller's own responsibility to pass it only for the call that actually
 * produced this table — see message-bubble.tsx's `toolCallId` match, issue #9008 blocker 3), the
 * effective window and — once the server reports a clamp — the requested window too, right on
 * the chip itself (issue #9008 review, major 4: the dual-window text must be visible without
 * opening the popover). A call with no matching provenance renders its name alone; nothing about
 * its window is ever guessed.
 */
export function describeToolCall(
  toolCall: ToolCall,
  provenance: Provenance,
): ToolCallLabel {
  const readable = humanizeToolName(toolCall.name);
  const { index, windowBadgeLabel } = describeProvenance(provenance);

  // Issue #9008 review, major 3: truncate only the NAME segment, then append the window text
  // (which can carry a clamp numeral like "720d") un-truncated — truncating the composed string
  // used to cut it mid-digit ("requested 7…").
  const truncatedName = truncate(readable, NAME_MAX_LENGTH);
  const short = windowBadgeLabel
    ? `${truncatedName} · ${windowBadgeLabel}`
    : truncatedName;

  const fullParts = [toolCall.name];
  if (index) {
    fullParts.push(index);
  }
  if (windowBadgeLabel) {
    fullParts.push(windowBadgeLabel);
  }

  return {
    short,
    full: fullParts.join(' · '),
  };
}
