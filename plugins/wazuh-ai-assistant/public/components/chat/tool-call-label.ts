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
function timeRangeOf(args: Record<string, unknown>): { gte: string; lte: string } {
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
  const window = lte === DEFAULT_TIME_RANGE_LTE ? shortDateMath(gte) : undefined;
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
