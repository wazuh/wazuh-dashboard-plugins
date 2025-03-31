import React, { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import {
  EuiDataGrid,
  EuiPageTemplate,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiButtonEmpty,
  EuiPanel,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
formatNumWithCommas;
import { getWazuhCorePlugin } from '../../../kibana-services';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';

import './table.scss';

import {
  exportSearchToCSV,
  getAllCustomRenders,
  MAX_ENTRIES_PER_QUERY,
  tDataGridColumn,
  TDataGridReturn,
  useDataGrid,
} from '../data-grid';

import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
// common components/hooks
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { wzDiscoverRenderColumns } from './render-columns';
import {
  DocumentViewTableAndJson,
  DocumentViewTableAndJsonPropsAdditionalTabs,
} from './components/document-view-table-and-json';
import { WzSearchBar } from '../search-bar';
import { DataGridVisibleColumnsSelector } from './components/visible-columns-selector';
import {
  CreateNewSearchContext,
  useDataSourceWithSearchBar,
} from '../hooks/use-data-source-search-context';
import {
  IDataSourceFactoryConstructor,
  PatternDataSource,
  tDataSourceRepository,
  tParsedIndexPattern,
  tUseDataSourceLoadedReturns,
} from '../data-source';
import { DiscoverNoResults } from '../no-results/no-results';
import {
  withDataSourceInitiated,
  withErrorBoundary,
  withGuard,
  withWrapComponent,
} from '../hocs';
import { compose } from 'redux';

export interface TableDiscoverBasicTableProps<K> {
  dataGridProps: TDataGridReturn;
  results: SearchResponse;
  dataSource: tUseDataSourceLoadedReturns<K>['dataSource'];
  fetchFilters: tUseDataSourceLoadedReturns<K>['fetchFilters'];
  query: { query: string; language: string };
  tableColumns: tDataGridColumn[];
  isDataSourceLoading: boolean;
  displayOnlyNoResultsCalloutOnNoResults?: boolean;
}

const TableDiscoverBasicTable: React.FunctionComponent<TableDiscoverBasicTableProps> =
  withGuard(
    ({
      displayOnlyNoResultsCalloutOnNoResults,
      isDataSourceLoading,
      results,
    }) =>
      displayOnlyNoResultsCalloutOnNoResults &&
      !isDataSourceLoading &&
      results?.hits?.total === 0,
    DiscoverNoResults,
  )(
    ({
      dataGridProps,
      results,
      dataSource,
      fetchFilters,
      query,
    }: TableDiscoverBasicTableProps) => {
      const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();
      const [isExporting, setIsExporting] = useState<boolean>(false);

      const onClickExportResults = async () => {
        const params = {
          indexPattern: dataSource?.indexPattern as IndexPattern,
          filters: fetchFilters,
          query,
          fields: dataGridProps.columnVisibility.visibleColumns,
          pagination: {
            pageIndex: 0,
            pageSize: results.hits.total,
          },
          sorting: dataGridProps.sorting,
        };
        try {
          setIsExporting(true);
          await exportSearchToCSV(params);
        } catch (error) {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error downloading csv report',
          });
          ErrorHandler.handleError(searchError);
        } finally {
          setIsExporting(false);
        }
      };

      return (
        <EuiPanel
          paddingSize='s'
          hasShadow={false}
          hasBorder={false}
          color='transparent'
        >
          <div>
            <EuiDataGrid
              {...dataGridProps}
              className={sideNavDocked ? 'dataGridDockedNav' : ''}
              toolbarVisibility={{
                showColumnSelector: { allowHide: false },
                additionalControls: (
                  <>
                    <HitsCounter
                      hits={results?.hits?.total ?? 0}
                      showResetButton={false}
                      tooltip={
                        results?.hits?.total &&
                        results?.hits?.total > MAX_ENTRIES_PER_QUERY
                          ? {
                              ariaLabel: 'Info',
                              content: `The query results has exceeded the limit of ${formatNumWithCommas(
                                MAX_ENTRIES_PER_QUERY,
                              )} hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                                MAX_ENTRIES_PER_QUERY,
                              )} hits.`,
                              iconType: 'iInCircle',
                              position: 'top',
                            }
                          : undefined
                      }
                    />
                    <EuiButtonEmpty
                      disabled={
                        results?.hits?.total === 0 ||
                        !dataGridProps?.columnVisibility?.visibleColumns?.length
                      }
                      size='xs'
                      iconType='exportAction'
                      color='text'
                      isLoading={isExporting}
                      className='euiDataGrid__controlBtn'
                      onClick={onClickExportResults}
                    >
                      Export Formatted
                    </EuiButtonEmpty>

                    <DataGridVisibleColumnsSelector
                      availableColumns={dataGridProps.columnsAvailable}
                      columnVisibility={dataGridProps.columnVisibility}
                    />
                  </>
                ),
              }}
            />
          </div>
        </EuiPanel>
      );
    },
  );

export type EnhancedTableProps<K> = TableDiscoverBasicTableProps<K> & {
  searchBarProps: any;
  filters: any;
  fixedFilters: any;
  title?: string;
  showSearchBar?: boolean;
};

const EnhancedTable: React.FunctionComponent<EnhancedTableProps<K>> =
  withDataSourceInitiated(
    ({
      searchBarProps,
      filters,
      fixedFilters,
      title,
      showSearchBar = false,
      dataGridProps,
      results,
      dataSource,
      fetchFilters,
      query,
      displayOnlyNoResultsCalloutOnNoResults,
      isDataSourceLoading,
    }: EnhancedTableProps<K>) => (
      <>
        {title && (
          <EuiTitle data-test-subj='wz-discover-title' size='s'>
            <h1>{title}</h1>
          </EuiTitle>
        )}
        {showSearchBar && (
          <WzSearchBar
            appName='wzTable'
            {...searchBarProps}
            filters={filters}
            fixedFilters={fixedFilters}
            showDatePicker={
              searchBarProps?.showDatePicker ??
              Boolean(dataSource.indexPattern.timeFieldName)
            }
          />
        )}
        <TableDiscoverBasicTable
          dataGridProps={dataGridProps}
          results={results}
          dataSource={dataSource}
          fetchFilters={fetchFilters}
          query={query}
          displayOnlyNoResultsCalloutOnNoResults={
            displayOnlyNoResultsCalloutOnNoResults
          }
          isDataSourceLoading={isDataSourceLoading}
        />
      </>
    ),
  );

export type EnhancedTableUseParentDataSourceSearchBarProps<K> =
  EnhancedTableProps<K> & {
    fetchData: any;
    setFilters: any;
    searchBarProps: any;
    fingerprint: number;
    inspectDetailsTitle?: string;
    additionalDocumentDetailsTabs?: DocumentViewTableAndJsonPropsAdditionalTabs;
  };

export const EnhancedTableUseParentDataSourceSearchBar = compose(
  withGuard(
    ({ isDataSourceLoading }) => isDataSourceLoading,
    LoadingSearchbarProgress,
  ),
  withDataSourceInitiated,
)(
  ({
    dataSource,
    fetchData,
    fetchFilters,
    fixedFilters,
    filters,
    setFilters,
    searchBarProps,
    isDataSourceLoading,
    fingerprint,
    tableDefaultColumns,
    inspectDetailsTitle = 'Details',
    additionalDocumentDetailsTabs = [],
    displayOnlyNoResultsCalloutOnNoResults,
    title,
    showSearchBar,
  }: EnhancedTableUseParentDataSourceSearchBarProps) => {
    const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

    const [results, setResults] = useState<SearchResponse>(
      {} as SearchResponse,
    );
    const [inspectedHit, setInspectedHit] = useState<any>(undefined);

    const onClickInspectDoc = useMemo(
      () => (index: number) => {
        const rowClicked = results.hits.hits[index];
        setInspectedHit(rowClicked);
      },
      [results],
    );

    const DocViewInspectButton = ({
      rowIndex,
    }: EuiDataGridCellValueElementProps) => {
      const inspectHintMsg = 'Inspect details';
      return (
        <EuiToolTip content={inspectHintMsg}>
          <EuiButtonIcon
            onClick={() => onClickInspectDoc(rowIndex)}
            iconType='inspect'
            aria-label={inspectHintMsg}
          />
        </EuiToolTip>
      );
    };

    const dataGridProps = useDataGrid({
      ariaLabelledBy: 'Table',
      defaultColumns: tableDefaultColumns,
      renderColumns: wzDiscoverRenderColumns,
      results,
      indexPattern: dataSource?.indexPattern as IndexPattern,
      DocViewInspectButton,
      filters,
      setFilters,
    });

    const { pagination, sorting } = dataGridProps;

    useEffect(() => {
      if (isDataSourceLoading) {
        return;
      }
      fetchData({
        pagination,
        sorting,
        filters: fetchFilters,
        // optionally add date range filter for index pattern with timefield name
        ...(dataSource?.indexPattern?.timeFieldName
          ? { dateRange: { from: dateRangeFrom, to: dateRangeTo } }
          : {}),
      })
        .then(results => {
          setResults(results);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching data',
          });
          ErrorHandler.handleError(searchError);
        });
    }, [
      JSON.stringify(fetchFilters),
      JSON.stringify(query),
      JSON.stringify(pagination),
      JSON.stringify(sorting),
      fingerprint,
      isDataSourceLoading,
      // Support for index pattern with timeFields
      dataSource?.indexPattern?.timeFieldName && dateRangeFrom,
      dataSource?.indexPattern?.timeFieldName && dateRangeTo,
    ]);

    const closeFlyoutHandler = () => setInspectedHit(undefined);
    return (
      <>
        {!isDataSourceLoading && (
          <EnhancedTable
            dataGridProps={dataGridProps}
            searchBarProps={searchBarProps}
            filters={filters}
            fixedFilters={fixedFilters}
            title={title}
            showSearchBar={showSearchBar}
            results={results}
            dataSource={dataSource}
            fetchFilters={fetchFilters}
            query={query}
            displayOnlyNoResultsCalloutOnNoResults={
              displayOnlyNoResultsCalloutOnNoResults
            }
            isDataSourceLoading={isDataSourceLoading}
          />
        )}
        {inspectedHit && (
          <EuiFlyout onClose={closeFlyoutHandler} size='m'>
            <EuiFlyoutHeader>
              <EuiTitle>
                <h2>{inspectDetailsTitle}</h2>
              </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
              <EuiFlexGroup direction='column'>
                <DocumentViewTableAndJson
                  document={inspectedHit}
                  indexPattern={dataSource?.indexPattern}
                  renderFields={getAllCustomRenders(
                    tableDefaultColumns,
                    wzDiscoverRenderColumns,
                  )}
                  filters={filters}
                  setFilters={setFilters}
                  onFilter={closeFlyoutHandler}
                  additionalTabs={additionalDocumentDetailsTabs}
                />
              </EuiFlexGroup>
            </EuiFlyoutBody>
          </EuiFlyout>
        )}
      </>
    );
  },
);

export interface WzTableDiscoverProps {
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
  DataSourceRepositoryCreator: tDataSourceRepository<tParsedIndexPattern>;
  tableDefaultColumns: tDataGridColumn[];
  createNewSearchContext?: CreateNewSearchContext;
  useAbsoluteDateRange?: boolean;
  displayOnlyNoResultsCalloutOnNoResults?: boolean;
  title?: React.ReactNode;
  inspectDetailsTitle?: string;
  additionalDocumentDetailsTabs?: DocumentViewTableAndJsonPropsAdditionalTabs;
  showSearchBar: boolean;
  searchBarProps: any;
}

export const TableDiscover = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  createNewSearchContext = false,
  useAbsoluteDateRange = false,
  displayOnlyNoResultsCalloutOnNoResults,
  title,
  inspectDetailsTitle,
  additionalDocumentDetailsTabs,
  showSearchBar,
  searchBarProps = {},
}: WzTableDiscoverProps) => {
  const {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    searchBarProps: managedSearchBarProps,
    fingerprint,
  } = useDataSourceWithSearchBar({
    DataSource,
    DataSourceRepositoryCreator,
    createNewSearchContext,
    useAbsoluteDateRange,
  });

  const composedSearchBarProps = {
    ...managedSearchBarProps,
    ...searchBarProps,
  };

  return (
    <EnhancedTableUseParentDataSourceSearchBar
      dataSource={dataSource}
      filters={filters}
      fetchFilters={fetchFilters}
      fixedFilters={fixedFilters}
      isDataSourceLoading={isDataSourceLoading}
      fetchData={fetchData}
      setFilters={setFilters}
      searchBarProps={composedSearchBarProps}
      fingerprint={fingerprint}
      tableDefaultColumns={tableDefaultColumns}
      displayOnlyNoResultsCalloutOnNoResults={
        displayOnlyNoResultsCalloutOnNoResults
      }
      title={title}
      inspectDetailsTitle={inspectDetailsTitle}
      additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
      showSearchBar={showSearchBar}
    />
  );
};
/**
 * React component that renders a search bar and a grid table using a data
 * source, data source repository creator and table default columns
 * @param param0
 * @returns
 */
export const WzTableDiscover = compose(
  withWrapComponent(({ children }) => (
    <IntlProvider locale='en'>
      <>
        <EuiPageTemplate
          className='wz-table-discover-container'
          restrictWidth='100%'
          fullHeight={true}
          grow
          paddingSize='none'
          pageContentProps={{ color: 'transparent' }}
        >
          {children}
        </EuiPageTemplate>
      </>
    </IntlProvider>
  )),
  withErrorBoundary,
)(TableDiscover);
