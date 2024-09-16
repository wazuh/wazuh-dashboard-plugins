import React, { useState, useMemo, useEffect } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTable,
  EuiBasicTableProps,
  EuiButtonIcon,
  Direction,
  EuiPanel,
  EuiText,
} from '@elastic/eui';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
import { IntlProvider } from 'react-intl';
import { IndexPattern } from '../../../../../../src/plugins/data/public';
import { SearchResponse } from '../../../../../../src/core/server';
import { DiscoverNoResults } from '../no-results/no-results';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
import { tDataGridColumn } from '../data-grid';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
import useSearchBar, { tUseSearchBarProps } from '../search-bar/use-search-bar';
import { withErrorBoundary } from '../hocs';
import { useTimeFilter } from '../hooks';
import {
  IDataSourceFactoryConstructor,
  useDataSource,
  tParsedIndexPattern,
  PatternDataSource,
  AlertsDataSourceRepository,
  tFilterManager,
  tFilter,
} from '../data-source';
import DocDetails from './components/doc-details';
import { WzSearchBar } from '../search-bar/search-bar';
import { MAX_ENTRIES_PER_QUERY } from '../data-grid/data-grid-service';
export const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
const INDEX_FIELD_NAME = '_id';
import { formatUIDate } from '../../../react-services/time-service';

export type WazuhDiscoverProps = {
  tableColumns: tDataGridColumn[];
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
  expandedRowComponent?: (props: {
    doc: any;
    item: any;
    indexPattern: IndexPattern;
  }) => JSX.Element;
  filterManager?: tFilterManager;
  isExpanded?: boolean;
  initialFilters?: tFilter[];
  initialFetchFilters?: tFilter[];
};

const WazuhFlyoutDiscoverComponent = (props: WazuhDiscoverProps) => {
  const {
    DataSource,
    tableColumns: defaultTableColumns,
    filterManager,
    expandedRowComponent,
    isExpanded = true,
    initialFilters,
    initialFetchFilters,
  } = props;

  if (!DataSource) {
    throw new Error('DataSource is required');
  }

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const timeField = indexPattern?.timeFieldName
    ? indexPattern.timeFieldName
    : undefined;
  // table states
  const [pagination, setPagination] = useState<
    Omit<EuiBasicTableProps<any>['pagination'], 'totalItemCount'>
  >({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<EuiBasicTableProps<any>['sorting']>({
    sort: { field: timeField || '@timestamp', direction: 'desc' },
  });
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<
    Record<string, JSX.Element>
  >({});

  // use the global time filter to get the default date range
  const [query, setQuery] = useState<Query>({ query: '', language: 'kuery' });
  const { timeFilter } = useTimeFilter();

  const {
    dataSource,
    filters,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    repository: new AlertsDataSourceRepository(), // this makes only works with alerts index pattern
    DataSource,
    filterManager,
    filters: initialFilters,
    fetchFilters: initialFetchFilters,
  });

  const [dateRange, setDateRange] = useState<TimeRange>({
    from: timeFilter.from,
    to: timeFilter.to,
  });

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
    setQuery,
    setTimeFilter: setDateRange,
  } as tUseSearchBarProps);

  const { absoluteDateRange } = searchBarProps;

  const parseSorting = useMemo(() => {
    if (!sorting) {
      return [];
    }
    return {
      columns: [
        { id: sorting?.sort?.field, direction: sorting?.sort?.direction },
      ],
    };
  }, [sorting]);

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIndexPattern(dataSource?.indexPattern);
    fetchData({
      query,
      dateRange: absoluteDateRange,
      pagination,
      sorting: parseSorting,
    })
      .then((response: SearchResponse) => {
        setPagination({
          ...pagination,
        });
        setResults(response);
      })
      .catch((error: HttpError) => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    isDataSourceLoading,
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(sorting),
    JSON.stringify(pagination),
    JSON.stringify(absoluteDateRange),
  ]);

  const toggleDetails = item => {
    if (!isExpanded) {
      setItemIdToExpandedRowMap({});
      return;
    }

    if (itemIdToExpandedRowMap.hasOwnProperty(item[INDEX_FIELD_NAME])) {
      setItemIdToExpandedRowMap({});
    } else {
      setItemIdToExpandedRowMap({
        [item[INDEX_FIELD_NAME]]: getExpandedRow(item),
      });
    }
  };

  const onTableChange = ({
    page = { index: 0, size: 10 },
    sort = { field: '', direction: '' },
  }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field, direction } = sort;
    setPagination({
      pageIndex,
      pageSize,
    });
    setSorting({ sort: { field, direction: direction as Direction } });
  };

  const onExpandRow = item => {
    toggleDetails(item);
  };

  const expanderColumn = {
    width: '40px',
    isExpander: true,
    render: item => (
      <EuiButtonIcon
        onClick={() => onExpandRow(item)}
        aria-label={
          itemIdToExpandedRowMap.hasOwnProperty(item[INDEX_FIELD_NAME])
            ? 'Collapse'
            : 'Expand'
        }
        iconType={
          itemIdToExpandedRowMap.hasOwnProperty(item[INDEX_FIELD_NAME])
            ? 'arrowDown'
            : 'arrowRight'
        }
      />
    ),
  };

  const getColumns = (): EuiBasicTableProps<any>['columns'] => {
    const defaultCols = defaultTableColumns.map(column => {
      return {
        field: column.id,
        name: column.displayAsText,
        sortable: true,
        truncateText: true,
        render: column.render
          ? (value, record) => column?.render?.(value, record)
          : (value, record) => value,
      };
    });

    if (!isExpanded) {
      return defaultCols;
    }

    return [expanderColumn, ...defaultCols];
  };

  const getExpandedRow = (item: any) => {
    const doc = results?.hits?.hits?.find(
      hit => hit[INDEX_FIELD_NAME] === item[INDEX_FIELD_NAME],
    );

    return expandedRowComponent ? (
      expandedRowComponent({
        doc,
        item,
        indexPattern,
      })
    ) : (
      <DocDetails doc={doc} item={item} indexPattern={indexPattern} />
    );
  };

  const parsedItems = useMemo(() => {
    return (
      results?.hits?.hits?.map(item => {
        return { [INDEX_FIELD_NAME]: item[INDEX_FIELD_NAME], ...item._source };
      }) || []
    );
  }, [results]);

  return (
    <IntlProvider locale='en'>
              {isDataSourceLoading ? (
            <LoadingSearchbarProgress />
          ) : (
      <EuiFlexGroup className='flyout-row'>
        <EuiFlexItem>
            <WzSearchBar
              appName='wazuh-discover-search-bar'
              {...searchBarProps}
              useDefaultBehaviors={false}
              hideFixedFilters
            />
          {!isDataSourceLoading && results?.hits?.total === 0 && (
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
          )}
          {!isDataSourceLoading && dataSource && results?.hits?.total > 0 && (
            <>
              <EuiPanel
                color='subdued'
                borderRadius='none'
                hasShadow={false}
                paddingSize='s'
              >
                <HitsCounter
                  hits={results?.hits?.total}
                  showResetButton={false}
                  tooltip={
                    results?.hits?.total &&
                    results?.hits?.total > MAX_ENTRIES_PER_QUERY
                      ? {
                          ariaLabel: 'Warning',
                          content: `The query results exceeded the limit of ${formatNumWithCommas(
                            MAX_ENTRIES_PER_QUERY,
                          )} hits. Please refine your search.`,
                          iconType: 'alert',
                          position: 'top',
                        }
                      : undefined
                  }
                />
                {absoluteDateRange ? (
                  <EuiFlexGroup
                    gutterSize='s'
                    responsive={false}
                    justifyContent='center'
                    alignItems='center'
                  >
                    <EuiFlexItem grow={false}>
                      <EuiText size='s'>
                        {formatUIDate(absoluteDateRange?.from)} -{' '}
                        {formatUIDate(absoluteDateRange?.to)}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                ) : null}
              </EuiPanel>
              <EuiBasicTable
                items={parsedItems}
                itemId={INDEX_FIELD_NAME}
                itemIdToExpandedRowMap={itemIdToExpandedRowMap}
                isExpandable={isExpanded}
                columns={getColumns()}
                pagination={{
                  ...pagination,
                  totalItemCount:
                    (results?.hits?.total ?? 0) > MAX_ENTRIES_PER_QUERY
                      ? MAX_ENTRIES_PER_QUERY
                      : results?.hits?.total ?? 0,
                }}
                sorting={sorting}
                onChange={onTableChange}
              />
            </>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
          )}
    </IntlProvider>
  );
};

export const WazuhFlyoutDiscover = withErrorBoundary(
  WazuhFlyoutDiscoverComponent,
);
