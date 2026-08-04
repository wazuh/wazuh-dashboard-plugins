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
  htmlIdGenerator,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { TableSpec } from '../../../common/types';
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
/** Max height of the scrollable table body inside the accordion; the accordion (and the page) never
 * grows taller than this for the table itself, however many rows or columns it has. */
const TABLE_SCROLL_MAX_HEIGHT = 400;
/** Default page size and the choices offered in EuiBasicTable's page-size popover (perf: caps a
 * 500-row result to this many DOM rows at a time instead of all of them at once). */
const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 100];

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

  const fieldColumns: EuiBasicTableColumn<ResultRow>[] = useMemo(
    () =>
      spec.columns.map(column => ({
        field: column.id,
        name: column.label,
        render:
          column.id === spec.severityColumn
            ? (value: unknown) => renderSeverityBadge(value)
            : undefined,
      })),
    [spec.columns, spec.severityColumn],
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
        // proper EuiCodeBlock instead of a bare <pre>, with copy support and a capped scroll
        // height so one very large row can't push the table's own height out.
        map[String(rowIndex)] = (
          <EuiCodeBlock
            language='json'
            paddingSize='s'
            fontSize='s'
            isCopyable
            overflowHeight={240}
          >
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
    // Bordered panel look: a hairline border all around, with the accordion's own trigger row
    // (arrow + "Results (N rows)" + "Open in Discover"/"Open in Security Analytics") restyled via
    // `wzResultTableAccordion` (chat-page.scss targets EUI's own `.euiAccordion__triggerWrapper`)
    // into a small sunken-background header strip with a hairline bottom border, matching the
    // conversation header's own hairline-only separation (no shadow anywhere on this surface).
    // `overflow: hidden` keeps that header's background from spilling past the rounded corners.
    <div
      style={{
        border: '1px solid var(--wz-hairline)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <EuiAccordion
        id={accordionId}
        className='wzResultTableAccordion'
        paddingSize='none'
        buttonContent={i18n.translate(
          'wazuhAiAssistant.resultTable.accordionSummary',
          {
            defaultMessage: 'Results ({count} rows)',
            values: { count: spec.rows.length },
          },
        )}
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
          // Scrolls internally (both axes) instead of growing the page: a wide/tall table must
          // never push the chat input further down the page than the accordion header itself does.
          <div
            style={{
              maxHeight: TABLE_SCROLL_MAX_HEIGHT,
              overflowY: 'auto',
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
