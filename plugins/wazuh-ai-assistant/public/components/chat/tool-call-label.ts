import { TableSpec, ToolCall } from '../../../common/types';

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
const CHIP_LABEL_MAX_LENGTH = 28;

/** `now-24h` -> "last 24 hours", `now-90d` -> "last 90 days", `now-15m` -> "last 15 minutes".
 * Anything else (a plain ISO timestamp, or literal "now") is not date-math shorthand, so the raw
 * value is shown as-is rather than guessing at a phrasing for it. */
function humanizeDateMathBound(value: string): string {
  const match = /^now-(\d+)([dhm])$/.exec(value);
  if (!match) {
    return value;
  }
  const amount = Number(match[1]);
  const unitLabel =
    match[2] === 'd' ? 'day' : match[2] === 'h' ? 'hour' : 'minute';
  return `last ${amount} ${unitLabel}${amount === 1 ? '' : 's'}`;
}

/** Describes the `time_range_gte`/`time_range_lte` pair a tool call's arguments carry (when
 * present), defaulting exactly the way the server's own query builders do. Returns `undefined`
 * only when neither the call's own arguments nor the defaults produce something worth showing —
 * in practice this always returns a string, since the defaults themselves are always valid.
 */
function describeTimeRange(args: Record<string, unknown>): string | undefined {
  const gte =
    typeof args.time_range_gte === 'string'
      ? args.time_range_gte
      : DEFAULT_TIME_RANGE_GTE;
  const lte =
    typeof args.time_range_lte === 'string'
      ? args.time_range_lte
      : DEFAULT_TIME_RANGE_LTE;

  const gteLabel = humanizeDateMathBound(gte);
  if (lte === DEFAULT_TIME_RANGE_LTE) {
    return gteLabel;
  }
  return `${gteLabel} to ${humanizeDateMathBound(lte)}`;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1).trimEnd()}…`
    : value;
}

export interface ToolCallLabel {
  /** Truncated text for the chip itself. */
  short: string;
  /** Untruncated text for `title`/`aria-label`. */
  full: string;
}

/**
 * Builds a provenance chip's label for one tool call: `{index} · {time range}` when the turn's
 * table carries "Open in Discover" info (the only case with an index to name), falling back to
 * the raw tool name otherwise — a Manager API tool call has no index/time-range concept at all.
 */
export function describeToolCall(
  toolCall: ToolCall,
  table: TableSpec | undefined,
): ToolCallLabel {
  const index = table?.discover?.index;
  if (!index) {
    return { short: truncate(toolCall.name, CHIP_LABEL_MAX_LENGTH), full: toolCall.name };
  }
  const timeRange = describeTimeRange(toolCall.arguments ?? {});
  const full = timeRange ? `${index} · ${timeRange}` : index;
  return { short: truncate(full, CHIP_LABEL_MAX_LENGTH), full };
}
