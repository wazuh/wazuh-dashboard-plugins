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
import { getPlugins } from '../../../kibana-services';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { CustomSearchBarProps } from '../custom-search-bar/custom-search-bar';
import { withDataSourceInitiated, withDataSourceLoading } from '../hocs';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
import { DiscoverNoResults } from '../no-results/no-results';
import { SampleDataWarning } from '../../visualize/components';
import classnames from 'classnames';
import { compose } from 'redux';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

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
  }: InventoryDashboardTableProps) => {
    const { results, dataGridProps, inspectedHit, removeInspectedHit } =
      useTableDataGridFetch({
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

        {results?.hits?.total === 0 ? <DiscoverNoResults /> : null}
        <div
          className={classnames(
            'wz-dashboard-responsive',
            'wz-dashboard-hide-tables-pagination-export-csv-controls',
            classNameDashboardWrapper,
            {
              'wz-no-display': !(results?.hits?.total > 0),
            },
          )}
        >
          {categoriesSampleData && (
            <SampleDataWarning categoriesSampleData={categoriesSampleData} />
          )}
          {getDashboardPanels && (
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getDashboardPanels(dataSource?.id),
                isFullScreenMode: false,
                filters: fetchFilters ?? [],
                useMargins: true,
                id: 'inventory-dashboard',
                timeRange: {
                  from: searchBarProps.dateRangeFrom,
                  to: searchBarProps.dateRangeTo,
                },
                title: 'Inventory dahsboard',
                description: 'Inventory dahsboard',
                query: searchBarProps.query,
                refreshConfig: {
                  pause: false,
                  value: 15,
                },
                hidePanelTitles: false,
                lastReloadRequestTime: fingerprint,
              }}
            />
          )}
        </div>
        {results?.hits?.total > 0 && (
          <IntlProvider locale='en'>
            <>
              <EuiPageTemplate
                className='wz-table-data-grid'
                restrictWidth='100%'
                fullHeight={true}
                grow
                paddingSize='none'
                pageContentProps={{ color: 'transparent' }}
              >
                <TableDataGridWithSearchBarInspectedHit
                  dataSource={dataSource}
                  filters={filters}
                  fetchFilters={fetchFilters}
                  fixedFilters={fixedFilters}
                  isDataSourceLoading={isDataSourceLoading}
                  setFilters={setFilters}
                  searchBarProps={searchBarProps}
                  displayOnlyNoResultsCalloutOnNoResults={true}
                  showSearchBar={false}
                  dataGridProps={dataGridProps}
                  results={results}
                  inspectedHit={inspectedHit}
                  removeInspectedHit={removeInspectedHit}
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
  getDashboardPanels: (indexPatternID: string) => any;
  managedFilters: CustomSearchBarProps['filterInputs'];
  managedFiltersProps?: CustomSearchBarProps['filterInputsProps'];
  tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
  categoriesSampleData?: string[];
  classNameDashboardWrapper?: string;
  additionalDocumentDetailsTabs?: TableDataGridWithSearchBarInspectedHitProps<K>['additionalDocumentDetailsTabs'];
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
    />
  );
};
