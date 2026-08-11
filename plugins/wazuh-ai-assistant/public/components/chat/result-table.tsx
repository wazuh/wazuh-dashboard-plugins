import React, { useMemo, useState } from 'react';
import {
  EuiAccordion,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
  EuiCallOut,
  EuiCodeBlock,
  EuiTextColor,
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

/** Tables at or under this row count default to expanded (nothing to gain from collapsing them);
 * bigger ones default collapsed so a 500-row result doesn't force the user to scroll past it to
 * get back to the chat input. */
const AUTO_EXPAND_ROW_THRESHOLD = 10;

/** One rendered table row: a `TableSpec` row plus the global `__rowId` the expander column and
 * `itemIdToExpandedRowMap` are keyed by (assigned over the FULL row set before pagination). */
type ResultRow = Record<string, unknown> & { __rowId: string };
/** Default page size and the choices offered in EuiBasicTable's page-size popover.
 *
 * Five, not twenty-five: the page size IS the height control now that the table body has no inner
 * scroller. Five rows answer "what did it find?" inside the conversation without pushing the chat
 * input off the screen, and the reader can page through or open the full set in Discover. It also
 * keeps the DOM small for a 500-row result, which is why pagination was here to begin with. */
const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

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
/** Approximate advance width of one character at the table's font size, used only to turn a
 * column's longest value into a pixel width. Deliberately rough — it decides how much room a
 * short column reserves, not whether anything is readable. */
const APPROX_CHAR_WIDTH = 7.5;
/** A column whose longest value is no longer than this is treated as a "short" column and gets a
 * width sized to its content, leaving the remaining width to the free-text column(s). */
const SHORT_COLUMN_MAX_CHARS = 24;
const SHORT_COLUMN_MIN_WIDTH = 92;
/** Deliberately tight. Every pixel a one-word column reserves is a pixel the free-text column
 * does not get, and the free-text column is the only one whose content wraps: allowing short
 * columns up to 200px left the rule title ~225px and wrapping onto three lines, which made row
 * heights alternate between one and three lines down the page. */
const SHORT_COLUMN_MAX_WIDTH = 132;
/** Left+right cell padding a short column's truncating wrapper must yield back to the cell itself
 * (issue #8921's horizontal-scrollbar item): the wrapper's own `max-width` must be smaller than
 * the column's pixel width, or the wrapper's border box is exactly as wide as the cell and has no
 * room left to actually be "inside" it once EuiBasicTable's own cell padding is added on top. */
const SHORT_COLUMN_CELL_INSET = 24;

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
 * Same rendering as `renderDefaultCell`, but with a CSS-only overflow safety net for the "long"
 * (no fixed pixel width) column path below — issue #8921's horizontal-scrollbar item, residual
 * case: a "short" column's own longest value can be truncated to a known pixel width
 * (`renderTruncatedCell`), but a long/free-text column deliberately has NO fixed width so normal
 * multi-word content (a rule title) keeps wrapping at spaces across lines, same as before this
 * existed. The gap is a single UNBREAKABLE token in that column wider than the browser's word-wrap
 * can act on — a long IPv6 address, a long path with no spaces — which a plain `renderDefaultCell`
 * lets overflow the cell and widen the whole table past the pane, recreating the measured
 * scrollbar. `overflowWrap: anywhere` breaks exactly that pathological case mid-token while leaving
 * ordinary space-delimited text to keep wrapping at word boundaries as it always did; unlike
 * `renderTruncatedCell` this never truncates or hides characters, so nothing is lost — only forced
 * onto another line instead of off the edge of the table.
 */
function renderWrappableCell(value: unknown): React.ReactNode {
  const rendered = renderDefaultCell(value);
  if (typeof rendered !== 'string' && typeof rendered !== 'number') {
    // Absent placeholder or already-formatted content (e.g. `formatCellValue`'s comma-joined
    // array) — none of those can be the single unbreakable token this guards against.
    return rendered;
  }
  return (
    <span style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
      {rendered}
    </span>
  );
}

/**
 * Same formatting as `renderDefaultCell`, but wrapped so a value that is itself longer than the
 * column's own pixel budget (an IP address, a long process name/path — anything with no spaces
 * for the browser to wrap on) can never force the CELL, and so the whole table, wider than the
 * column's assigned width (issue #8921's horizontal-scrollbar item: a real 15px scrollbar was
 * measured on a 6-short-column table at the default ~772px pane width). `overflow: hidden` on a
 * block box with its own explicit `max-width` is what actually holds the line — unlike the column's
 * own `width` (a layout hint EuiBasicTable's fixed table layout applies to the CELL, not to an
 * unbreakable run of characters inside it) — so the value is ellipsized instead of leaking past the
 * cell edge. The full, untruncated value stays one hover away via `title` (never lost, same
 * "demoted to on-demand, not deleted" treatment as the hidden-column note and the row expander),
 * and is still what's compared byte-for-byte in the expanded row's JSON view.
 */
function renderTruncatedCell(
  value: unknown,
  maxWidthPx: number,
): React.ReactNode {
  if (isAbsentValue(value)) {
    return renderAbsentPlaceholder();
  }
  const text =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : formatCellValue(value);
  return (
    <span
      title={text}
      style={{
        display: 'inline-block',
        maxWidth: maxWidthPx,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'bottom',
      }}
    >
      {text}
    </span>
  );
}

/**
 * Every visible column's header renders its friendly `label` with the underlying raw dot-path
 * (`column.id`, e.g. "source.port") as a hover `title` — issue #8921's inconsistent-labels item.
 * A derived column whose label collides on its last path segment (result-table's sibling fix,
 * digest.ts's `deriveColumnLabel`) now gets a real label instead of falling back to the raw path,
 * but the raw path is still worth keeping reachable for an analyst who wants to know the exact
 * field a friendly label like "Source Port" or "Level" maps to — the same "nothing is deleted,
 * only demoted to on-demand" treatment this file already gives hidden columns and long values.
 */
function renderColumnHeader(column: {
  id: string;
  label: string;
}): React.ReactNode {
  return <span title={column.id}>{column.label}</span>;
}

/** Length of the longest rendered value in a column (header included, so a short column never
 * ends up narrower than its own label). */
function longestValueLength(
  rows: Array<Record<string, unknown>>,
  field: string,
  label: string,
): number {
  let longest = label.length;
  for (const row of rows) {
    const value = row[field];
    if (value === null || value === undefined) {
      continue;
    }
    const length = String(value).length;
    if (length > longest) {
      longest = length;
    }
  }
  return longest;
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
}

/**
 * Renders a `table` stream event: spec-driven, with a severity column and expandable rows.
 */
const ResultTableInner: React.FC<ResultTableProps> = ({
  spec,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
}) => {
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
  // Stable across re-renders of the SAME mounted table (a later spec on the same tool round would
  // still be the same accordion instance) — htmlIdGenerator is only invoked once per mount.
  const accordionId = useMemo(
    () => htmlIdGenerator('wzAiResultTableAccordion')(),
    [],
  );

  const initiallyOpen = spec.rows.length <= AUTO_EXPAND_ROW_THRESHOLD;
  // Lazy-mount (perf): a collapsed EuiAccordion still renders its
  // children into the DOM (just visually hidden), so a collapsed 500-row table cost 500 DOM rows
  // for nothing. `hasOpened` tracks whether the accordion has EVER been opened — starting `true`
  // when `initialIsOpen` already counts as opened — and once it flips `true` it never flips back,
  // so re-collapsing the accordion later doesn't tear the table down again (keeps scroll position/
  // expanded rows). Until then, the accordion renders a `null` child instead of the table.
  const [hasOpened, setHasOpened] = useState(initiallyOpen);

  // Pagination (perf): caps the DOM to one page of rows at a time instead of all 500.
  // Row ids (`__rowId`, assigned below over the FULL `spec.rows` before slicing) are global
  // indexes, so `itemIdToExpandedRowMap` and the expander column stay correct across pages —
  // paging never renumbers a row.
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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
            name: renderColumnHeader(column),
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
            name: renderColumnHeader(column),
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
        // EuiBasicTable's default fixed layout splits the leftover width EQUALLY between every
        // column that has no explicit width, so a one-word "Category" column claimed exactly as
        // much room as a sentence-long rule title and the title wrapped onto four lines. Sizing
        // the short columns to their content leaves the remainder to the free-text column(s) —
        // the only ones that can actually use it.
        const longest = longestValueLength(spec.rows, column.id, column.label);
        if (longest <= SHORT_COLUMN_MAX_CHARS) {
          const width = Math.min(
            SHORT_COLUMN_MAX_WIDTH,
            Math.max(
              SHORT_COLUMN_MIN_WIDTH,
              Math.round(longest * APPROX_CHAR_WIDTH) + 32,
            ),
          );
          return {
            field: column.id,
            name: renderColumnHeader(column),
            width: `${width}px`,
            // A truncating render (not the plain `renderDefaultCell` fast path) — a short column's
            // pixel width is sized to fit ITS OWN longest value, but a value belonging to a
            // DIFFERENT row on a later page (pagination slices `spec.rows`, `longestValueLength`
            // measures all of them) or a value at exactly the SHORT_COLUMN_MAX_WIDTH ceiling can
            // still be wider than the column — see this function's doc comment.
            render: (value: unknown) =>
              renderTruncatedCell(value, width - SHORT_COLUMN_CELL_INSET),
          };
        }
        return {
          field: column.id,
          name: renderColumnHeader(column),
          render: renderWrappableCell,
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
        // Same raw-JSON treatment as the provenance chips' raw view (message-bubble.tsx): a
        // proper EuiCodeBlock instead of a bare <pre>, with copy support. No `overflowHeight`:
        // that would put a scrollbar inside an expanded row inside the transcript, and this
        // content only exists because the reader deliberately expanded the row — cutting it off
        // behind a third scrollbar defeats the click they just made. EuiCodeBlock's own
        // fullscreen control handles a genuinely huge document.
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
  const pageStart = pageIndex * pageSize;
  const pagedItems = useMemo(
    () => items.slice(pageStart, pageStart + pageSize),
    [items, pageStart, pageSize],
  );

  return (
    // No frame around the table. A bordered box here would be the third nested container the
    // reader is inside (page, then turn, then table), and the table already carries its own
    // structure: a hairline under the header row (applied by `wzResultTableAccordion` in
    // chat-page.scss) plus EUI's own row separators. Data, not a widget.
    <div>
      <EuiAccordion
        id={accordionId}
        className='wzResultTableAccordion'
        paddingSize='none'
        buttonContent={
          i18n.translate('wazuhAiAssistant.resultTable.accordionSummary', {
            defaultMessage: 'Results ({count} rows)',
            values: { count: spec.rows.length },
          }) +
          // Column-budget disclosure (issue #8921): a column demoted past MAX_VISIBLE_COLUMNS is
          // NOT deleted — buildTableSpec (digest.ts) still puts its field into every row — so this
          // tells the reader where to find it instead of leaving its disappearance unexplained.
          (hiddenColumnCount > 0
            ? i18n.translate('wazuhAiAssistant.resultTable.hiddenColumnsNote', {
                defaultMessage:
                  ' (+{count, plural, one {# more field} other {# more fields}}' +
                  ' per row — expand a row to see them)',
                values: { count: hiddenColumnCount },
              })
            : '')
        }
        initialIsOpen={initiallyOpen}
        // Lazy-mount: flips `hasOpened` permanently true the first time the accordion is opened
        // (never reset on a later re-collapse, so the table stays mounted from then on).
        onToggle={isOpen => {
          if (isOpen) {
            setHasOpened(true);
          }
        }}
        extraAction={
          (resolveDiscoverUrl && spec.discover) ||
          (resolveSecurityAnalyticsUrl && spec.securityAnalyticsLink) ? (
            <EuiFlexGroup gutterSize='s' responsive={false}>
              {resolveDiscoverUrl && spec.discover ? (
                <EuiFlexItem grow={false}>
                  <DiscoverLink
                    spec={spec}
                    resolveDiscoverUrl={resolveDiscoverUrl}
                  />
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
          ) : undefined
        }
      >
        {hasOpened ? (
          // No inner scroller. A scrollbar inside a message inside the scrolling transcript means
          // the reader has to work out which of three surfaces their wheel is aimed at, and the
          // rows below the fold are invisible until they find out. Height is controlled by how
          // many rows a page shows (DEFAULT_PAGE_SIZE) instead, so the table is simply as tall as
          // its content and the page scrolls once. `overflowX` stays as a safety net for a
          // pathologically wide column set; with content-sized columns it does not normally engage.
          <div
            style={{
              overflowX: 'auto',
              // paddingSize='none' above (the header strip owns its own padding via
              // wzResultTableAccordion) leaves the body needing its own inset.
              padding: 12,
            }}
          >
            <EuiBasicTable
              items={pagedItems}
              columns={columns}
              itemId='__rowId'
              itemIdToExpandedRowMap={itemIdToExpandedRowMap}
              isExpandable
              hasActions
              pagination={{
                pageIndex,
                pageSize,
                totalItemCount: spec.rows.length,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
              }}
              // EuiBasicTable's page-change callback is `onChange` (the `onTableChange` name
              // belongs to EuiInMemoryTable — using it here was silently ignored at runtime, so
              // pagination never actually turned pages). Typed inline rather than via EUI's
              // `CriteriaWithPagination<T>`: `columns` is cast to `any` so the item generic `T`
              // isn't usefully inferred, and this handler only reads `page`. An optional-`page`
              // shape is a valid target for the paginated arm (whose `CriteriaWithPagination` has
              // a REQUIRED `page`), satisfying the prop without depending on the exact exported
              // type name and giving `page` an explicit type (no implicit-any).
              onChange={({
                page,
              }: {
                page?: { index: number; size: number };
              }) => {
                if (!page) {
                  return;
                }
                setPageIndex(page.index);
                setPageSize(page.size);
              }}
            />
          </div>
        ) : null}
      </EuiAccordion>
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
      />
    );
  }
}

export const ResultTable: React.FC<ResultTableProps> = ({
  spec,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
}) => (
  <ResultTableBoundary
    spec={spec}
    resolveDiscoverUrl={resolveDiscoverUrl}
    resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
  />
);
