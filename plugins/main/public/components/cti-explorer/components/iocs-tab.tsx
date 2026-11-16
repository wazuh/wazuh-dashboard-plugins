import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiCode,
  EuiFieldSearch,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  Criteria,
} from '@elastic/eui';
import {
  CTI_DEFAULT_PAGE_SIZE,
  CTI_LOOKUP_MAX_LENGTH,
  CTI_MAX_RESULT_WINDOW,
  CTI_RECENT_DAYS,
  IOC_TYPES,
  IocSortField,
} from '../../../../common/cti-explorer/constants';
import type {
  CtiBucket,
  IocFilters,
  IocRecord,
  IocSummaryResponse,
} from '../../../../common/cti-explorer/types';
import { CtiRequestState, useCtiRequest } from '../hooks/use-cti-request';
import { searchIocs } from '../services/cti-explorer-api';
import type { CsvColumn } from '../services/export-csv';
import {
  formatNumber,
  getConfidenceBandLabel,
  getIocTypeLabel,
  getMalwareRoleLabel,
  getProviderName,
  shortenValue,
} from '../utils/labels';
import { NORMAL_FONT_WEIGHT, VISUALIZATION_TITLE_STYLE } from '../utils/styles';
import { BreakdownList } from './breakdown-list';
import { CatalogDate } from './catalog-date';
import { ExportCsvButton } from './export-csv-button';
import { RequestErrorCallout } from './request-error-callout';

/** Table columns that sort, by the catalog field they sort on. */
const SORT_FIELDS: Record<string, IocSortField> = {
  name: 'document.name',
  confidence: 'document.confidence',
  firstSeen: 'document.first_seen',
  lastSeen: 'document.last_seen',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const ALL_TYPES = 'all';

const TYPE_OPTIONS = [
  {
    id: ALL_TYPES,
    label: i18n.translate('wazuh.ctiExplorer.iocs.allTypes', {
      defaultMessage: 'All',
    }),
  },
  ...IOC_TYPES.map(type => ({ id: type, label: getIocTypeLabel(type) })),
];

/** Columns of the exported file: full values and dates as stored, in UTC. */
const CSV_COLUMNS: Array<CsvColumn<IocRecord>> = [
  {
    field: 'value',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.value', {
      defaultMessage: 'IOC',
    }),
    value: record => record.name,
  },
  {
    field: 'type',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.type', {
      defaultMessage: 'Type',
    }),
    value: record => getIocTypeLabel(record.type),
  },
  {
    field: 'provider',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.provider', {
      defaultMessage: 'Provider',
    }),
    value: record => getProviderName(record.provider),
  },
  {
    field: 'publisher',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.publisher', {
      defaultMessage: 'Publisher',
    }),
    value: record => record.feedName,
  },
  {
    field: 'malware',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.malware', {
      defaultMessage: 'Malware',
    }),
    value: record => record.software?.name,
  },
  {
    field: 'malwareRole',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.malwareRole', {
      defaultMessage: 'Malware role',
    }),
    value: record =>
      record.software?.type ? getMalwareRoleLabel(record.software.type) : null,
  },
  {
    field: 'confidence',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.confidence', {
      defaultMessage: 'Confidence',
    }),
    value: record => record.confidence,
  },
  {
    field: 'firstSeen',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.firstSeen', {
      defaultMessage: 'First seen',
    }),
    value: record => record.firstSeen,
  },
  {
    field: 'lastSeen',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.lastSeen', {
      defaultMessage: 'Last seen',
    }),
    value: record => record.lastSeen,
  },
  {
    field: 'tags',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.tags', {
      defaultMessage: 'Tags',
    }),
    value: record => record.tags.join(', '),
  },
  {
    field: 'reference',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.reference', {
      defaultMessage: 'Reference',
    }),
    value: record => record.reference,
  },
  {
    field: 'id',
    title: i18n.translate('wazuh.ctiExplorer.iocs.csv.id', {
      defaultMessage: 'Record id',
    }),
    value: record => record.id,
  },
];

type FilterKey = Exclude<keyof IocFilters, 'type' | 'prefix'>;

const FILTER_LABELS: Record<FilterKey, (value: string) => string> = {
  provider: value =>
    i18n.translate('wazuh.ctiExplorer.iocs.filters.provider', {
      defaultMessage: 'Provider: {value}',
      values: { value: getProviderName(value) },
    }),
  role: value =>
    i18n.translate('wazuh.ctiExplorer.iocs.filters.role', {
      defaultMessage: 'Malware role: {value}',
      values: { value: getMalwareRoleLabel(value) },
    }),
  family: value =>
    i18n.translate('wazuh.ctiExplorer.iocs.filters.family', {
      defaultMessage: 'Malware family: {value}',
      values: { value },
    }),
  tag: value =>
    i18n.translate('wazuh.ctiExplorer.iocs.filters.tag', {
      defaultMessage: 'Tag: {value}',
      values: { value },
    }),
  confidence: value =>
    i18n.translate('wazuh.ctiExplorer.iocs.filters.confidence', {
      defaultMessage: 'Confidence: {value}',
      values: { value: getConfidenceBandLabel(value) },
    }),
  recent: () =>
    i18n.translate('wazuh.ctiExplorer.iocs.filters.recent', {
      defaultMessage: 'First seen in the last {days} days',
      values: { days: CTI_RECENT_DAYS },
    }),
};

interface IocsTabProps {
  summary: CtiRequestState<IocSummaryResponse>;
  filters: IocFilters;
  onFiltersChange: (filters: IocFilters) => void;
  onOpenIoc: (id: string) => void;
  /** Bring the IOC list to the top of the view, e.g. when a link opened it filtered. */
  scrollToList?: boolean;
  onListScrolled?: () => void;
}

/** Space left between the fixed headers of the page and the scrolled element. */
const SCROLL_GAP = 8;

/**
 * Scrolls the element to the top of the view, below the fixed headers of the
 * page, which pad the body by their height.
 */
const scrollToTop = (
  element: HTMLElement | null,
  behavior?: ScrollBehavior,
) => {
  if (!element) {
    return;
  }
  const headersHeight = parseFloat(getComputedStyle(document.body).paddingTop);
  element.style.scrollMarginTop = `${
    (Number.isNaN(headersHeight) ? 0 : headersHeight) + SCROLL_GAP
  }px`;
  element.scrollIntoView({ behavior, block: 'start' });
};

/** Input that means the user scrolls the page on their own. */
const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown', 'mousedown'];

/**
 * Keeps the element at the top of the view while `scroll` is on. The catalog
 * above the list grows when it loads and would push the list out of sight, so
 * the scroll is repeated until it has loaded, or until the user scrolls first.
 */
const useScrollLock = (
  ref: React.RefObject<HTMLElement>,
  scroll: boolean,
  isContentAboveLoading: boolean,
  onDone?: () => void,
) => {
  useEffect(() => {
    if (!scroll) {
      return;
    }
    scrollToTop(ref.current);
    if (!isContentAboveLoading) {
      onDone?.();
      return;
    }
    const release = () => onDone?.();
    USER_SCROLL_EVENTS.forEach(event =>
      window.addEventListener(event, release, { passive: true }),
    );
    return () =>
      USER_SCROLL_EVENTS.forEach(event =>
        window.removeEventListener(event, release),
      );
    // `onDone` may be a new function on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scroll, isContentAboveLoading]);
};

const Breakdown = ({
  title,
  buckets,
  total,
  getLabel,
  onSelect,
  testSubj,
}: {
  title: string;
  buckets: CtiBucket[];
  total: number;
  getLabel?: (key: string) => string;
  onSelect: (key: string) => void;
  testSubj: string;
}) => (
  <EuiFlexItem>
    <EuiPanel color='subdued' hasShadow={false} paddingSize='m'>
      <EuiTitle size='xxs'>
        <h3 style={VISUALIZATION_TITLE_STYLE}>{title}</h3>
      </EuiTitle>
      <EuiSpacer size='s' />
      <BreakdownList
        buckets={buckets}
        total={total}
        getLabel={getLabel}
        onSelect={onSelect}
        data-test-subj={`ctiExplorerBreakdown-${testSubj}`}
      />
    </EuiPanel>
  </EuiFlexItem>
);

const IocBreakdowns = ({
  summary,
  onFilter,
}: {
  summary: IocSummaryResponse | null;
  onFilter: (key: keyof IocFilters, value: string) => void;
}) => (
  <EuiPanel paddingSize='m' data-test-subj='ctiExplorerIocBreakdowns'>
    <EuiTitle size='xs'>
      <h2>
        {i18n.translate('wazuh.ctiExplorer.iocs.breakdownsTitle', {
          defaultMessage: 'IOC catalog',
        })}
      </h2>
    </EuiTitle>
    <EuiText size='xs' color='subdued'>
      {summary
        ? i18n.translate('wazuh.ctiExplorer.iocs.breakdownsCaption', {
            defaultMessage:
              '{total} records, current state. Select a value to list its records.',
            values: { total: formatNumber(summary.total) },
          })
        : i18n.translate('wazuh.ctiExplorer.iocs.breakdownsLoading', {
            defaultMessage: 'Loading the catalog…',
          })}
    </EuiText>
    <EuiSpacer size='m' />
    {summary ? (
      <EuiFlexGrid columns={3} gutterSize='m'>
        {/* Rows group the breakdowns of similar length: the long top-N lists
        first, the short fixed vocabularies after. */}
        <Breakdown
          title={i18n.translate('wazuh.ctiExplorer.iocs.byFamily', {
            defaultMessage: 'Top malware families',
          })}
          buckets={summary.byFamily}
          total={summary.total}
          onSelect={value => onFilter('family', value)}
          testSubj='family'
        />
        <Breakdown
          title={i18n.translate('wazuh.ctiExplorer.iocs.byTag', {
            defaultMessage: 'Top tags',
          })}
          buckets={summary.byTag}
          total={summary.total}
          onSelect={value => onFilter('tag', value)}
          testSubj='tag'
        />
        <Breakdown
          title={i18n.translate('wazuh.ctiExplorer.iocs.byProvider', {
            defaultMessage: 'By provider',
          })}
          buckets={summary.byProvider}
          total={summary.total}
          getLabel={getProviderName}
          onSelect={value => onFilter('provider', value)}
          testSubj='provider'
        />
        <Breakdown
          title={i18n.translate('wazuh.ctiExplorer.iocs.byType', {
            defaultMessage: 'By type',
          })}
          buckets={summary.byType}
          total={summary.total}
          getLabel={getIocTypeLabel}
          onSelect={value => onFilter('type', value)}
          testSubj='type'
        />
        <Breakdown
          title={i18n.translate('wazuh.ctiExplorer.iocs.byRole', {
            defaultMessage: 'By malware role',
          })}
          buckets={summary.byRole}
          total={summary.total}
          getLabel={getMalwareRoleLabel}
          onSelect={value => onFilter('role', value)}
          testSubj='role'
        />
        <Breakdown
          title={i18n.translate('wazuh.ctiExplorer.iocs.byConfidence', {
            defaultMessage: 'By confidence',
          })}
          buckets={summary.byConfidence}
          total={summary.total}
          getLabel={getConfidenceBandLabel}
          onSelect={value => onFilter('confidence', value)}
          testSubj='confidence'
        />
      </EuiFlexGrid>
    ) : null}
  </EuiPanel>
);

const IocList = ({
  filters,
  onFiltersChange,
  onOpenIoc,
}: {
  filters: IocFilters;
  onFiltersChange: (filters: IocFilters) => void;
  onOpenIoc: (id: string) => void;
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CTI_DEFAULT_PAGE_SIZE);
  const [sortField, setSortField] =
    useState<keyof typeof SORT_FIELDS>('firstSeen');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [prefixInput, setPrefixInput] = useState(filters.prefix ?? '');

  // A new filter starts on the first page of its own results.
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(0);
    setPrefixInput(filters.prefix ?? '');
    // `filtersKey` stands for every filter, `prefix` included.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const result = useCtiRequest(
    () =>
      searchIocs({
        page,
        pageSize,
        sortField: SORT_FIELDS[sortField],
        sortDirection,
        filters,
      }),
    [page, pageSize, sortField, sortDirection, filtersKey],
  );

  const total = result.data?.total ?? 0;
  const pageable = Math.min(total, CTI_MAX_RESULT_WINDOW);

  const onTableChange = ({ page: tablePage, sort }: Criteria<IocRecord>) => {
    if (tablePage) {
      setPage(tablePage.size === pageSize ? tablePage.index : 0);
      setPageSize(tablePage.size);
    }
    if (sort && SORT_FIELDS[sort.field as string]) {
      setSortField(sort.field as keyof typeof SORT_FIELDS);
      setSortDirection(sort.direction);
    }
  };

  const setFilter = (key: keyof IocFilters, value: unknown) => {
    const next = { ...filters, [key]: value };
    if (value === undefined || value === '' || value === false) {
      delete next[key];
    }
    onFiltersChange(next);
  };

  const activeFilters = (Object.keys(FILTER_LABELS) as FilterKey[]).filter(
    key => filters[key] !== undefined,
  );
  const hasFilters = Object.keys(filters).length > 0;

  const columns: Array<EuiBasicTableColumn<IocRecord>> = [
    {
      field: 'name',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.value', {
        defaultMessage: 'IOC',
      }),
      sortable: true,
      truncateText: true,
      width: '30%',
      render: (name: string, record: IocRecord) => (
        <EuiToolTip content={name} anchorClassName='eui-textTruncate'>
          <EuiLink
            onClick={(event: React.MouseEvent) => {
              // The row opens the record too; open it once.
              event.stopPropagation();
              onOpenIoc(record.id);
            }}
            style={NORMAL_FONT_WEIGHT}
            data-test-subj='ctiExplorerIocValue'
          >
            <EuiCode transparentBackground>
              {shortenValue(name, record.type)}
            </EuiCode>
          </EuiLink>
        </EuiToolTip>
      ),
    },
    {
      field: 'type',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.type', {
        defaultMessage: 'Type',
      }),
      render: (type: string) => getIocTypeLabel(type),
    },
    {
      field: 'provider',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.provider', {
        defaultMessage: 'Provider',
      }),
      render: (provider: string | null) => getProviderName(provider),
    },
    {
      field: 'software',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.malware', {
        defaultMessage: 'Malware',
      }),
      render: (software: IocRecord['software']) =>
        software?.name ? (
          <div>
            <div>{software.name}</div>
            {software.type ? (
              <EuiText size='xs' color='subdued'>
                {getMalwareRoleLabel(software.type)}
              </EuiText>
            ) : null}
          </div>
        ) : (
          '-'
        ),
    },
    {
      field: 'confidence',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.confidence', {
        defaultMessage: 'Confidence',
      }),
      sortable: true,
      align: 'right',
      render: (confidence: number | null) => confidence ?? '-',
    },
    {
      field: 'firstSeen',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.firstSeen', {
        defaultMessage: 'First seen',
      }),
      sortable: true,
      render: (value: string | null) => <CatalogDate value={value} />,
    },
    {
      field: 'lastSeen',
      name: i18n.translate('wazuh.ctiExplorer.iocs.columns.lastSeen', {
        defaultMessage: 'Last seen',
      }),
      sortable: true,
      render: (value: string | null) => <CatalogDate value={value} />,
    },
  ];

  return (
    <EuiPanel paddingSize='m' data-test-subj='ctiExplorerIocList'>
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='center'
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiTitle size='xs'>
            <h2>
              {i18n.translate('wazuh.ctiExplorer.iocs.listTitle', {
                defaultMessage: 'Browse IOCs',
              })}
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <ExportCsvButton<IocRecord>
            total={total}
            isDisabled={result.loading || Boolean(result.error)}
            fetchPage={(exportPage, exportPageSize) =>
              searchIocs({
                page: exportPage,
                pageSize: exportPageSize,
                sortField: SORT_FIELDS[sortField],
                sortDirection,
                filters,
              })
            }
            columns={CSV_COLUMNS}
            filename='cti-iocs'
            data-test-subj='ctiExplorerIocExport'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='m' />
      <EuiFlexGroup gutterSize='s' wrap responsive={false}>
        <EuiFlexItem style={{ minWidth: 240 }}>
          <EuiFieldSearch
            compressed
            fullWidth
            value={prefixInput}
            maxLength={CTI_LOOKUP_MAX_LENGTH}
            incremental={false}
            onChange={event => setPrefixInput(event.target.value)}
            onSearch={value => setFilter('prefix', value.trim())}
            placeholder={i18n.translate(
              'wazuh.ctiExplorer.iocs.prefixPlaceholder',
              { defaultMessage: 'Filter by the start of the value' },
            )}
            aria-label={i18n.translate(
              'wazuh.ctiExplorer.iocs.prefixAriaLabel',
              {
                defaultMessage:
                  'Filter the IOCs by the start of their value, ignoring case',
              },
            )}
            data-test-subj='ctiExplorerIocPrefix'
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend={i18n.translate('wazuh.ctiExplorer.iocs.typeLegend', {
              defaultMessage: 'Type of IOC',
            })}
            buttonSize='compressed'
            idSelected={filters.type ?? ALL_TYPES}
            onChange={id =>
              setFilter('type', id === ALL_TYPES ? undefined : id)
            }
            options={TYPE_OPTIONS}
            data-test-subj='ctiExplorerIocType'
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <EuiFlexGroup gutterSize='s' alignItems='center' wrap responsive={false}>
        {activeFilters.map(key => (
          <EuiFlexItem grow={false} key={key}>
            <EuiBadge
              color='hollow'
              iconType='cross'
              iconSide='right'
              iconOnClick={() => setFilter(key, undefined)}
              iconOnClickAriaLabel={i18n.translate(
                'wazuh.ctiExplorer.iocs.removeFilter',
                {
                  defaultMessage: 'Remove the filter {filter}',
                  values: { filter: FILTER_LABELS[key](String(filters[key])) },
                },
              )}
              data-test-subj={`ctiExplorerIocFilter-${key}`}
            >
              {FILTER_LABELS[key](String(filters[key]))}
            </EuiBadge>
          </EuiFlexItem>
        ))}
        {hasFilters ? (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size='xs'
              onClick={() => onFiltersChange({})}
              data-test-subj='ctiExplorerIocClearFilters'
            >
              {i18n.translate('wazuh.ctiExplorer.iocs.clearFilters', {
                defaultMessage: 'Clear all filters',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        ) : null}
        <EuiFlexItem />
        <EuiFlexItem grow={false}>
          <EuiText
            size='xs'
            color='subdued'
            data-test-subj='ctiExplorerIocCount'
          >
            {result.data
              ? total > CTI_MAX_RESULT_WINDOW
                ? i18n.translate('wazuh.ctiExplorer.iocs.countCapped', {
                    defaultMessage:
                      '{total} records. The first {max} can be paged through: filter to reach the others.',
                    values: {
                      total: formatNumber(total),
                      max: formatNumber(CTI_MAX_RESULT_WINDOW),
                    },
                  })
                : i18n.translate('wazuh.ctiExplorer.iocs.count', {
                    defaultMessage:
                      '{total, plural, one {# record} other {# records}}',
                    values: { total },
                  })
              : null}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      {result.error ? (
        <RequestErrorCallout error={result.error} onRetry={result.reload} />
      ) : (
        <EuiBasicTable<IocRecord>
          items={result.data?.items ?? []}
          itemId='id'
          columns={columns}
          loading={result.loading}
          tableLayout='auto'
          noItemsMessage={
            result.loading
              ? i18n.translate('wazuh.ctiExplorer.iocs.loading', {
                  defaultMessage: 'Loading IOCs…',
                })
              : i18n.translate('wazuh.ctiExplorer.iocs.noItems', {
                  defaultMessage: 'No IOCs match these filters',
                })
          }
          pagination={{
            pageIndex: page,
            pageSize,
            totalItemCount: pageable,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          sorting={{ sort: { field: sortField, direction: sortDirection } }}
          onChange={onTableChange}
          rowProps={(record: IocRecord) => ({
            onClick: () => onOpenIoc(record.id),
            style: { cursor: 'pointer' },
            'data-test-subj': `ctiExplorerIocRow-${record.id}`,
          })}
          data-test-subj='ctiExplorerIocTable'
        />
      )}
    </EuiPanel>
  );
};

export const IocsTab = ({
  summary,
  filters,
  onFiltersChange,
  onOpenIoc,
  scrollToList = false,
  onListScrolled,
}: IocsTabProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  useScrollLock(listRef, scrollToList, summary.loading, onListScrolled);
  const filterOn = (key: keyof IocFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
    scrollToTop(listRef.current, 'smooth');
  };

  return (
    <>
      {summary.error ? (
        <RequestErrorCallout error={summary.error} onRetry={summary.reload} />
      ) : (
        <IocBreakdowns summary={summary.data} onFilter={filterOn} />
      )}
      <EuiSpacer size='m' />
      <div ref={listRef}>
        <IocList
          filters={filters}
          onFiltersChange={onFiltersChange}
          onOpenIoc={onOpenIoc}
        />
      </div>
    </>
  );
};
