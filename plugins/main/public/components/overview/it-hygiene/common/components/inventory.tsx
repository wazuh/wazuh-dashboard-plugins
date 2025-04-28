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
import { withDataSourceInitiated, withGuard } from '../../../../common/hocs';
import { LoadingSearchbarProgress } from '../../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { compose } from 'redux';
import { DiscoverNoResults } from '../../../../common/no-results/no-results';

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

const ITHygieneInventoryDashboardOnResults = compose(
  withGuard(
    ({ results }) => typeof results?.hits?.total === 'undefined',
    () => null,
  ),
  withGuard(
    ({ results }) => results?.hits?.total === 0,
    () => <DiscoverNoResults />,
  ),
)(
  ({
    dataSource,
    filters,
    fixedFilters,
    fetchFilters,
    setFilters,
    fingerprint,
    searchBarProps,
    isDataSourceLoading,
    getDashboardPanels,
    dataGridProps,
    results,
    inspectedHit,
    removeInspectedHit,
    tableDefaultColumns,
  }: ITHygieneInventoryDashboardTableProps) => {
    return (
      <>
        <div className='wz-dashboard-responsive'>
          {getDashboardPanels && dataSource && (
            <DashboardByRenderer
              input={{
                viewMode: ViewMode.VIEW,
                panels: getDashboardPanels(dataSource?.id),
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
      </>
    );
  },
);

const ITHygieneInventoryDashboard = compose(
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
      <>
        <CustomSearchBar
          searchBarProps={searchBarProps}
          indexPattern={dataSource?.indexPattern}
          setFilters={setFilters}
          fixedFilters={fixedFilters}
          filterInputs={managedFilters || []}
          filterInputsProps={managedFiltersProps}
        />
        <ITHygieneInventoryDashboardOnResults
          dataSource={dataSource}
          filters={filters}
          fetchFilters={fetchFilters}
          fixedFilters={fixedFilters}
          isDataSourceLoading={isDataSourceLoading}
          setFilters={setFilters}
          searchBarProps={searchBarProps}
          displayOnlyNoResultsCalloutOnNoResults={true}
          showSearchBar={false}
          getDashboardPanels={getDashboardPanels}
          dataGridProps={dataGridProps}
          results={results}
          inspectedHit={inspectedHit}
          removeInspectedHit={removeInspectedHit}
          tableDefaultColumns={tableDefaultColumns}
        />
      </>
    );
  },
);

export interface ITHygieneInventoryDashboardTableProps {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  tableDefaultColumns: { id: string }[];
  getDashboardPanels: (indexPatternID: string) => any;
  managedFilters: CustomSearchBarProps['filterInputs'];
  managedFiltersProps?: CustomSearchBarProps['filterInputsProps'];
  tableId: TableDataGridWithSearchBarInspectedHitFetchDataTableId;
}

export const ITHygieneInventoryDashboardTable = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  getDashboardPanels,
  managedFilters,
  managedFiltersProps,
  tableId,
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
    />
  );
};
