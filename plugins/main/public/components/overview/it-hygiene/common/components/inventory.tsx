import React from 'react';
import { EuiPageTemplate } from '@elastic/eui';
import {
  TableDataGridWithSearchBarInspectedHit,
  TableDataGridWithSearchBarInspectedHitFetchDataTableId,
  useTableDataGridFetch,
} from '../../../../common/wazuh-discover/table';
import { useDataSourceWithSearchBar } from '../../../../common/hooks/use-data-source-search-context';
import { IntlProvider } from 'react-intl';
import { CustomSearchBar } from '../../../../common/custom-search-bar';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import {
  TabsManagedBySearchParam,
  TabsManagedBySearchParamProps,
} from '../../../../navigation/tabs-managed-by-search-params';
import { CustomSearchBarProps } from '../../../../common/custom-search-bar/custom-search-bar';
import {
  HideOnErrorInitializatingDataSource,
  PromptErrorInitializatingDataSource,
} from '../../../../common/hocs';
import { LoadingSearchbarProgress } from '../../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { DiscoverNoResults } from '../../../../common/no-results/no-results';
import { SampleDataWarning } from '../../../../visualize/components';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../common/constants';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public/';

export const ITHygieneInventoryTabLayout = ({
  tabs,
}: TabsManagedBySearchParamProps) => {
  return (
    <TabsManagedBySearchParam
      tabs={tabs}
      searchParamNavigation='tabSubView'
      tabsProps={{ size: 's' }}
    />
  );
};

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const ITHygieneInventoryDashboard = ({
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
}: ITHygieneInventoryDashboardTableProps) => {
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
    <div style={{ margin: '0 12px' }}>
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
            className={`wz-dashboard-responsive wz-dashboard-hide-tables-pagination-export-csv-controls ${
              dataSource && results?.hits?.total > 0 ? '' : 'wz-no-display'
            }`}
          >
            <SampleDataWarning
              categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
            />
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
                  />
                </EuiPageTemplate>
              </>
            </IntlProvider>
          )}
          {/* Read WORKAROUND1 */}
          {error && <PromptErrorInitializatingDataSource error={error} />}
        </>
      )}
    </div>
  );
};

export interface ITHygieneInventoryDashboardTableProps {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  tableDefaultColumns: { id: string }[];
  getDashboardPanels: (indexPatternID: string) => any;
  managedFilters: CustomSearchBarProps['filterInputs'];
  managedFiltersProps?: CustomSearchBarProps['filterInputsProps'];
  tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
  indexPattern: IndexPattern;
}

export const ITHygieneInventoryDashboardTable = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  getDashboardPanels,
  managedFilters,
  managedFiltersProps,
  tableId,
  indexPattern,
}: ITHygieneInventoryDashboardTableProps) => {
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
    <ITHygieneInventoryDashboard
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
    />
  );
};
