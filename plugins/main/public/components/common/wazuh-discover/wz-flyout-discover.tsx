import React, { useState, useMemo, useEffect } from 'react';
import {
  EuiPageTemplate,
  EuiBasicTable,
  EuiBasicTableProps,
  EuiButtonIcon,
  Direction,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
} from '@elastic/eui';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
import { IntlProvider } from 'react-intl';
import { IndexPattern } from '../../../../../../src/plugins/data/public';
import { SearchResponse } from '../../../../../../src/core/server';
import { DiscoverNoResults } from '../no-results/no-results';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { tDataGridColumn } from '../data-grid';
import { ErrorHandler, ErrorFactory, HttpError } from '../../../react-services/error-management';
import useSearchBar from '../search-bar/use-search-bar';
import { getPlugins } from '../../../kibana-services';
import { withErrorBoundary } from '../hocs';
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

export const MAX_ENTRIES_PER_QUERY = 10000;
export const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;
const INDEX_FIELD_NAME = '_id';

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

  const SearchBar = getPlugins().data.ui.SearchBar;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;
  // table states
  const [pagination, setPagination] = useState<EuiBasicTableProps<any>['pagination']>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItemCount: 0,
  });
  const [sorting, setSorting] = useState<EuiBasicTableProps<any>['sorting']>({
    sort: { field: timeField || '@timestamp', direction: 'desc' },
  });
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<Record<string, JSX.Element>>(
    {}
  );

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

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

  const parseSorting = useMemo(() => {
    if (!sorting) {
      return [];
    }
    return { columns: [{ id: sorting?.sort?.field, direction: sorting?.sort?.direction }] };
  }, [sorting]);

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIndexPattern(dataSource?.indexPattern);
    fetchData({
      query,
      dateRange: { from: dateRangeFrom || '', to: dateRangeTo || '' },
      pagination,
      sorting: parseSorting,
    })
      .then((response: SearchResponse) => {
        const totalHits = response?.hits?.total || 0;
        setPagination({
          ...pagination,
          totalItemCount: totalHits > MAX_ENTRIES_PER_QUERY ? MAX_ENTRIES_PER_QUERY : totalHits,
        });
        setResults(response);
      })
      .catch((error: HttpError) => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching discover data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    isDataSourceLoading,
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(sorting),
    JSON.stringify(pagination),
    dateRangeFrom,
    dateRangeTo,
  ]);

  const toggleDetails = (item) => {
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
    setPagination({ pageIndex, pageSize, totalItemCount: results?.hits?.total || 0 });
    setSorting({ sort: { field, direction: direction as Direction } });
  };

  const onExpandRow = (item) => {
    toggleDetails(item);
  };

  const expanderColumn = {
    width: '40px',
    isExpander: true,
    render: (item) => (
      <EuiButtonIcon
        onClick={() => onExpandRow(item)}
        aria-label={
          itemIdToExpandedRowMap.hasOwnProperty(item[INDEX_FIELD_NAME]) ? 'Collapse' : 'Expand'
        }
        iconType={
          itemIdToExpandedRowMap.hasOwnProperty(item[INDEX_FIELD_NAME]) ? 'arrowDown' : 'arrowRight'
        }
      />
    ),
  };

  const getColumns = (): EuiBasicTableProps<any>['columns'] => {
    const defaultCols = defaultTableColumns.map((column) => {
      return {
        field: column.id,
        name: column.displayAsText,
        sortable: true,
        truncateText: true,
        render: column.render ? (value) => column?.render?.(value) : (value) => value,
      };
    });

    if (!isExpanded) {
      return defaultCols;
    }

    return [expanderColumn, ...defaultCols];
  };

  const getExpandedRow = (item: any) => {
    const doc = results?.hits?.hits?.find(
      (hit) => hit[INDEX_FIELD_NAME] === item[INDEX_FIELD_NAME]
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
      results?.hits?.hits?.map((item) => {
        return { [INDEX_FIELD_NAME]: item[INDEX_FIELD_NAME], ...item._source };
      }) || []
    );
  }, [results]);

  return (
    <IntlProvider locale="en">
      <EuiPageTemplate restrictWidth="100%" fullHeight={true} grow paddingSize="m">
        <>
          {isDataSourceLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="wz-search-bar">
              <SearchBar
                appName="wazuh-discover-search-bar"
                {...searchBarProps}
                useDefaultBehaviors={false}
              />
            </div>
          )}
          {!isDataSourceLoading && results?.hits?.total === 0 ? (
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
          ) : null}
          {!isDataSourceLoading && dataSource && results?.hits?.total > 0 ? (
            <>
              <EuiPanel color="subdued" borderRadius="none" hasShadow={false} paddingSize="s">
                <HitsCounter
                  hits={results?.hits?.total}
                  showResetButton={false}
                  tooltip={
                    results?.hits?.total && results?.hits?.total > MAX_ENTRIES_PER_QUERY
                      ? {
                          ariaLabel: 'Warning',
                          content: `The query results has exceeded the limit of 10,000 hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                            MAX_ENTRIES_PER_QUERY
                          )} hits.`,
                          iconType: 'alert',
                          position: 'top',
                        }
                      : undefined
                  }
                />
              </EuiPanel>
              <EuiBasicTable
                items={parsedItems}
                itemId={INDEX_FIELD_NAME}
                itemIdToExpandedRowMap={itemIdToExpandedRowMap}
                isExpandable={isExpanded}
                columns={getColumns()}
                pagination={pagination}
                sorting={sorting}
                onChange={onTableChange}
              />
            </>
          ) : null}
        </>
      </EuiPageTemplate>
    </IntlProvider>
  );
};

export const WazuhFlyoutDiscover = withErrorBoundary(WazuhFlyoutDiscoverComponent);
