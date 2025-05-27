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
import {
  HideOnErrorInitializatingDataSource,
  PromptErrorInitializatingDataSource,
} from '../hocs';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
// import { DiscoverNoResults } from '../../../../common/no-results/no-results';
import { DiscoverNoResults } from '../no-results/no-results';
import { SampleDataWarning } from '../../visualize/components';
import { IndexPattern } from '../../../../../../src/plugins/data/public/';
import classnames from 'classnames';

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const InventoryDashboard = ({
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
  indexPattern,
  error,
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
      {isDataSourceLoading && !dataSource ? (
        <LoadingSearchbarProgress />
      ) : (
        <>
          {/* WORKAROUND1: Taking into account the workaround to mitigate the embedable dashboard
              breaks due to navigation while this is being created, we are rendering the dashboard
              with the index pattern provided by a HOC that checks if the index pattern exists
              instead of the provided by the creation of he dataSource, this move does the dashboard
              is created early, reducing the wait time and possibility to navigate to another view.

              If there is an error with the creation of the dataSource, using the "wz-no-display"
              class, "hides" the search bar, that with an additional optional rendering of a prompt
              (for example: PromptErrorInitializatingDataSource), could similate the view is
              protected, despite there are some components that are rendered.*/}
          <HideOnErrorInitializatingDataSource error={error}>
            <CustomSearchBar
              searchBarProps={searchBarProps}
              indexPattern={dataSource?.indexPattern}
              setFilters={setFilters}
              fixedFilters={fixedFilters}
              filterInputs={managedFilters || []}
              filterInputsProps={managedFiltersProps}
            />
          </HideOnErrorInitializatingDataSource>

          {dataSource && results?.hits?.total === 0 ? (
            <DiscoverNoResults />
          ) : null}
          <div
            className={classnames(
              'wz-dashboard-responsive',
              'wz-dashboard-hide-tables-pagination-export-csv-controls',
              classNameDashboardWrapper,
              {
                'wz-no-display': !(dataSource && results?.hits?.total > 0),
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
                  panels: getDashboardPanels(
                    dataSource?.id || indexPattern?.id,
                  ),
                  isFullScreenMode: false,
                  filters: fetchFilters ?? [],
                  useMargins: true,
                  id: 'it-hygiene-inventory-dashboard',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'IT Hygiene inventory dahsboard',
                  description: 'IT Hygiene dashboard',
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
          {dataSource && results?.hits?.total > 0 && (
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
                    additionalDocumentDetailsTabs={
                      additionalDocumentDetailsTabs
                    }
                  />
                </EuiPageTemplate>
              </>
            </IntlProvider>
          )}
          {/* Read WORKAROUND1 */}
          {error && <PromptErrorInitializatingDataSource error={error} />}
        </>
      )}
    </>
  );
};

export interface InventoryDashboardTableProps {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  tableDefaultColumns: { id: string }[];
  getDashboardPanels: (indexPatternID: string) => any;
  managedFilters: CustomSearchBarProps['filterInputs'];
  managedFiltersProps?: CustomSearchBarProps['filterInputsProps'];
  tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
  indexPattern: IndexPattern;
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
  indexPattern,
  additionalDocumentDetailsTabs,
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
    showDatePicker: false,
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
      indexPattern={indexPattern}
      classNameDashboardWrapper={classNameDashboardWrapper}
      additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
    />
  );
};
