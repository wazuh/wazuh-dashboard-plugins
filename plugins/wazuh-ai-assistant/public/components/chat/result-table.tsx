import React, { useMemo, useState } from 'react';
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
 * Five, not twenty-five: the page size IS the height control now that the table body scrolls
 * inside a height-capped card (layout contract §4) rather than growing unbounded. Five rows answer
 * "what did it find?" inside the conversation without needing the card's own scroll, and the
 * reader can page through or open the full set in Discover. It also keeps the DOM small for a
 * 500-row result, which is why pagination was here to begin with. `TALL_TRANSCRIPT_PAGE_SIZE` is
 * the "steps 5 → 10 above 900px of transcript height" half of that same contract point — see
 * `transcriptHeightPx` below for why it is only ever a STARTING default, not a live-resize.
 */
const DEFAULT_PAGE_SIZE = 5;
const TALL_TRANSCRIPT_PAGE_SIZE = 10;
const TALL_TRANSCRIPT_HEIGHT_PX = 900;
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

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

function renderSeverityBadge(value: unknown): React.ReactNode {
  const word = String(value ?? '').toLowerCase();
  // Look up directly in SEVERITY_BUCKETS (the single source of truth for what's renderable)
  // instead of checking membership in SEVERITY_LEVELS first and casting — two collections
  // staying in sync is an assumption this can't verify at runtime, an object property lookup
  // can't throw, and `bucket` being `undefined` is a normal, handled outcome either way.
  const bucket = SEVERITY_BUCKETS[word as SeverityLevel] as
    | { color: string; label: string }
    | undefined;
  if (!bucket) {
    return <EuiBadge color='default'>{String(value ?? '')}</EuiBadge>;
  }
  return <EuiBadge color={bucket.color}>{bucket.label}</EuiBadge>;
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
  return (
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
        >
          {chip.shortLabel}
        </EuiBadge>
      }
    >
      <EuiText size='xs'>
        <strong>{chip.toolName}</strong>
      </EuiText>
      <EuiSpacer size='xs' />
      {/* A tool called with no arguments is a real, common case (`get_agents` with no filter means
          "every agent"), and rendering it as a bare `{}` reads as a failure to capture the query
          rather than as the query itself — it was reported as a bug on sight. Say it in words; the
          code block stays for the case where there is something to read and copy. */}
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
        <EuiCodeBlock language='json' paddingSize='s' fontSize='s' isCopyable>
          {JSON.stringify(chip.argumentsJson, null, 2)}
        </EuiCodeBlock>
      )}
    </EuiPopover>
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
   * Real measured height (px) of the scrolling transcript pane, for layout contract §4's "page
   * size steps 5 → 10 above 900px of transcript height". Optional and currently never supplied by
   * chat-page.tsx (confirmed by reading it — no such measurement exists there yet), so this stays
   * a no-op today and the pre-redesign default of 5 is exactly preserved; once chat-page.tsx grows
   * a transcript-height measurement it can thread it straight through MessageList → MessageBubble
   * → here with no further change on this end. Read only ONCE, to pick the table's INITIAL page
   * size — not a live-resize binding, so a reader mid-way through a wide window resize never has
   * their current page silently renumbered underneath them.
   */
  transcriptHeightPx?: number;
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
  const [pageSize, setPageSize] = useState(() =>
    transcriptHeightPx && transcriptHeightPx > TALL_TRANSCRIPT_HEIGHT_PX
      ? TALL_TRANSCRIPT_PAGE_SIZE
      : DEFAULT_PAGE_SIZE,
  );

  // Unlike the page size above, this one IS a live binding: re-capping the card as the transcript
  // resizes costs the reader nothing (the body simply scrolls), whereas re-paginating under them
  // would silently renumber the page they are reading. Left `undefined` when nothing has been
  // measured (jsdom has no ResizeObserver, so `transcriptHeightPx` stays 0 there) — the stylesheet's
  // own `min(460px, 52dvh)` then applies exactly as before.
  const measuredCardMaxHeight = useMemo<React.CSSProperties | undefined>(
    () =>
      transcriptHeightPx
        ? {
            maxHeight: Math.max(
              RESULTS_CARD_MIN_HEIGHT_PX,
              Math.min(
                RESULTS_CARD_MAX_HEIGHT_PX,
                transcriptHeightPx - RESULTS_CARD_TRANSCRIPT_RESERVE_PX,
              ),
            ),
          }
        : undefined,
    [transcriptHeightPx],
  );

  /**
   * Whether the pagination footer has anything to offer. The footer used to render for ANY
   * non-empty result, so a one-row table still got "Rows per page: 5 10 25 50" and "Page 1 of 1":
   * four controls that cannot change what is on screen, since every offered size already holds the
   * whole result. Only the empty case was suppressed.
   *
   * Compared against the SMALLEST offered size rather than the current one: at or below it, no
   * choice of page size produces a second page, so there is nothing to page and nothing to resize.
   * Above it, the footer earns its row even when the current size happens to fit everything —
   * picking a smaller size is then a real action.
   */
  const needsPagination = spec.rows.length > PAGE_SIZE_OPTIONS[0];

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
        return (
          <EuiButtonIcon
            onClick={() => toggleRow(rowIndex)}
            aria-label={i18n.translate(
              'wazuhAiAssistant.resultTable.expandRow',
              {
                defaultMessage: 'Expand row',
              },
            )}
            iconType={expandedRowIds.has(rowIndex) ? 'arrowUp' : 'arrowDown'}
          />
        );
      },
    }),
    [expandedRowIds],
  );

  // Column widths and timestamp formatting are DISPLAY concerns only — same columns, same values,
  // same order as the spec asked for. Without them EuiBasicTable divides the width evenly and
  // renders every value verbatim, so a raw ISO instant wrapped onto three lines and dragged every
  // row's height with it, while the free-text title column (the one that actually needs room) got
  // no more space than the severity word beside it.
  // Only the first MAX_VISIBLE_COLUMNS spec columns become visible table columns — see that
  // constant's doc comment. `spec.rows` is untouched (every spec-column field is still in each
  // row object), so a hidden column stays reachable through the row expander below.
  const visibleColumns = useMemo(
    () => spec.columns.slice(0, MAX_VISIBLE_COLUMNS),
    [spec.columns],
  );
  const hiddenColumnCount = Math.max(
    0,
    spec.columns.length - MAX_VISIBLE_COLUMNS,
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
          render: renderDefaultCell,
        };
      }),
    [visibleColumns, spec.severityColumn, spec.rows],
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
        map[String(rowIndex)] = (
          <EuiCodeBlock language='json' paddingSize='s' fontSize='s' isCopyable>
            {JSON.stringify(row, null, 2)}
          </EuiCodeBlock>
        );
      }
    });
    return map;
  }, [spec.rows, expandedRowIds]);

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
  const pageStart = safePageIndex * pageSize;
  const pagedItems = useMemo(
    () => items.slice(pageStart, pageStart + pageSize),
    [items, pageStart, pageSize],
  );

  const titleText =
    i18n.translate('wazuhAiAssistant.resultTable.accordionSummary', {
      defaultMessage: 'Results ({count} rows)',
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
    <div className='wzResultsCard' style={measuredCardMaxHeight}>
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
          />
        </div>
      ) : null}
      {hasOpened && needsPagination ? (
        <div
          className='wzResultsCardFooter'
          style={{ display: isOpen ? undefined : 'none' }}
        >
          {/* Hand-built pagination (not EuiTablePagination — see this component's PR/handoff
              notes: this worktree has no installed node_modules to confirm that component's exact
              prop shape against the OSD-bundled EUI version, and every element used below
              (EuiButtonIcon/EuiButtonEmpty/EuiText) is already used/verified elsewhere in this
              same file). Pinned in its own grid row (`wzResultsCardFooter`, never inside the
              scrolling body), which is the acceptance check this whole rewrite exists for: "page 2
              of 6 [must be] reachable without resizing the window". */}
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
                      onClick={() => {
                        setPageSize(size);
                        setPageIndex(0);
                      }}
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
}) => (
  <ResultTableBoundary
    spec={spec}
    resolveDiscoverUrl={resolveDiscoverUrl}
    resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
    provenanceChips={provenanceChips}
    transcriptHeightPx={transcriptHeightPx}
  />
);
