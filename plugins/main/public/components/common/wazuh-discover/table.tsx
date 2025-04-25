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
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
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
import { omit } from 'lodash';
import { useEffectAvoidOnNotMount } from '../hooks';

export interface TableDataGridBasicProps<K> {
  dataGridProps: TDataGridReturn;
  results: SearchResponse;
  dataSource: tUseDataSourceLoadedReturns<K>['dataSource'];
  fetchFilters: tUseDataSourceLoadedReturns<K>['fetchFilters'];
  query: { query: string; language: string };
  isDataSourceLoading: boolean;
  displayOnlyNoResultsCalloutOnNoResults?: boolean;
}

const Padding = ({ children, style }: { children; style?: object }) => (
  <div className='euiPanel--paddingSmall' {...{ style }}>
    {children}
  </div>
);

/**
 * Render a basic data grid that uses the dataSource.
 * Guards:
 * - no results, display null
 * - displayOnlyNoResultsCalloutOnNoResults=true and results = 0, display no result callout
 */
export const TableDataGridBasic: React.FunctionComponent<TableDataGridBasicProps> =
  compose(
    withGuard(
      /* This avoids the table is rendered, waiting to the there are results. This and the usage of displayOnlyNoResultsCalloutOnNoResults=true avoids a problem when there is no data related to a sub data source (FIM>Files/Registries, System inventory>Ports/Interfaces/etc...)
      If the useDataGrid would ensure the columns to render in the table exist in the index pattern, the table could be rendered before the request to fetch the data is done and this withGuard could be removed, removing the requirement to use displayOnlyNoResultsCalloutOnNoResults=true too.
      */
      ({ results }) => typeof results?.hits?.total === 'undefined',
      () => null,
    ),
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
    ),
  )(
    ({
      dataGridProps,
      results,
      dataSource,
      fetchFilters,
      query,
    }: TableDataGridBasicProps) => {
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
        <EuiDataGrid
          {...omit(dataGridProps, ['columnsAvailable', 'setPagination'])}
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
      );
    },
  );

export type TableDataGridWithSearchBarProps<K> = TableDataGridBasicProps<K> & {
  searchBarProps: any;
  filters: any;
  fixedFilters: any;
  title?: string;
  showSearchBar?: boolean;
};

/**
 * Render a basic data grid that uses the dataSource and optionally a title and search bar (require
 * search bar props).
 * Guards:
 * - data source should be initiated
 */
const TableDataGridWithSearchBar: React.FunctionComponent<
  TableDataGridWithSearchBarProps<K>
> = withDataSourceInitiated({
  dataSourceNameProp: 'dataSource',
  isLoadingNameProp: 'isDataSourceLoading',
})(
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
  }: TableDataGridWithSearchBarProps<K>) => (
    <>
      {title && (
        <Padding style={{ paddingBottom: 0, paddingTop: 0 }}>
          <EuiTitle
            data-test-subj='wz-table-data-grid-with-search-bar-title'
            size='s'
          >
            <h1>{title}</h1>
          </EuiTitle>
        </Padding>
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
      <Padding>
        <TableDataGridBasic
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
      </Padding>
    </>
  ),
);

/**
 * Fetch data using data source ( depecendencies generatedd by useDataSource), generate the inspect
 * document button and dataGridProps with the inspector button. This could be useful for a dashboard
 * that uses a data grid table and hide all the dashboard if there are not results ( it is required
 * adding optional rendering)
 * @param param0
 * @returns
 */
export const useTableDataGridFetch = ({
  searchBarProps,
  tableId,
  tableDefaultColumns,
  dataSource,
  filters,
  setFilters,
  isDataSourceLoading,
  fetchData,
  fetchFilters,
  fingerprint,
  autoRefreshFingerprint,
}) => {
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
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
    moduleId: tableId,
    ariaLabelledBy: 'Table',
    defaultColumns: tableDefaultColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: dataSource?.indexPattern as IndexPattern,
    DocViewInspectButton,
    filters,
    setFilters,
  });

  const [reloadFetch, setReloadFetch] = useState(0);

  const { pagination, setPagination, sorting } = dataGridProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({
      query: searchBarProps.query,
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
  }, [reloadFetch, JSON.stringify(sorting), JSON.stringify(pagination)]);

  // Reset the pagination and reload fetch time when the filters changed.
  useEffectAvoidOnNotMount(() => {
    if (isDataSourceLoading) {
      return;
    }
    setPagination(pagination => ({
      ...pagination,
      pageIndex: 0,
    }));
    setReloadFetch(state => state + 1);
    // setAbsoluteDateRange( // TODO: add support for absolute date range
    //   transformDateRange({ from: dateRangeFrom, to: dateRangeTo }),
    // );
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    // Support for index pattern with timeFields
    dataSource?.indexPattern?.timeFieldName && dateRangeFrom,
    dataSource?.indexPattern?.timeFieldName && dateRangeTo,
    // fingerprints
    fingerprint,
    autoRefreshFingerprint,
  ]);

  const removeInspectedHit = () => setInspectedHit(undefined);

  return {
    results,
    dataGridProps,
    inspectedHit,
    removeInspectedHit,
  };
};

export type TableDataGridWithSearchBarInspectedHitProps<K> =
  TableDataGridWithSearchBarProps<K> & {
    setFilters: any;
    searchBarProps: any;
    inspectDetailsTitle?: string;
    additionalDocumentDetailsTabs?: DocumentViewTableAndJsonPropsAdditionalTabs;
    results: any; // Enhance
    inspectedHit: any; // Enhance
    removeInspectedHit: () => void;
  };

/**
 * Render a basic data grid that uses the dataSource, a flyout with the document details and
 * optionally a title and search bar (require search bar props).
 * Guards:
 * - data source is not loaded, display a bar progress
 * - data source should be initiated
 */
export const TableDataGridWithSearchBarInspectedHit: React.FunctionComponent<
  TableDataGridWithSearchBarInspectedHitProps<K>
> = compose(
  withGuard(
    ({ isDataSourceLoading }) => isDataSourceLoading,
    LoadingSearchbarProgress,
  ),
  withDataSourceInitiated({
    dataSourceNameProp: 'dataSource',
    isLoadingNameProp: 'isDataSourceLoading',
  }),
)(
  ({
    dataSource,
    fetchFilters,
    fixedFilters,
    filters,
    setFilters,
    searchBarProps,
    isDataSourceLoading,
    tableDefaultColumns,
    inspectDetailsTitle = 'Details',
    additionalDocumentDetailsTabs = [],
    displayOnlyNoResultsCalloutOnNoResults,
    title,
    showSearchBar,
    results,
    query,
    inspectedHit,
    removeInspectedHit,
    dataGridProps,
  }: TableDataGridWithSearchBarInspectedHitProps) => {
    return (
      <>
        <TableDataGridWithSearchBar
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
        {inspectedHit && (
          <DocumentDetailsOnFlyout
            title={inspectDetailsTitle}
            document={inspectedHit}
            indexPattern={dataSource?.indexPattern}
            tableDefaultColumns={tableDefaultColumns}
            filters={filters}
            setFilters={setFilters}
            onClose={removeInspectedHit}
            onFilter={removeInspectedHit}
            additionalTabs={additionalDocumentDetailsTabs}
          />
        )}
      </>
    );
  },
);

export type TableDataGridWithSearchBarInspectedHitFetchDataTableId = string;

export type TableDataGridWithSearchBarInspectedHitFetchDataProps<K> =
  TableDataGridWithSearchBarProps<K> & {
    fetchData: any;
    setFilters: any;
    searchBarProps: any;
    fingerprint: number;
    autoRefreshFingerprint: number;
    tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
  };

/**
 * Render a basic data grid that uses the dataSource, a flyout with the document details and
 * optionally a title and search bar (require search bar props). It fetches the data on mounted.
 * Guards:
 * - data source is not loaded, display a bar progress
 * - data source should be initiated
 */
export const TableDataGridWithSearchBarInspectedHitFetchData: React.FunctionComponent<
  TableDataGridWithSearchBarInspectedHitFetchDataProps<K>
> = compose(
  withGuard(
    ({ isDataSourceLoading }) => isDataSourceLoading,
    LoadingSearchbarProgress,
  ),
  withDataSourceInitiated({
    dataSourceNameProp: 'dataSource',
    isLoadingNameProp: 'isDataSourceLoading',
  }),
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
    autoRefreshFingerprint,
    tableDefaultColumns,
    inspectDetailsTitle = 'Details',
    additionalDocumentDetailsTabs = [],
    displayOnlyNoResultsCalloutOnNoResults,
    title,
    showSearchBar,
    tableId,
  }: TableDataGridWithSearchBarInspectedHitFetchDataProps) => {
    const { results, dataGridProps, inspectedHit, removeInspectedHit } =
      useTableDataGridFetch({
        searchBarProps,
        tableId,
        tableDefaultColumns,
        dataSource,
        filters,
        setFilters,
        isDataSourceLoading,
        fetchData,
        fetchFilters,
        fingerprint,
        autoRefreshFingerprint,
      });

    return (
      <TableDataGridWithSearchBarInspectedHit
        dataGridProps={dataGridProps}
        searchBarProps={searchBarProps}
        filters={filters}
        fixedFilters={fixedFilters}
        title={title}
        showSearchBar={showSearchBar}
        results={results}
        dataSource={dataSource}
        fetchFilters={fetchFilters}
        query={searchBarProps.query}
        displayOnlyNoResultsCalloutOnNoResults={
          displayOnlyNoResultsCalloutOnNoResults
        }
        isDataSourceLoading={isDataSourceLoading}
        setFilters={setFilters}
        inspectedHit={inspectedHit}
        removeInspectedHit={removeInspectedHit}
        inspectDetailsTitle={inspectDetailsTitle}
        additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
      />
    );
  },
);

export const DocumentDetails = withWrapComponent(({ children }) => (
  <EuiFlexGroup direction='column'>{children}</EuiFlexGroup>
))(
  ({
    document,
    indexPattern,
    tableDefaultColumns,
    filters,
    setFilters,
    onFilter,
    additionalTabs,
    showFilterButtons,
  }) => (
    <DocumentViewTableAndJson
      document={document}
      indexPattern={indexPattern}
      renderFields={getAllCustomRenders(
        tableDefaultColumns,
        wzDiscoverRenderColumns,
      )}
      filters={filters}
      setFilters={setFilters}
      onFilter={onFilter}
      additionalTabs={additionalTabs}
      showFilterButtons={showFilterButtons}
    />
  ),
);

export const FlyoutDocumentDetails = ({
  title = 'Details',
  children,
  onClose,
}) => (
  <EuiFlyout onClose={onClose} size='m'>
    <EuiFlyoutHeader>
      <EuiTitle>
        <h2>{title}</h2>
      </EuiTitle>
    </EuiFlyoutHeader>
    <EuiFlyoutBody>{children}</EuiFlyoutBody>
  </EuiFlyout>
);

export const withFlyoutDocumentDetails = withWrapComponent(
  FlyoutDocumentDetails,
);
export const DocumentDetailsOnFlyout =
  withFlyoutDocumentDetails(DocumentDetails);

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
  tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
}

export const TableDataGridDiscoverBasic = ({
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
  tableId,
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
    autoRefreshFingerprint,
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
    <TableDataGridWithSearchBarInspectedHitFetchData
      dataSource={dataSource}
      filters={filters}
      fetchFilters={fetchFilters}
      fixedFilters={fixedFilters}
      isDataSourceLoading={isDataSourceLoading}
      fetchData={fetchData}
      setFilters={setFilters}
      searchBarProps={composedSearchBarProps}
      fingerprint={fingerprint}
      autoRefreshFingerprint={autoRefreshFingerprint}
      tableDefaultColumns={tableDefaultColumns}
      displayOnlyNoResultsCalloutOnNoResults={
        displayOnlyNoResultsCalloutOnNoResults
      }
      title={title}
      inspectDetailsTitle={inspectDetailsTitle}
      additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
      showSearchBar={showSearchBar}
      tableId={tableId}
    />
  );
};
/**
 * React component that renders a search bar and a grid table using a data
 * source, data source repository creator and table default columns
 * @param param0
 * @returns
 */
export const TableDataGridDiscover: React.FunctionComponent<WzTableDiscoverProps> =
  compose(
    withWrapComponent(({ children }) => (
      <IntlProvider locale='en'>
        <>
          <EuiPageTemplate
            className='wz-table-data-grid wz-table-data-grid-y-scroll'
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
  )(TableDataGridDiscoverBasic);
