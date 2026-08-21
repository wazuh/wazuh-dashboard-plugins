import { TableSpec, ToolCall } from '../../../common/types';
import { extractTimeRange, hasExplicitTimeRange } from '../../../common/discover-url';

/**
 * Human-worded provenance chip labels for the tool calls a turn ran — client-side only, derived
 * from data the turn already carries (no new server field). Mirrors the server's own date-math
 * defaults (server/tools/catalog/common.ts's `DEFAULT_TIME_RANGE_GTE`/`DEFAULT_TIME_RANGE_LTE`,
 * "now-90d"/"now") so an omitted bound reads the same way here as it resolves there.
 */
const DEFAULT_TIME_RANGE_GTE = 'now-90d';
const DEFAULT_TIME_RANGE_LTE = 'now';

/** Truncates a label for the collapsed chip; the untruncated string is always still available via
 * `title`/`aria-label`, so this is purely a layout concern. */
const CHIP_LABEL_MAX_LENGTH = 32;

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

/** `now-24h` -> "24h", `now-90d` -> "90d". Anything else (a plain ISO timestamp, or literal "now")
 * is not date-math shorthand, so it is left out of the short chip label and appears only in the
 * full label. */
function shortDateMath(value: string): string | undefined {
  const match = /^now-(\d+[dhm])$/.exec(value);
  return match ? match[1] : undefined;
}

/** Reads the `time_range_gte`/`time_range_lte` pair off a call's arguments, defaulting exactly the
 * way the server's own query builders do. */
function timeRangeOf(args: Record<string, unknown>): {
  gte: string;
  lte: string;
} {
  return {
    gte:
      typeof args.time_range_gte === 'string'
        ? args.time_range_gte
        : DEFAULT_TIME_RANGE_GTE,
    lte:
      typeof args.time_range_lte === 'string'
        ? args.time_range_lte
        : DEFAULT_TIME_RANGE_LTE,
  };
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;
}

export interface ToolCallLabel {
  /** Truncated text for the chip itself. */
  short: string;
  /** Untruncated text for `title`/`aria-label` — the raw tool name, the index it read, and the
   * exact bounds, so the hover answers "what precisely ran" without opening the raw view. */
  full: string;
}

/**
 * Approximate millisecond span of each date-math unit OpenSearch date-math recognizes
 * (`now-90d`, `now+1h`, ...). These feed only a human-worded DURATION label ("90d", "2y") for the
 * provenance popover, never a query, so the calendar imprecision of a flat 30-day month / 365-day
 * year is an acceptable trade for a one-line badge.
 */
const MS_PER_UNIT: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 7 * 86_400_000,
  M: 30 * 86_400_000,
  y: 365 * 86_400_000,
};

/** Resolves a date-math (`now`, `now-90d`, `now+1h`) or ISO-8601 bound to an absolute epoch ms,
 * against a supplied `nowMs` so callers (and tests) get a deterministic result. `undefined` for a
 * string neither form recognizes. */
function resolveBoundMs(value: string, nowMs: number): number | undefined {
  if (value === 'now') {
    return nowMs;
  }
  const match = /^now([+-])(\d+)(y|M|w|d|h|m|s)$/.exec(value);
  if (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const amount = Number(match[2]);
    return nowMs + sign * amount * MS_PER_UNIT[match[3]];
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Formats a millisecond duration as the coarsest whole unit that divides it exactly, falling back
 * to whole days when nothing divides evenly. Computed from the ACTUAL span between two resolved
 * instants — not by regex-matching the original date-math string — so it reads correctly whether
 * the bound was date-math ("now-90d") or a plain ISO instant (the server's own clamped absolute
 * bounds, `guardrails.ts`'s `clampLookbackWindow`). */
function formatDurationShort(durationMs: number): string {
  const abs = Math.abs(durationMs);
  // Deliberately no 'M' (month) bucket: a 30-day approximation would format the server's own
  // exact 90-day lookback cap (guardrails.ts's MAX_LOOKBACK_MS) as "3M" instead of "90d", which
  // does not match the day-denominated cap the guardrail — and issue #9008's own example badge
  // ("90d · requested 2y") — are stated in. `y`/`w`/`d`/`h`/`m` cover every duration this badge
  // actually needs to render; `MS_PER_UNIT.M` stays defined above only for parsing an incoming
  // "now-3M"-shaped bound, never for formatting one back out.
  const units: Array<[string, number]> = [
    ['y', MS_PER_UNIT.y],
    ['w', MS_PER_UNIT.w],
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

/** Locale-formatted absolute range, e.g. "Jul 26, 2026 – Oct 24, 2026" — the "resolved absolute
 * time range" issue #9008 (G2) asks the popover to show, as opposed to the raw date-math/ISO
 * strings a reader would otherwise have to resolve in their head. */
function formatAbsoluteRangeLabel(gteMs: number, lteMs: number): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${formatter.format(new Date(gteMs))} – ${formatter.format(new Date(lteMs))}`;
}

/** The effective (as-executed) window read off a table's own discover DSL, when it carries an
 * explicit recognizable range — `undefined` otherwise (a Manager-API table with no DSL concept,
 * or an Indexer table whose DSL carries no readable timestamp clause). */
function effectiveRangeFromDsl(
  dsl: Record<string, unknown> | undefined,
): { gte: string; lte: string } | undefined {
  if (!hasExplicitTimeRange(dsl)) {
    return undefined;
  }
  const { from, to } = extractTimeRange(dsl);
  return { gte: from, lte: to };
}

/**
 * Provenance detail for issue #9008's evidence popover: which index a call read, the resolved
 * absolute time range it actually ran against (G2), and — when the server's 90-day lookback
 * guardrail (`server/tools/guardrails.ts`'s `clampLookbackWindow`) narrowed a wider request — ONE
 * badge stating both the effective and the requested window instead of two separate,
 * near-identically-labelled chips with no requested-vs-effective concept between them (G3).
 */
export interface ToolCallProvenance {
  /** The concrete index the call queried; `undefined` for a Manager-API call (no index concept)
   * or when the table carries no `discover` link. */
  index?: string;
  /** Human, absolute rendering of the EFFECTIVE window ("Jul 26, 2026 – Oct 24, 2026");
   * `undefined` when no time-range bound could be resolved to an absolute instant. */
  resolvedRangeLabel?: string;
  /** The window as requested in the call's own arguments, defaulted the same way the server
   * defaults an omitted bound (see `timeRangeOf`). */
  requested: { gte: string; lte: string };
  /** The window the query actually ran against — read off the table's executed DSL when one is
   * available and readable, otherwise identical to `requested` (nothing to disprove it with). */
  effective: { gte: string; lte: string };
  /** True when `effective` differs from `requested` — i.e. the lookback guardrail clamped it. */
  isClamped: boolean;
  /** "90d" normally; "90d · requested 2y" once clamped — the single badge G3 asks for. Falls back
   * to the raw (unresolvable) bound strings when a duration cannot be computed for either side. */
  windowBadgeLabel: string;
}

/**
 * Builds the provenance popover's index/time-range detail for one tool call. `nowMs` defaults to
 * the real clock but is overridable so callers (tests) get a deterministic result — date-math
 * bounds are resolved relative to it, and an identical `nowMs` on both sides is what keeps a
 * clamp comparison meaningful (see `isClamped`).
 */
export function describeToolCallProvenance(
  toolCall: ToolCall,
  table: TableSpec | undefined,
  nowMs: number = Date.now(),
): ToolCallProvenance {
  const args = toolCall.arguments ?? {};
  const requested = timeRangeOf(args);
  const effective = effectiveRangeFromDsl(table?.discover?.dsl) ?? requested;
  const isClamped =
    requested.gte !== effective.gte || requested.lte !== effective.lte;

  const requestedGteMs = resolveBoundMs(requested.gte, nowMs);
  const requestedLteMs = resolveBoundMs(requested.lte, nowMs);
  const effectiveGteMs = resolveBoundMs(effective.gte, nowMs);
  const effectiveLteMs = resolveBoundMs(effective.lte, nowMs);

  const effectiveShort =
    effectiveGteMs !== undefined && effectiveLteMs !== undefined
      ? formatDurationShort(effectiveLteMs - effectiveGteMs)
      : undefined;
  const requestedShort =
    requestedGteMs !== undefined && requestedLteMs !== undefined
      ? formatDurationShort(requestedLteMs - requestedGteMs)
      : undefined;

  const windowBadgeLabel =
    isClamped && effectiveShort && requestedShort
      ? `${effectiveShort} · requested ${requestedShort}`
      : effectiveShort ?? `${effective.gte} → ${effective.lte}`;

  const resolvedRangeLabel =
    effectiveGteMs !== undefined && effectiveLteMs !== undefined
      ? formatAbsoluteRangeLabel(effectiveGteMs, effectiveLteMs)
      : undefined;

  return {
    index: table?.discover?.index,
    resolvedRangeLabel,
    requested,
    effective,
    isClamped,
    windowBadgeLabel,
  };
}

/**
 * Builds a provenance chip's label for one tool call: a readable name plus the time window it
 * covered (`Critical findings · 90d`), with the verbatim detail kept for the tooltip.
 */
export function describeToolCall(
  toolCall: ToolCall,
  table: TableSpec | undefined,
): ToolCallLabel {
  const args = toolCall.arguments ?? {};
  const { gte, lte } = timeRangeOf(args);
  const readable = humanizeToolName(toolCall.name);
  const window =
    lte === DEFAULT_TIME_RANGE_LTE ? shortDateMath(gte) : undefined;
  const short = window ? `${readable} · ${window}` : readable;

  const index = table?.discover?.index;
  const fullParts = [toolCall.name];
  if (index) {
    fullParts.push(index);
  }
  fullParts.push(`${gte} → ${lte}`);

  return {
    short: truncate(short, CHIP_LABEL_MAX_LENGTH),
    full: fullParts.join(' · '),
  };
}
