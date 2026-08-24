import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiIcon,
  EuiPopover,
  EuiText,
  EuiTextColor,
  EuiToolTip,
  EuiSpacer,
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { MAX_VISIBLE_RESULT_COLUMNS, TableSpec } from '../../../common/types';
import { SeverityLevel } from '../../../common/constants';
import { DiscoverLink, ResolveDiscoverUrl } from './discover-link';
import {
  ResolveSecurityAnalyticsUrl,
  SecurityAnalyticsLink,
} from './security-analytics-link';
import './result-table.scss';

/** Tables at or under this row count default to expanded. The threshold used to be 10, from a time
 * when a big result really did push the chat input off screen; the card now caps its own height
 * (`$wzResultsMaxHeight`) and scrolls internally, so length no longer costs the reader anything —
 * and the design's canonical Screen 2 is a 26-row table shown OPEN. Kept as a ceiling rather than
 * removed so a pathological result still opens collapsed instead of rendering thousands of rows. */
const AUTO_EXPAND_ROW_THRESHOLD = 200;

/** One rendered table row: a `TableSpec` row plus the global `__rowId` the expander column and
 * `itemIdToExpandedRowMap` are keyed by (assigned over the FULL row set before pagination). */
type ResultRow = Record<string, unknown> & { __rowId: string };
/** Default page size and the choices offered in the card footer's row-count control.
 *
 * Issue #9009 (A4): was 5, which split every 6-10 row answer onto a hidden page 2 — the QA E2E
 * review caught a factually wrong AI prose summary that resulted from exactly that (a row silently
 * left off-page). Ten is the standard EUI default page size and is large enough that the vast
 * majority of tool results (which top out well under it) never paginate at all; the reader can
 * still page through — or pick a smaller/larger size — for genuinely large results, and it keeps
 * the DOM small for a 500-row one, which is why pagination was here to begin with.
 */
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

/**
 * Issue #9009 (J1, follow-up): the fixed 560px narrow-mode threshold only ever accounted for the
 * QA E2E review's ~480px repro width. A live finding on the deployed build showed a 6-column
 * table still wrapping every cell at ~600-800px (a docked sidecar squeezing the main surface) —
 * 560px is comfortable for a 3-column table but nowhere near enough for 6, so a single fixed
 * pixel threshold can never be right for every column count. The rule is now adaptive: go narrow
 * whenever the card cannot give each would-be-visible column at least `MIN_COLUMN_WIDTH_PX` —
 * an id/date/short-value column's readable floor, not a strict character budget — i.e.
 * `width < candidateColumnCount * MIN_COLUMN_WIDTH_PX` (see `candidateColumnCount` below).
 *
 * Issue #9009 (J1, second follow-up): 120 was still too tight. A live repro on the deployed build
 * measured the card at ~728px with a 6-column table — the quantizer (see `WIDTH_QUANTUM_PX`)
 * floors that to 720, and `720 < 6 * 120 = 720` is false by exactly the boundary, so the table
 * stayed full-width and wrapped every cell vertically anyway. And the real columns this renderer
 * actually carries — an id/UUID, a rule/finding title, a formatted timestamp — need noticeably
 * more than 120px per column to read on one line regardless of the boundary math. Raised to 140:
 * a 6-column table now goes narrow under ~840px (comfortably clearing the 728px repro), a
 * 3-column table stays full down to ~420px, and the original 480px repro (>= 3 candidate columns)
 * stays narrow either way.
 */
const MIN_COLUMN_WIDTH_PX = 140;
/** Issue #9009 (J1): column budget in narrow mode — "first 2-3 columns from the tool's existing
 * column order", the same order `MAX_VISIBLE_COLUMNS` already respects at full width. Every
 * demoted column stays reachable through the row expander, same as `MAX_VISIBLE_COLUMNS` above. */
const NARROW_MAX_VISIBLE_COLUMNS = 3;
/**
 * Issue #9009 (J1, follow-up): the ResizeObserver below stores state in QUANTIZED buckets of this
 * many px rather than the raw measured width, for the same reason the old code stored only a
 * boolean — the sidecar's own drag-resize fires the observer on every pixel, and re-rendering the
 * table on every single one of those (rather than only when the reader crosses a real bucket) is
 * a render storm for no visible benefit. The adaptive rule needs the actual width (not just a
 * boolean) because the threshold itself now depends on the spec's column count, so a plain
 * boolean can no longer be computed inside the observer callback alone — quantizing is the
 * middle ground that keeps state updates rare while still letting `isNarrow` be derived at
 * render time for whatever column count the current spec has. Buckets round DOWN (`Math.floor`),
 * never up: rounding up could quantize a genuinely-narrow width past its own threshold and
 * misreport it as full (e.g. 700px rounding up to 720px would clear the 6-column table's exact
 * 720px threshold) — rounding down only ever errs toward triggering narrow mode a few px early,
 * never toward missing it.
 */
const WIDTH_QUANTUM_PX = 40;

/** `0` stays `0` (unmeasured/not-yet-observed, same sentinel the old boolean's `width > 0` guard
 * used), everything else buckets down to the nearest `WIDTH_QUANTUM_PX` — see that constant's
 * doc comment for why down rather than to the nearest. */
function quantizeWidthPx(width: number): number {
  if (width <= 0) {
    return 0;
  }
  return Math.floor(width / WIDTH_QUANTUM_PX) * WIDTH_QUANTUM_PX;
}

/**
 * The card's height ceiling, in the only frame of reference that is actually correct: the
 * TRANSCRIPT's measured height.
 *
 * `$wzResultsMaxHeight` (result-table.scss) reads `min(460px, 52dvh)`, and `dvh` resolves against
 * the VIEWPORT — ignoring the app frame's own offset, the tab bar, and above all the composer row,
 * which takes up to 30dvh of the same window. At the spec's own 1280x620 acceptance size that
 * arithmetic runs: frame 571 -> pane ~531 -> composer at its ceiling 186 -> transcript ~345, while
 * the card alone would still claim min(460, 322) = 322px. Twenty-three pixels left for the avatar
 * row, the answer prose and the turn's spacing, so the pinned pagination footer lands below the
 * transcript's fold — which is precisely the "page 2 of 6 unreachable" bug §4 exists to kill,
 * returning one level down from where it was fixed. `transcriptHeightPx` was already measured and
 * threaded all the way here for the page-size step; this makes the height use it too.
 *
 * The reserve is what the turn needs ABOVE the card: an avatar/label row plus two or three lines of
 * answer prose plus the row's own spacing. The floor is a card that can still show its header, two
 * rows and its footer — below that a shorter cap helps nobody, and the transcript's own scroll
 * (which is a full-pane scroll, not a nested one) is the better answer.
 */
const RESULTS_CARD_MAX_HEIGHT_PX = 460;
/**
 * "Card grows" (iteration-4 item 3): the JS twin of `$wzResultsMaxHeightExpanded` (80dvh,
 * result-table.scss/_redesign.scss) for the transcript-measured-height code path above — that
 * `dvh` figure has no meaningful px equivalent here (this clamp works in the transcript's own
 * measured space, not the viewport), so this is a generous ceiling that in practice only ever
 * matters as an upper bound: `measuredCardMaxHeight` below still subtracts
 * `RESULTS_CARD_TRANSCRIPT_RESERVE_PX` from `transcriptHeightPx`, so the card can never actually
 * push the pinned footer off the transcript's own fold even at this "expanded" ceiling.
 */
const RESULTS_CARD_MAX_HEIGHT_EXPANDED_PX = 900;
const RESULTS_CARD_MIN_HEIGHT_PX = 240;
const RESULTS_CARD_TRANSCRIPT_RESERVE_PX = 140;

/**
 * Badge color + localized label for each `SeverityLevel` word. Colors mirror the platform's own
 * mapping — plugins/main/common/constants.ts's `UI_COLOR_STATUS` (critical: '#BD271E', high:
 * '#FEC514', medium/info: '#6092C0', low/success: '#007871', informational/disabled: '#646A77') —
 * so a severity reads the same color here as it does everywhere else in the product. Not imported
 * directly (that would be a cross-plugin import from wazuh-ai-assistant into plugins/main); the
 * hex values are copied in and this comment is the pointer back to the source of truth.
 */
const SEVERITY_BUCKETS: Record<
  SeverityLevel,
  { color: string; label: string }
> = {
  informational: {
    color: '#646A77',
    label: i18n.translate(
      'wazuhAiAssistant.resultTable.severity.informational',
      {
        defaultMessage: 'Informational',
      },
    ),
  },
  low: {
    color: '#007871',
    label: i18n.translate('wazuhAiAssistant.resultTable.severity.low', {
      defaultMessage: 'Low',
    }),
  },
  medium: {
    color: '#6092C0',
    label: i18n.translate('wazuhAiAssistant.resultTable.severity.medium', {
      defaultMessage: 'Medium',
    }),
  },
  high: {
    color: '#FEC514',
    label: i18n.translate('wazuhAiAssistant.resultTable.severity.high', {
      defaultMessage: 'High',
    }),
  },
  critical: {
    color: '#BD271E',
    label: i18n.translate('wazuhAiAssistant.resultTable.severity.critical', {
      defaultMessage: 'Critical',
    }),
  },
};

/** ISO-8601 instants as the indexer emits them (`2026-07-26T05:58:38.000Z`). Matched, rather than
 * fed straight to `new Date()`, so a plain string that merely happens to be Date-parseable (a rule
 * title starting with a year, an agent name like "2026-prod") is never silently reformatted. */
const ISO_TIMESTAMP_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

/** Column width for a formatted timestamp column — wide enough for "Jul 26, 2026, 05:58" on one
 * line, which is the entire point: unformatted, a raw ISO instant wrapped onto three lines and
 * made every row three times taller than its content needed. */
const TIMESTAMP_COLUMN_WIDTH = '118px';
/** Column width for the severity column: a badge plus its longest label ("Informational"). */
const SEVERITY_COLUMN_WIDTH = '104px';
/** Width for a column whose every value is short (see `isShortValueColumn`) — an agent name, an id,
 * a category. Enough for ~20 characters at the table's own font size; the free-text column takes the
 * remainder, which is the whole point (audit §3.4). */
const SHORT_COLUMN_WIDTH = '140px';
/** Longest rendered value that still counts as "short". Deliberately generous: a value that fits a
 * 140px cell on one line is what this is trying to identify, not a strict character budget. */
const SHORT_COLUMN_MAX_CHARS = 20;

/**
 * Column-count budget (issue #8921's "no table may need a horizontal scrollbar" item): a
 * rendering INVARIANT applied here, in the one generic table renderer, rather than per-tool —
 * every current and future tool's `tableSpec` inherits it automatically. The value lives in
 * common/types.ts (MAX_VISIBLE_RESULT_COLUMNS) so the server-side registry test can hold every
 * tool's severity column inside the same budget this renderer applies. Only the first
 * `MAX_VISIBLE_COLUMNS` of `spec.columns` become visible table columns; the rest are NOT dropped —
 * `buildTableSpec` (server/tools/digest.ts) already puts every spec-column field into each row
 * object regardless of visibility, so a hidden column stays reachable through the row expander
 * (the `EuiCodeBlock` JSON view below). Server-side column ORDER is therefore what decides which
 * fields win visibility; this cap decides only how many. `DERIVED_COLUMN_CAP` (digest.ts) stays 8
 * server-side on purpose — the model-facing digest and the client's visible-column budget are two
 * independent caps that are allowed to disagree, same as before this existed for the static-column
 * tools.
 */
const MAX_VISIBLE_COLUMNS = MAX_VISIBLE_RESULT_COLUMNS;

/** Rendered in place of an absent value (`undefined`/`null`/`''`) in every column render path
 * (default, severity, timestamp) — issue #8921's "absent is rendered as absent" item. An em dash,
 * not a blank cell, so a reader can tell "this field genuinely has no value" apart from "this cell
 * failed to render". Falsy-but-present values (`0`, `false`) are NOT absent and must render
 * normally — see `isAbsentValue` below. */
const ABSENT_VALUE_PLACEHOLDER = '—';

/** `undefined`/`null`/`''` only — deliberately NOT the broader JS-falsy check, so a genuine `0` or
 * `false` value (e.g. a zero count, a boolean flag) still renders as itself rather than as the
 * absent-value placeholder. */
function isAbsentValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

/** Subdued em-dash placeholder for an absent cell — shared by every column render path so the
 * three (default/severity/timestamp) can never render three different "nothing here" spellings. */
function renderAbsentPlaceholder(): React.ReactNode {
  return (
    <EuiTextColor color='subdued'>{ABSENT_VALUE_PLACEHOLDER}</EuiTextColor>
  );
}

/**
 * Default-path cell renderer. Setting ANY `render` replaces EuiBasicTable's own default cell
 * formatter, so this must reproduce sane formatting for every value shape, not just pass values
 * through as React children — a raw `false`/`true` child renders as NOTHING in React (a blank
 * cell indistinguishable from absent, on real columns: get_rules'/get_detectors' Enabled), and a
 * raw array child renders concatenated with no separator ("informationalwazuh-generic..."). The
 * explicit shapes below are deterministic and locally owned rather than delegating to EUI's
 * internal formatAuto (whose exact behavior varies by EUI version):
 *  - absent (`undefined`/`null`/`''`) -> the shared em-dash placeholder,
 *  - boolean -> "Yes"/"No",
 *  - array   -> elements joined with ", " (each formatted by these same rules),
 *  - other objects -> JSON (never "[object Object]"),
 *  - strings/numbers -> unchanged.
 */
function formatCellValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value
      .filter(entry => !isAbsentValue(entry))
      .map(entry => formatCellValue(entry))
      .join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

function renderDefaultCell(value: unknown): React.ReactNode {
  if (isAbsentValue(value)) {
    return renderAbsentPlaceholder();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    // Unchanged fast path: strings/numbers render exactly as EuiBasicTable rendered them with no
    // `render` set.
    return value as React.ReactNode;
  }
  return formatCellValue(value);
}

/**
 * Issue #9009 (J1): narrow-mode cell wrapper — truncates the formatted text to one line with an
 * ellipsis and puts the untruncated value in an `EuiToolTip`, the same truncate-plus-tooltip idiom
 * the providers table already uses (settings-page.tsx's `anchorClassName`-bounded `EuiToolTip`).
 * Only applied to plain string/number cells: the absent-value placeholder and the severity badge
 * are already short and are left as `renderDefaultCell`/`renderSeverityBadge` render them.
 */
function renderNarrowTruncatedCell(value: unknown): React.ReactNode {
  if (isAbsentValue(value)) {
    return renderAbsentPlaceholder();
  }
  const text = formatCellValue(value);
  return (
    <EuiToolTip content={text} anchorClassName='wzResultsCellTruncateAnchor'>
      <span className='wzResultsCellTruncate'>{text}</span>
    </EuiToolTip>
  );
}

/**
 * Compact, locale-aware rendering of an ISO instant — display only. The raw value is untouched in
 * the row data (and still visible verbatim in the expanded-row JSON and the `title` attribute), so
 * nothing is lost: this changes how a timestamp reads, never what it is. Falls back to the raw
 * string if `Intl` throws on an unexpected value.
 */
function formatTimestamp(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/** True when every non-empty value in a column is an ISO instant — a column is only reformatted
 * when the WHOLE column is timestamps, so a mixed column keeps its raw values rather than showing
 * two different formats side by side. */
function isTimestampColumn(
  rows: Array<Record<string, unknown>>,
  field: string,
): boolean {
  let sawValue = false;
  for (const row of rows) {
    const value = row[field];
    if (value === null || value === undefined || value === '') {
      continue;
    }
    if (typeof value !== 'string' || !ISO_TIMESTAMP_RE.test(value)) {
      return false;
    }
    sawValue = true;
  }
  return sawValue;
}

/**
 * True when every non-empty value in a column is a SHORT scalar — an id, an agent name, a category
 * word. Same shape (and same "the whole column or nothing" rule) as `isTimestampColumn` above: one
 * long value is enough to disqualify a column, because the point is to identify the columns that
 * plainly do NOT need width so the one that does can have it.
 *
 * Arrays and objects are disqualifying regardless of length: `renderDefaultCell` joins/serializes
 * them, so their rendered width is not their raw one.
 */
function isShortValueColumn(
  rows: Array<Record<string, unknown>>,
  field: string,
): boolean {
  let sawValue = false;
  for (const row of rows) {
    const value = row[field];
    if (isAbsentValue(value)) {
      continue;
    }
    if (typeof value === 'object') {
      return false;
    }
    if (String(value).length > SHORT_COLUMN_MAX_CHARS) {
      return false;
    }
    sawValue = true;
  }
  return sawValue;
}

function renderSeverityBadge(value: unknown): React.ReactNode {
  const word = String(value ?? '').toLowerCase();
  // Look up directly in SEVERITY_BUCKETS (the single source of truth for what's renderable)
  // instead of checking membership in SEVERITY_LEVELS first and casting — two collections
  // staying in sync is an assumption this can't verify at runtime, an object property lookup
  // can't throw, and `bucket` being `undefined` is a normal, handled outcome either way.
  const bucket = SEVERITY_BUCKETS[word as SeverityLevel] as
    | { color: string; label: string }
    | undefined;
  // `.wzSeverityChip` (result-table.scss) gives every severity the wzStatusChip SHAPE — fully round,
  // 11px semibold — so a severity reads as the same kind of object as the provider status chips on
  // the settings page instead of as EUI's 2px-radius rectangle (audit §3.5). The FILL is deliberately
  // left as the platform's own `UI_COLOR_STATUS` hex (see SEVERITY_BUCKETS above), not swapped for
  // wzStatusChip's tinted-EUI-role wash: that palette is a cross-product agreement, and two of the
  // five roles ($euiColorWarning for high, $euiColorPrimary for medium) are not legible as 11px text
  // over their own 12% tint, which is the failure wzStatusChip's `$textTint` argument exists for and
  // which no `*Text` twin covers for a raw hex.
  if (!bucket) {
    return (
      <EuiBadge className='wzSeverityChip' color='default'>
        {String(value ?? '')}
      </EuiBadge>
    );
  }
  return (
    <EuiBadge className='wzSeverityChip' color={bucket.color}>
      {bucket.label}
    </EuiBadge>
  );
}

/**
 * One provenance chip for the card header (layout contract §4's "provenance moves UP here"):
 * which tool call produced this table. `TableSpec` itself carries no tool-call linkage (that
 * lives on the message, in `common/types.ts`'s `ChatMessage.toolCalls` — not this component's
 * file to add a new cross-reference field to), so message-bubble.tsx builds this shape from its
 * own `message.toolCalls` (via tool-call-label.ts's `describeToolCall`, the same helper the old
 * below-bubble chip already used) and passes it down instead.
 */
export interface ResultTableProvenanceChip {
  id: string;
  /** Truncated chip text, e.g. "Critical findings · 90d". */
  shortLabel: string;
  /** Untruncated tool name + index + time window, for the chip's `title`/aria-label. */
  fullLabel: string;
  /** Raw tool name (`get_critical_findings`), shown above the JSON in the popover. */
  toolName: string;
  /** The call's real-form arguments, shown verbatim (copyable) in the popover. */
  argumentsJson: Record<string, unknown>;
  /**
   * Issue #9008 (G2, reworked after review): the concrete index the call queried, shown as a
   * labelled line inside the popover itself rather than only in the chip's hover title — the QA
   * E2E review found the popover unusable for a touch/keyboard reader, who never sees a hover
   * tooltip at all. Sourced straight from `TableSpec.provenance.index` (a server-recorded FACT,
   * `common/types.ts`) via `tool-call-label.ts`'s `describeProvenance` — never inferred
   * client-side. `undefined` when the server recorded no provenance for this call at all (a
   * Manager-API call, or a call other than the one that produced this table — see blocker 3's
   * `toolCallId` match at the call site, message-bubble.tsx).
   */
  index?: string;
  /** Issue #9008 (G2, reworked): the resolved, absolute time range the query actually ran
   * against, straight from `TableSpec.provenance.effectiveRange`. `undefined` whenever the
   * server recorded no `effectiveRange` at all (the query's DSL carried no recognizable
   * time-range clause — most catalog tools have no time concept and this is the correct,
   * fact-based absence, never a substituted default) or a bound could not resolve to an instant.
   */
  resolvedRangeLabel?: string;
  /**
   * Issue #9008 (G3, reworked): "90d" normally, or "90d · requested 720d" once the server reports
   * `provenance.clamped: true` — ONE badge carrying both windows, replacing two separate
   * near-identically-labelled chips that gave the reader no requested-vs-effective distinction.
   * Also mirrored onto the chip's own collapsed `shortLabel` (`describeToolCall`) per the review's
   * major 4: the dual-window text must be visible without opening the popover. `undefined`
   * whenever `resolvedRangeLabel` is (nothing to label a window with).
   */
  windowBadgeLabel?: string;
}

/**
 * The header's provenance chip: an `EuiBadge` that opens a small popover with the tool name and
 * its raw (copyable) JSON arguments on click — replacing the old "click to reveal a raw view
 * rendered BELOW the table it produced" pattern (issue: "provenance after the fact"). Its own
 * open/closed state, not a shared one, so multiple chips on the same table (a turn that ran more
 * than one tool call before landing on this table) never fight over a single popover.
 */
const ProvenanceChip: React.FC<{ chip: ResultTableProvenanceChip }> = ({
  chip,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Issue #9008 (G1) review fix: the QA E2E run found the panel's own "hit escape to close"
  // screen-reader announcement did not hold — Escape left the panel open, focus still on the
  // badge. A single inner handler around only the popover's CHILDREN (the panel content) missed
  // exactly that case: the badge (`button` prop below) is a SIBLING of that content, not a
  // descendant of it, so a keydown while focus is still on the badge never reached it. This one
  // handler is attached to a div wrapping the WHOLE `<EuiPopover>` — button and panel both — so it
  // catches Escape regardless of which of the two currently has focus; React's synthetic events
  // bubble along the COMPONENT tree, which reaches here even though EUI portals the panel
  // elsewhere in the DOM. `stopPropagation` fires ONLY while `isOpen` — issue #9008 review,
  // major 4: an unguarded `stopPropagation` swallowed every Escape this chip ever saw, even one
  // meant for an enclosing surface (a docked sidecar/flyout) while the popover was already
  // closed. Closed, this handler does nothing at all, exactly like having no handler here.
  const closeOnEscape = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation();
      setIsOpen(false);
    }
  };

  return (
    <div onKeyDown={closeOnEscape}>
      <EuiPopover
        panelPaddingSize='s'
        isOpen={isOpen}
        closePopover={() => setIsOpen(false)}
        button={
          <EuiBadge
            color='hollow'
            iconType='search'
            title={chip.fullLabel}
            onClick={() => setIsOpen(previous => !previous)}
            onClickAriaLabel={i18n.translate(
              'wazuhAiAssistant.resultTable.provenanceChipAriaLabel',
              {
                defaultMessage: 'Show the executed query: {label}',
                values: { label: chip.fullLabel },
              },
            )}
            // Belt-and-braces alongside the wrapping div above: focus is still on the badge the
            // instant the popover opens (EUI moves it into the panel only asynchronously), so this
            // catches an Escape pressed in that brief window too.
            onKeyDown={closeOnEscape}
          >
            {chip.shortLabel}
          </EuiBadge>
        }
      >
        <div>
          <EuiText size='xs'>
            <strong>{chip.toolName}</strong>
          </EuiText>
          {/* Issue #9008 (G2): index and resolved time range as labelled lines INSIDE the popover —
              previously only reachable via the chip's own hover `title`, which a touch/keyboard
              reader never sees. Both are rendered only when the server actually reported them
              (`ResultTableProvenanceChip`'s doc comment) — never a client-side guess. */}
          {chip.index && (
            <EuiText size='xs' color='subdued'>
              {i18n.translate('wazuhAiAssistant.resultTable.provenanceIndex', {
                defaultMessage: 'Index: {index}',
                values: { index: chip.index },
              })}
            </EuiText>
          )}
          {chip.resolvedRangeLabel && (
            <EuiText size='xs' color='subdued'>
              {i18n.translate(
                'wazuhAiAssistant.resultTable.provenanceTimeRange',
                {
                  defaultMessage: 'Time range: {range}',
                  values: { range: chip.resolvedRangeLabel },
                },
              )}
            </EuiText>
          )}
          {chip.windowBadgeLabel && (
            <>
              <EuiSpacer size='xs' />
              {/* Issue #9008 (G3): ONE badge stating both the effective and (when clamped) the
                  requested window, e.g. "90d · requested 720d" — see `windowBadgeLabel`'s own doc
                  comment (tool-call-label.ts) for why this replaced two separate near-identical
                  chips. Also shown on the chip's own collapsed label (`describeToolCall`) so a
                  reader never has to open the popover just to see which call was clamped. */}
              <EuiBadge color='hollow'>{chip.windowBadgeLabel}</EuiBadge>
            </>
          )}
          <EuiSpacer size='xs' />
          {/* A tool called with no arguments is a real, common case (`get_agents` with no filter
              means "every agent"), and rendering it as a bare `{}` reads as a failure to capture the
              query rather than as the query itself — it was reported as a bug on sight. Say it in
              words; the code block stays for the case where there is something to read and copy. */}
          {Object.keys(chip.argumentsJson).length === 0 ? (
            <EuiText size='xs' color='subdued'>
              {i18n.translate(
                'wazuhAiAssistant.resultTable.provenanceNoArguments',
                {
                  defaultMessage: 'Called with no parameters.',
                },
              )}
            </EuiText>
          ) : (
            <EuiCodeBlock
              language='json'
              paddingSize='s'
              fontSize='s'
              isCopyable
            >
              {JSON.stringify(chip.argumentsJson, null, 2)}
            </EuiCodeBlock>
          )}
        </div>
      </EuiPopover>
    </div>
  );
};

interface ResultTableProps {
  spec: TableSpec;
  /** Builds the "Open in Discover" URL for this spec; omitted (or resolving to `null`) simply
   * means no link renders — see discover-link.tsx. Optional so any other/future ResultTable call
   * site never has to supply it. */
  resolveDiscoverUrl?: ResolveDiscoverUrl;
  /** Builds the "Open in Security Analytics" URL for this spec; omitted (or resolving to `null`)
   * simply means no link renders — see security-analytics-link.tsx. Optional for the same reason
   * as `resolveDiscoverUrl` above. */
  resolveSecurityAnalyticsUrl?: ResolveSecurityAnalyticsUrl;
  /** Header chips for the tool call(s) that produced this table — see
   * `ResultTableProvenanceChip`'s doc comment. Optional/omittable: a table rendered with no known
   * provenance (or from a future call site) simply shows no chip, same as it shows no Discover
   * link when `resolveDiscoverUrl` is omitted. */
  provenanceChips?: ResultTableProvenanceChip[];
  /**
   * Real measured height (px) of the scrolling transcript pane, for layout contract §4's card
   * height ceiling (`measuredCardMaxHeight` below) — the card can never claim more than the pane
   * it actually lives in. chat-page.tsx measures the pane with a `ResizeObserver` and threads the
   * result straight through MessageList → MessageBubble → here (confirmed by reading it — see its
   * `transcriptHeightPx` state). Still optional: jsdom has no `ResizeObserver`, so it stays
   * `undefined` in tests and the stylesheet's own fallback cap applies there.
   */
  transcriptHeightPx?: number;
  /**
   * Fired when the reader changes the rows-per-page control (item 3, "card grows"). The card grows
   * downward when a larger page size is picked, but the card lives INSIDE chat-page.tsx's scrolling
   * transcript pane, and that pane only re-pins to its bottom on a `messages` change — a page-size
   * pick is internal `ResultTable` state, so nothing re-pinned and the freshly-grown pagination
   * footer slid below the fold, behind the composer, until the reader manually scrolled. chat-page
   * hands this down so it can re-pin the pane (only when the reader was already following the
   * bottom) right after the card has grown. Optional: a call site with no scrolling pane to re-pin
   * (or a unit test) simply omits it.
   */
  onRowsPerPageChange?: () => void;
}

/**
 * Renders a `table` stream event: spec-driven, with a severity column and expandable rows, inside
 * a card whose header and pagination are pinned rows and whose body is the only thing that
 * scrolls (layout contract §4 — the acceptance check this exists for is "page 2 of 6 [must be]
 * reachable without resizing the window").
 */
const ResultTableInner: React.FC<ResultTableProps> = ({
  spec,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
  provenanceChips,
  transcriptHeightPx,
  onRowsPerPageChange,
}) => {
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
  // Stable across re-renders of the SAME mounted table (a later spec on the same tool round would
  // still be the same card instance) — htmlIdGenerator is only invoked once per mount.
  const bodyId = useMemo(() => htmlIdGenerator('wzAiResultTableBody')(), []);

  const initiallyOpen = spec.rows.length <= AUTO_EXPAND_ROW_THRESHOLD;
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  // Lazy-mount (perf): the body/footer divs below render nothing until the card has EVER been
  // opened once (starting `true` when `initiallyOpen` already counts as opened) — a collapsed
  // 500-row table costs 500 DOM rows for nothing otherwise. Once flipped `true` it never flips
  // back, so re-collapsing later hides the body via CSS (`display: none`) instead of unmounting
  // it, which is what preserves scroll position/expanded rows across a collapse/reopen.
  const [hasOpened, setHasOpened] = useState(initiallyOpen);

  const toggleOpen = () => {
    setIsOpen(previous => {
      const next = !previous;
      if (next) {
        setHasOpened(true);
      }
      return next;
    });
  };

  // Pagination (perf): caps the DOM to one page of rows at a time instead of all 500.
  // Row ids (`__rowId`, assigned below over the FULL `spec.rows` before slicing) are global
  // indexes, so `itemIdToExpandedRowMap` and the expander column stay correct across pages —
  // paging never renumbers a row. Initial size only (see `transcriptHeightPx`'s doc comment).
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  // Set ONLY by `handlePageSizeChange` below — i.e. only by the reader actually picking a size in
  // the footer control — never by the default page size itself, so a 10-row default never counts
  // as a user "opting in" to the expanded card ceiling below.
  const [userPickedPageSize, setUserPickedPageSize] = useState(false);

  // Unlike the page size above, this one IS a live binding: re-capping the card as the transcript
  // resizes costs the reader nothing (the body simply scrolls), whereas re-paginating under them
  // would silently renumber the page they are reading. Left `undefined` when nothing has been
  // measured (jsdom has no ResizeObserver, so `transcriptHeightPx` stays 0 there) — the stylesheet's
  // own `min(460px, 52dvh)` then applies exactly as before.
  // "Card grows" (iteration-4 item 3): once the reader has explicitly chosen a page size above
  // the default (`userPickedPageSize`, NOT merely the size having drifted above it), the ceiling
  // this clamps against switches to the expanded twin — see that constant's own doc comment for
  // why 900px is a safe ceiling rather than a real ceiling.
  const isExpanded = userPickedPageSize && pageSize > DEFAULT_PAGE_SIZE;
  const cardMaxHeightCeilingPx = isExpanded
    ? RESULTS_CARD_MAX_HEIGHT_EXPANDED_PX
    : RESULTS_CARD_MAX_HEIGHT_PX;

  // Live cap guard (iteration-4 item 3, part C). The ceiling below is clamped against the
  // transcript pane's height so the card never grows past the space left above the composer.
  // `transcriptHeightPx` (the prop) is that height as chat-page.tsx measures it — but it reaches
  // here only after chat-page's own `ResizeObserver` fires AND the new number propagates back down
  // through two memoized components (MessageList, MessageBubble). On a fast viewport shrink that lag
  // would leave the card holding a ceiling taller than the pane now is, and its footer would clip
  // below the fold again. So the card ALSO measures its own scroll container directly and the cap
  // uses the SMALLER of the two, self-correcting regardless of prop-propagation timing. Inert in
  // jsdom (no `ResizeObserver`, and the unit tests render the card with no `.wzChatTranscript`
  // ancestor), so `livePaneHeightPx` stays `undefined` there and the prop-only path — and the
  // stylesheet fallback when even that is absent — behaves exactly as before.
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [livePaneHeightPx, setLivePaneHeightPx] = useState<number | undefined>(
    undefined,
  );
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === 'undefined') {
      return;
    }
    const pane = card.closest('.wzChatTranscript') as HTMLElement | null;
    if (!pane) {
      return;
    }
    const measure = () => setLivePaneHeightPx(pane.clientHeight);
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    measure();
    return () => observer.disconnect();
  }, []);

  // Issue #9009 (J1): the card's OWN measured width, for narrow-mode column reduction. Deliberately
  // the component's own width, not the viewport — the same generic renderer mounts full-page and
  // inside the AI Assistant sidecar (as narrow as ~480px in the QA E2E review), and only the
  // container it actually lives in can tell those two apart. Same guarded pattern as the pane
  // height effect above (and the rest of this plugin, e.g. chat-page.tsx's rail-width measurement):
  // jsdom has no `ResizeObserver`, so `quantizedWidthPx` stays `0` and every existing test renders
  // in (non-narrow) full-width mode, matching what they already assert.
  //
  // Stores the QUANTIZED width, not a derived boolean (issue #9009 follow-up) — see
  // `WIDTH_QUANTUM_PX`'s doc comment for why: the render-storm concern that used to justify storing
  // only a boolean still applies, but the threshold itself now depends on the spec's column count
  // (`candidateColumnCount` below), which the observer callback has no way to know, so the boolean
  // can no longer be computed in here. `isNarrow` is derived from this quantized width at render
  // time instead, below.
  const [quantizedWidthPx, setQuantizedWidthPx] = useState(0);
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === 'undefined') {
      return;
    }
    const measure = () => {
      const quantized = quantizeWidthPx(card.offsetWidth);
      // Same early-out as the old boolean version: a resize that doesn't cross a 40px bucket
      // boundary sets identical state and triggers no re-render.
      setQuantizedWidthPx(previous =>
        previous === quantized ? previous : quantized,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    measure();
    return () => observer.disconnect();
  }, []);

  /**
   * Issue #9009 (J1, follow-up): how many columns the spec would show at FULL width — the same
   * `MAX_VISIBLE_COLUMNS` budget `effectiveMaxVisibleColumns` below applies, computed here first
   * because narrow mode's own threshold depends on it. Deliberately the full-mode count, not the
   * raw `spec.columns.length` — a 20-column spec is already capped to `MAX_VISIBLE_COLUMNS` at
   * full width, so its narrow threshold should be sized for the columns that would actually
   * render, not for columns nothing ever shows a `<th>` for.
   */
  const candidateColumnCount = Math.min(
    spec.columns.length,
    MAX_VISIBLE_COLUMNS,
  );

  // Issue #9009 (J1, follow-up): adaptive threshold — narrow mode triggers whenever the card
  // cannot give each candidate column at least `MIN_COLUMN_WIDTH_PX`, rather than at one fixed
  // pixel width regardless of column count (see `MIN_COLUMN_WIDTH_PX`'s doc comment for the live
  // finding this replaces). `quantizedWidthPx === 0` means "not yet measured" (jsdom, or before
  // the observer's first callback), same sentinel the old `width > 0` guard used.
  const isNarrow =
    quantizedWidthPx > 0 &&
    quantizedWidthPx < candidateColumnCount * MIN_COLUMN_WIDTH_PX;

  // The most conservative measured pane height: the card can never claim more than the pane it
  // actually lives in, whichever source reported the smaller number. Zero when nothing has been
  // measured (both the prop and the live reading absent), which keeps the stylesheet fallback in
  // charge — see `measuredCardMaxHeight` below.
  const measuredPaneHeightPx = useMemo(() => {
    const measured = [transcriptHeightPx, livePaneHeightPx].filter(
      (value): value is number => typeof value === 'number' && value > 0,
    );
    return measured.length > 0 ? Math.min(...measured) : 0;
  }, [transcriptHeightPx, livePaneHeightPx]);

  const measuredCardMaxHeight = useMemo<React.CSSProperties | undefined>(
    () =>
      measuredPaneHeightPx
        ? {
            maxHeight: Math.max(
              RESULTS_CARD_MIN_HEIGHT_PX,
              Math.min(
                cardMaxHeightCeilingPx,
                measuredPaneHeightPx - RESULTS_CARD_TRANSCRIPT_RESERVE_PX,
              ),
            ),
          }
        : undefined,
    [measuredPaneHeightPx, cardMaxHeightCeilingPx],
  );

  // Scrolling body ref (iteration-4 item 3). The actual scroll-to-top reset lives in the
  // `useLayoutEffect` below, keyed on `[safePageIndex, pageSize]` — that runs for a page-size
  // change (including going back to the default) AND for a plain next/previous-page click, which
  // used to leave the body scrolled wherever it was on the PREVIOUS page.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const handlePageSizeChange = (size: number) => {
    setUserPickedPageSize(true);
    setPageSize(size);
    setPageIndex(0);
    // Tell chat-page the card is about to grow/shrink so it can re-pin the transcript to the new
    // bottom (only if the reader was already following it) — otherwise a larger page size grows the
    // card downward and its pinned footer lands behind the composer until a manual scroll. Fired in
    // the same event as the state changes above, so React commits the grown card and chat-page's
    // re-pin in one pass (chat-page reads the pane's height AFTER the growth). See this prop's own
    // doc comment.
    onRowsPerPageChange?.();
  };

  /**
   * Whether the pagination footer has anything to offer. Issue #9009 (A4): compared against the
   * CURRENT page size rather than the smallest offered option — at or below it, the whole result
   * already fits on one page, so there is nothing to page and no reason to show the "Page 1 of 1"
   * control the QA E2E review flagged as noise (a one-row table used to render the full "Rows per
   * page: 5 10 25 50" footer for nothing). With the default page size now 10, this is also what
   * hides the pager for the 6-10 row results whose off-page rows previously produced a factually
   * wrong AI summary (the finding this fix exists for).
   *
   * The second clause (review, MAJOR-1) covers a trapdoor the first clause alone falls into: a
   * reader who explicitly PICKS a page size that happens to be >= the row count (e.g. 25 rows,
   * pick page size 25) would otherwise make `spec.rows.length > pageSize` false and unmount the
   * WHOLE footer — including the size selector itself — with no way back to a smaller size short
   * of a remount. Once the reader has ever picked a size (`userPickedPageSize`), the footer stays
   * as long as the result exceeds the SMALLEST offered option, so the selector that got them into
   * this state can always get them back out of it.
   */
  const needsPagination =
    spec.rows.length > pageSize ||
    (userPickedPageSize && spec.rows.length > PAGE_SIZE_OPTIONS[0]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRowIds(previous => {
      const next = new Set(previous);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  // Expander column split out from the field columns (perf): it's the only column whose `render`
  // depends on `expandedRowIds`, so memoizing it separately from the field columns means typing-
  // driven or paging-driven re-renders don't have to rebuild the field-column definitions too.
  const expanderColumn: EuiBasicTableColumn<ResultRow> = useMemo(
    () => ({
      name: '',
      align: 'right' as const,
      width: '40px',
      isExpander: true,
      render: (valueOrRow: unknown, maybeRow?: Record<string, unknown>) => {
        // EuiBasicTable calls a field-less (computed) column's render with the ITEM as the first
        // and ONLY argument — a field column gets (value, item). This column has no `field`, so
        // the row arrives first and the old `(_value, row)` signature read `__rowId` off
        // `undefined`, throwing during render and unmounting the whole chat page (blank screen).
        // Accept both shapes so an EUI behavior change can never crash the app from here again.
        const row = (maybeRow ?? valueOrRow) as
          | Record<string, unknown>
          | null
          | undefined;
        const rowIndex = Number(row?.__rowId);
        if (!Number.isFinite(rowIndex)) {
          return null;
        }
        // Issue #9009 (A3): the toggle used to keep the aria-label 'Expand row' after opening and
        // exposed no `aria-expanded`, so neither a screen-reader nor a returning user could tell an
        // open row from a closed one from the control itself — the same pattern the providers table
        // (settings-page.tsx) already gets right: flip the accessible name AND set `aria-expanded`.
        const isRowExpanded = expandedRowIds.has(rowIndex);
        return (
          <EuiButtonIcon
            onClick={() => toggleRow(rowIndex)}
            aria-label={
              isRowExpanded
                ? i18n.translate('wazuhAiAssistant.resultTable.collapseRow', {
                    defaultMessage: 'Collapse row',
                  })
                : i18n.translate('wazuhAiAssistant.resultTable.expandRow', {
                    defaultMessage: 'Expand row',
                  })
            }
            aria-expanded={isRowExpanded}
            // Review, required minor: only set once the target actually exists in the DOM — the
            // `itemIdToExpandedRowMap` entry (and its matching `id`) below is only populated for a
            // row that IS expanded, so pointing at it while collapsed would reference nothing.
            aria-controls={
              isRowExpanded ? `${bodyId}-expanded-row-${rowIndex}` : undefined
            }
            iconType={isRowExpanded ? 'arrowUp' : 'arrowDown'}
          />
        );
      },
    }),
    [expandedRowIds, bodyId],
  );

  // Column widths and timestamp formatting are DISPLAY concerns only — same columns, same values,
  // same order as the spec asked for. Without them EuiBasicTable divides the width evenly and
  // renders every value verbatim, so a raw ISO instant wrapped onto three lines and dragged every
  // row's height with it, while the free-text title column (the one that actually needs room) got
  // no more space than the severity word beside it.
  // Only the first MAX_VISIBLE_COLUMNS spec columns become visible table columns — see that
  // constant's doc comment. `spec.rows` is untouched (every spec-column field is still in each
  // row object), so a hidden column stays reachable through the row expander below.
  // Issue #9009 (J1): narrow mode shrinks the visible-column budget further, from 6 down to 3 —
  // "first 2-3 columns from the tool's existing column order" — reusing the exact same
  // demoted-not-deleted mechanism `MAX_VISIBLE_COLUMNS` already relies on: a column past the
  // budget stays reachable through the row expander below, it just doesn't get its own <th>.
  const effectiveMaxVisibleColumns = isNarrow
    ? Math.min(NARROW_MAX_VISIBLE_COLUMNS, MAX_VISIBLE_COLUMNS)
    : MAX_VISIBLE_COLUMNS;
  const visibleColumns = useMemo(
    () => spec.columns.slice(0, effectiveMaxVisibleColumns),
    [spec.columns, effectiveMaxVisibleColumns],
  );
  const hiddenColumnCount = Math.max(
    0,
    spec.columns.length - effectiveMaxVisibleColumns,
  );

  const fieldColumns: EuiBasicTableColumn<ResultRow>[] = useMemo(
    () =>
      visibleColumns.map(column => {
        if (column.id === spec.severityColumn) {
          return {
            field: column.id,
            name: column.label,
            width: SEVERITY_COLUMN_WIDTH,
            render: (value: unknown) =>
              isAbsentValue(value)
                ? renderAbsentPlaceholder()
                : renderSeverityBadge(value),
          };
        }
        if (isTimestampColumn(spec.rows, column.id)) {
          return {
            field: column.id,
            name: column.label,
            width: TIMESTAMP_COLUMN_WIDTH,
            render: (value: unknown) => {
              if (isAbsentValue(value)) {
                return renderAbsentPlaceholder();
              }
              // The unabbreviated instant stays one hover away, so precision is deferred rather
              // than discarded.
              return typeof value === 'string' ? (
                <span title={value}>{formatTimestamp(value)}</span>
              ) : (
                String(value)
              );
            },
          };
        }

        return {
          field: column.id,
          name: column.label,
          // A column whose every value is short gets a matching short width, so the ONE free-text
          // column in a findings table (the rule/finding title) inherits all the leftover room
          // instead of the fixed layout dividing it evenly. The live audit (§3.4) measured the
          // even split as three identical 324px slabs holding an agent name and a category each,
          // while the title beside them wrapped onto three lines. Data-driven rather than keyed to
          // field names: this renderer is generic (any tool's spec), so "how wide should this be"
          // can only come from what the column actually holds — the same way the timestamp and
          // severity cases above are detected rather than declared.
          ...(isShortValueColumn(spec.rows, column.id)
            ? { width: SHORT_COLUMN_WIDTH }
            : {}),
          // Issue #9009 (J1): narrow mode truncates the free-text columns with a tooltip instead of
          // wrapping — the reproduction was cells wrapping onto several lines at ~480px, making the
          // whole table unreadable. Full width keeps the existing renderer unchanged.
          render: isNarrow ? renderNarrowTruncatedCell : renderDefaultCell,
        };
      }),
    [visibleColumns, spec.severityColumn, spec.rows, isNarrow],
  );

  const columns: EuiBasicTableColumn<ResultRow>[] = useMemo(
    () => [...fieldColumns, expanderColumn],
    [fieldColumns, expanderColumn],
  );

  // Rebuilding a 500-entry map/array on every render (e.g. every keystroke re-render this table
  // would otherwise still take, or a page/expand-toggle click) is wasted work once the underlying
  // data hasn't changed — memoized on exactly the state each one actually depends on.
  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, React.ReactNode> = {};
    spec.rows.forEach((row, rowIndex) => {
      if (expandedRowIds.has(rowIndex)) {
        // Same raw-JSON treatment as the provenance chips' popover (above): a proper EuiCodeBlock
        // instead of a bare <pre>, with copy support. No `overflowHeight`: that would put a
        // scrollbar inside an expanded row inside the card's own scrolling body, and this content
        // only exists because the reader deliberately expanded the row — cutting it off behind a
        // third scrollbar defeats the click they just made. EuiCodeBlock's own fullscreen control
        // handles a genuinely huge document.
        // `id` (review, required minor): lets the expander button's own `aria-controls` point at
        // exactly this content, the same relationship EUI's own expanding-row examples establish.
        map[String(rowIndex)] = (
          <div id={`${bodyId}-expanded-row-${rowIndex}`}>
            <EuiCodeBlock
              language='json'
              paddingSize='s'
              fontSize='s'
              isCopyable
            >
              {JSON.stringify(row, null, 2)}
            </EuiCodeBlock>
          </div>
        );
      }
    });
    return map;
  }, [spec.rows, expandedRowIds, bodyId]);

  const items = useMemo(
    () =>
      spec.rows.map((row, rowIndex) => ({ ...row, __rowId: String(rowIndex) })),
    [spec.rows],
  );

  // Pagination slice: `items` carries GLOBAL `__rowId`s assigned above (before slicing), so
  // `itemIdToExpandedRowMap` (keyed the same way) and the expander column's `expandedRowIds`
  // lookup stay correct for whichever page is currently sliced into view.
  const pageCount = Math.max(1, Math.ceil(spec.rows.length / pageSize));
  // `pageIndex` is component state, and this component SURVIVES a spec swap: chat-page.tsx replaces
  // `message.table` on the same message id at the same tree position (a refined re-run of the same
  // question), so a reader sitting on page 6 of a 26-row result would otherwise slice past the end
  // of a new 8-row one — an empty body under "Page 6 of 2", with Next disabled.
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  // Resets the scrolling body to its top for EITHER trigger that changes which rows are on
  // screen: a page-size change (`pageSize`) or a plain next/previous-page click (`safePageIndex`)
  // — a `useLayoutEffect` rather than the event handlers themselves because `safePageIndex` (not
  // the `pageIndex` state the click handlers set) is the value that actually decides what is
  // rendered, and running before paint avoids a visible scrolled-then-snapped-to-top flash.
  useLayoutEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [safePageIndex, pageSize]);

  const pageStart = safePageIndex * pageSize;
  const pagedItems = useMemo(
    () => items.slice(pageStart, pageStart + pageSize),
    [items, pageStart, pageSize],
  );

  // Issue #9009 (A1): EuiBasicTable's own default screen-reader caption is built from `items`
  // alone — the CURRENT page's rows, since this component paginates by hand rather than through
  // EuiBasicTable's own `pagination` prop — so a screen-reader user was told "This table contains
  // 5 rows" on a 6-row result while the visible header said "Results (6 rows)". An explicit
  // `tableCaption` always states the TOTAL (with the same plural handling as `titleText` above),
  // plus the page position whenever the result actually spans more than one page.
  //
  // Review, required minor: `tableCaptionPaged` is its OWN self-contained message with every
  // value as a plain ICU argument, rather than interpolating the ALREADY-TRANSLATED
  // `tableCaptionTotal` string into it — nesting one translated string inside another freezes the
  // sentence order the first translator chose, leaving a later translator no way to reorder
  // "total" relative to "showing rows X-Y" for their language's grammar.
  const tableCaption =
    pageCount > 1
      ? i18n.translate('wazuhAiAssistant.resultTable.tableCaptionPaged', {
          defaultMessage:
            'This table contains {total, plural, one {# row} other {# rows}}. ' +
            'Showing rows {start}-{end}, page {page} of {pageCount}.',
          values: {
            total: spec.rows.length,
            start: pageStart + 1,
            end: Math.min(pageStart + pageSize, spec.rows.length),
            page: safePageIndex + 1,
            pageCount,
          },
        })
      : i18n.translate('wazuhAiAssistant.resultTable.tableCaptionTotal', {
          defaultMessage:
            'This table contains {total, plural, one {# row} other {# rows}}.',
          values: { total: spec.rows.length },
        });

  const titleText =
    // Issue #9009 (A2): was a literal 'Results ({count} rows)' with no plural handling — a
    // single-row result read as the ungrammatical 'Results (1 rows)'. ICU plural via i18n.
    i18n.translate('wazuhAiAssistant.resultTable.accordionSummary', {
      defaultMessage: 'Results ({count, plural, one {# row} other {# rows}})',
      values: { count: spec.rows.length },
    }) +
    // Column-budget disclosure (issue #8921): a column demoted past MAX_VISIBLE_COLUMNS is NOT
    // deleted — buildTableSpec (digest.ts) still puts its field into every row — so this tells
    // the reader where to find it instead of leaving its disappearance unexplained.
    (hiddenColumnCount > 0
      ? i18n.translate('wazuhAiAssistant.resultTable.hiddenColumnsNote', {
          defaultMessage:
            ' (+{count, plural, one {# more field} other {# more fields}}' +
            ' per row. Expand a row to see them.)',
          values: { count: hiddenColumnCount },
        })
      : '');

  const headerActions =
    (provenanceChips && provenanceChips.length > 0) ||
    (resolveDiscoverUrl && spec.discover) ||
    (resolveSecurityAnalyticsUrl && spec.securityAnalyticsLink) ? (
      <EuiFlexGroup
        gutterSize='s'
        responsive={false}
        alignItems='center'
        wrap
        className='wzResultsCardActions'
      >
        {(provenanceChips ?? []).map(chip => (
          <EuiFlexItem grow={false} key={chip.id}>
            <ProvenanceChip chip={chip} />
          </EuiFlexItem>
        ))}
        {resolveDiscoverUrl && spec.discover ? (
          <EuiFlexItem grow={false}>
            <DiscoverLink spec={spec} resolveDiscoverUrl={resolveDiscoverUrl} />
          </EuiFlexItem>
        ) : null}
        {resolveSecurityAnalyticsUrl && spec.securityAnalyticsLink ? (
          <EuiFlexItem grow={false}>
            <SecurityAnalyticsLink
              spec={spec}
              resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
            />
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    ) : null;

  return (
    // Layout contract §4: `grid-template-rows: auto minmax(0,1fr) auto` with a capped max-height —
    // header and the pagination footer are pinned grid rows, only `.wzResultsCardBody` (the
    // middle, `minmax(0,1fr)` row) scrolls. This is a plain styled `div`, not `EuiPanel` — EuiPanel
    // wraps its content in markup this component does not control, which fought the exact 3-row
    // grid this fix depends on; `wzResultsCard` (result-table.scss) applies the same bordered,
    // shadowless look via the shared `wzPanel` mixin instead, so the visual result is identical.
    <div
      ref={cardRef}
      className={
        isExpanded ? 'wzResultsCard wzResultsCard--expanded' : 'wzResultsCard'
      }
      style={measuredCardMaxHeight}
    >
      <div className='wzResultsCardHeader'>
        <button
          type='button'
          className='wzResultsCardToggle'
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-controls={bodyId}
        >
          <EuiIcon
            type={isOpen ? 'arrowDown' : 'arrowRight'}
            aria-hidden='true'
          />
          <span>{titleText}</span>
        </button>
        {headerActions}
      </div>
      {hasOpened ? (
        <div
          ref={bodyRef}
          id={bodyId}
          className='wzResultsCardBody'
          // `display: none` (not unmounting) once collapsed again — same lazy-mount contract as
          // before, just expressed as CSS visibility instead of an accordion's own internal one,
          // since this component no longer uses EuiAccordion (see the wrapper comment above).
          style={{ display: isOpen ? undefined : 'none' }}
        >
          <EuiBasicTable
            items={pagedItems}
            columns={columns}
            itemId='__rowId'
            itemIdToExpandedRowMap={itemIdToExpandedRowMap}
            isExpandable
            hasActions
            tableCaption={tableCaption}
          />
        </div>
      ) : null}
      {hasOpened && needsPagination ? (
        <div
          className='wzResultsCardFooter'
          style={{ display: isOpen ? undefined : 'none' }}
        >
          {/* Hand-built pagination (not EuiTablePagination): pinned in its own grid row
              (`wzResultsCardFooter`, never inside the scrolling body) is the acceptance check this
              whole rewrite exists for — "page 2 of 6 [must be] reachable without resizing the
              window" — and a hand-built footer keeps that pinned-row placement fully under this
              component's own control rather than however EuiTablePagination happens to lay itself
              out. Every element used below (EuiButtonIcon/EuiButtonEmpty/EuiText) is already
              used/verified elsewhere in this same file. */}
          <EuiFlexGroup
            responsive={false}
            alignItems='center'
            justifyContent='spaceBetween'
            gutterSize='s'
          >
            <EuiFlexItem grow={false}>
              <EuiFlexGroup
                responsive={false}
                alignItems='center'
                gutterSize='xs'
              >
                <EuiFlexItem grow={false}>
                  <EuiText size='xs' color='subdued'>
                    {i18n.translate(
                      'wazuhAiAssistant.resultTable.pageSizeLabel',
                      {
                        defaultMessage: 'Rows per page:',
                      },
                    )}
                  </EuiText>
                </EuiFlexItem>
                {PAGE_SIZE_OPTIONS.map(size => (
                  <EuiFlexItem grow={false} key={size}>
                    <EuiButtonEmpty
                      size='xs'
                      color={pageSize === size ? 'primary' : 'text'}
                      onClick={() => handlePageSizeChange(size)}
                    >
                      {size}
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup
                responsive={false}
                alignItems='center'
                gutterSize='xs'
              >
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType='arrowLeft'
                    size='s'
                    aria-label={i18n.translate(
                      'wazuhAiAssistant.resultTable.previousPage',
                      {
                        defaultMessage: 'Previous page',
                      },
                    )}
                    isDisabled={safePageIndex === 0}
                    onClick={() =>
                      setPageIndex(previous => Math.max(0, previous - 1))
                    }
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size='xs' color='subdued'>
                    {i18n.translate(
                      'wazuhAiAssistant.resultTable.pageOfPages',
                      {
                        defaultMessage: 'Page {page} of {total}',
                        values: { page: safePageIndex + 1, total: pageCount },
                      },
                    )}
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType='arrowRight'
                    size='s'
                    aria-label={i18n.translate(
                      'wazuhAiAssistant.resultTable.nextPage',
                      {
                        defaultMessage: 'Next page',
                      },
                    )}
                    isDisabled={safePageIndex >= pageCount - 1}
                    onClick={() =>
                      setPageIndex(previous =>
                        Math.min(pageCount - 1, previous + 1),
                      )
                    }
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      ) : null}
    </div>
  );
};

interface ResultTableBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary around the table renderer: a table spec the renderer cannot cope with (or an EUI
 * behavior change like the computed-column render signature above) must degrade to a small inline
 * warning inside the one message bubble, never unmount the whole chat page. Streamed tool results
 * are model-shaped data, so this component is the one place in the chat UI that renders content we
 * do not fully control.
 */
class ResultTableBoundary extends React.Component<
  ResultTableProps,
  ResultTableBoundaryState
> {
  constructor(props: ResultTableProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ResultTableBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: ResultTableProps): void {
    // A new spec (next tool round in the same bubble) gets a fresh chance to render.
    if (previousProps.spec !== this.props.spec && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <EuiCallOut
          size='s'
          color='warning'
          iconType='alert'
          title={i18n.translate('wazuhAiAssistant.resultTable.renderError', {
            defaultMessage: 'This result table could not be displayed.',
          })}
        />
      );
    }
    return (
      <ResultTableInner
        spec={this.props.spec}
        resolveDiscoverUrl={this.props.resolveDiscoverUrl}
        resolveSecurityAnalyticsUrl={this.props.resolveSecurityAnalyticsUrl}
        provenanceChips={this.props.provenanceChips}
        transcriptHeightPx={this.props.transcriptHeightPx}
        onRowsPerPageChange={this.props.onRowsPerPageChange}
      />
    );
  }
}

export const ResultTable: React.FC<ResultTableProps> = ({
  spec,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
  provenanceChips,
  transcriptHeightPx,
  onRowsPerPageChange,
}) => (
  <ResultTableBoundary
    spec={spec}
    resolveDiscoverUrl={resolveDiscoverUrl}
    resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
    provenanceChips={provenanceChips}
    transcriptHeightPx={transcriptHeightPx}
    onRowsPerPageChange={onRowsPerPageChange}
  />
);
