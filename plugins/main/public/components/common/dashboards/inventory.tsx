import React from 'react';
import { EuiPageTemplate } from '@elastic/eui';
import {
  TableDataGridWithSearchBarInspectedHit,
  TableDataGridWithSearchBarInspectedHitFetchDataTableId,
  TableDataGridWithSearchBarInspectedHitProps,
  useTableDataGridFetch,
} from '../wazuh-discover/table';
import { useDataSourceWithSearchBar } from '../hooks/use-data-source-search-context';
import { IntlProvider } from 'react-intl';
import { CustomSearchBar } from '../custom-search-bar';
import DashboardRenderer from './dashboard-renderer/dashboard-renderer';
import { CustomSearchBarProps } from '../custom-search-bar/custom-search-bar';
import { withDataSourceInitiated, withDataSourceLoading } from '../hocs';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
import { DiscoverNoResults } from '../no-results/no-results';
import { QueryErrorPrompt } from '../query-error';
import { SampleDataWarning } from '../../visualize/components';
import classnames from 'classnames';
import { compose } from 'redux';
import { exportSearchToCSV } from '../data-grid';
import { useReportingCommunicateTableContext } from '../hooks/use-reporting-communicate-table-context';
import {
  getInventoryExportFileName,
  getInventoryReportFields,
} from './inventory-report';

const InventoryDashboard = compose(
  withDataSourceLoading({
    isLoadingNameProp: 'isDataSourceLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    isLoadingNameProp: 'isDataSourceLoading',
    dataSourceNameProp: 'dataSource',
    dataSourceErrorNameProp: 'error',
  }),
)(
  ({
    dataSource,
    filters,
    fixedFilters,
    fetchFilters,
    setFilters,
    fetchData,
    fingerprint,
    autoRefreshFingerprint,
    searchBarProps,
    isDataSourceLoading,
    tableDefaultColumns,
    getDashboardPanels,
    managedFilters,
    managedFiltersProps,
    tableId,
    categoriesSampleData,
    classNameDashboardWrapper,
    additionalDocumentDetailsTabs,
    exportFileName = getInventoryExportFileName(tableId),
  }: InventoryDashboardTableProps) => {
    const {
      results,
      error: fetchError,
      dataGridProps,
      inspectedHit,
      removeInspectedHit,
      onDocumentMutated,
      caseRefreshKey,
    } = useTableDataGridFetch({
      searchBarProps,
      tableId,
      tableDefaultColumns,
      dataSource,
      filters,
      fetchFilters,
      setFilters,
      fetchData,
      fingerprint,
      autoRefreshFingerprint,
      isDataSourceLoading,
    });

    const dashboardFingerprint = (fingerprint ?? 0) + caseRefreshKey;

    useReportingCommunicateTableContext({
      totalResults: fetchError ? 0 : results?.hits?.total,
      generateReport: () =>
        exportSearchToCSV(
          {
            indexPattern: dataSource.indexPattern,
            filters: fetchFilters,
            query: searchBarProps.query,
            fields: getInventoryReportFields(
              dataGridProps.columnVisibility.visibleColumns,
              dataSource.indexPattern,
            ),
            pagination: { pageIndex: 0, pageSize: results.hits.total },
            sorting: dataGridProps.sorting,
          },
          { fileName: exportFileName },
        ),
    });

    const shouldHideDashboard =
      Boolean(fetchError) || !Boolean(results?.hits?.total > 0);

    return (
      <>
        <CustomSearchBar
          searchBarProps={searchBarProps}
          indexPattern={dataSource?.indexPattern}
          setFilters={setFilters}
          fixedFilters={fixedFilters}
          filterInputs={managedFilters || []}
          filterInputsProps={managedFiltersProps}
        />

        {fetchError ? (
          <QueryErrorPrompt
            error={fetchError}
            indexPatternTitle={dataSource?.indexPattern?.title}
          />
        ) : null}
        {!fetchError && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}

        {categoriesSampleData && (
          <div
            className={classnames(classNameDashboardWrapper, {
              'wz-no-display': Boolean(fetchError) || !shouldHideDashboard,
            })}
          >
            <SampleDataWarning categoriesSampleData={categoriesSampleData} />
          </div>
        )}
        <div className='wz-dashboard-responsive'>
          {getDashboardPanels && (
            <>
              {getDashboardPanels.map(
                ({ dashboardId, agentDashboardId, className = '' }, index) => {
                  const dashboard = (
                    <DashboardRenderer
                      key={index}
                      dashboardId={dashboardId}
                      agentDashboardId={agentDashboardId}
                      className={classnames(className, {
                        'wz-no-display': shouldHideDashboard,
                        'wz-dashboard-hide-tables-pagination-export-csv-controls':
                          true,
                      })}
                      hasPinnedAgent={Boolean(
                        dataSource?.getPinnedAgentFilter?.()?.length,
                      )}
                      config={{
                        dataSource: {
                          ...dataSource,
                          searchBarProps,
                          fetchFilters,
                          fingerprint: dashboardFingerprint,
                          autoRefreshFingerprint,
                        },
                      }}
                    />
                  );

                  if (className) {
                    return <div key={index}>{dashboard}</div>;
                  }

                  return dashboard;
                },
              )}
            </>
          )}
        </div>
        {!fetchError && results?.hits?.total > 0 && (
          <IntlProvider locale='en'>
            <>
              <EuiPageTemplate
                className='wz-table-data-grid'
                restrictWidth='100%'
                fullHeight={true}
                grow
                paddingSize='none'
                // The app root renders the main landmark
                pageContentProps={{ color: 'transparent', role: null }}
              >
                <TableDataGridWithSearchBarInspectedHit
                  dataSource={dataSource}
                  filters={filters}
                  fetchFilters={fetchFilters}
                  fixedFilters={fixedFilters}
                  isDataSourceLoading={isDataSourceLoading}
                  setFilters={setFilters}
                  searchBarProps={searchBarProps}
                  query={searchBarProps.query}
                  exportFileName={exportFileName}
                  displayOnlyNoResultsCalloutOnNoResults={true}
                  showSearchBar={false}
                  dataGridProps={dataGridProps}
                  results={results}
                  inspectedHit={inspectedHit}
                  removeInspectedHit={removeInspectedHit}
                  onDocumentMutated={onDocumentMutated}
                  tableDefaultColumns={tableDefaultColumns}
                  additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
                />
              </EuiPageTemplate>
            </>
          </IntlProvider>
        )}
      </>
    );
  },
);

export interface InventoryDashboardTableProps {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  tableDefaultColumns: { id: string }[];
  getDashboardPanels: Array<{
    dashboardId: string;
    agentDashboardId?: string;
    className?: string;
  }>;
  managedFilters: CustomSearchBarProps['filterInputs'];
  managedFiltersProps?: CustomSearchBarProps['filterInputsProps'];
  tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
  categoriesSampleData?: string[];
  classNameDashboardWrapper?: string;
  additionalDocumentDetailsTabs?: TableDataGridWithSearchBarInspectedHitProps<K>['additionalDocumentDetailsTabs'];
  // Name of the exported files when the table id does not match the tab name
  exportFileName?: string;
}

export const InventoryDashboardTable = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  getDashboardPanels,
  classNameDashboardWrapper,
  managedFilters,
  managedFiltersProps,
  tableId,
  additionalDocumentDetailsTabs,
  categoriesSampleData,
  exportFileName,
}: InventoryDashboardTableProps) => {
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
    error,
  } = useDataSourceWithSearchBar({
    DataSource: DataSource,
    DataSourceRepositoryCreator: DataSourceRepositoryCreator,
  });

  const searchBarProps = {
    ...managedSearchBarProps,
    showDatePicker: Boolean(dataSource?.indexPattern?.timeFieldName),
    showQueryInput: true,
    showQueryBar: true,
    showSaveQuery: true,
  };

  return (
    <InventoryDashboard
      dataSource={dataSource}
      filters={filters}
      fetchFilters={fetchFilters}
      fixedFilters={fixedFilters}
      setFilters={setFilters}
      fetchData={fetchData}
      fingerprint={fingerprint}
      isDataSourceLoading={isDataSourceLoading}
      searchBarProps={searchBarProps}
      autoRefreshFingerprint={autoRefreshFingerprint}
      tableDefaultColumns={tableDefaultColumns}
      getDashboardPanels={getDashboardPanels}
      managedFilters={managedFilters}
      managedFiltersProps={managedFiltersProps}
      tableId={tableId}
      error={error}
      classNameDashboardWrapper={classNameDashboardWrapper}
      additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
      categoriesSampleData={categoriesSampleData}
      exportFileName={exportFileName}
    />
  );
};
