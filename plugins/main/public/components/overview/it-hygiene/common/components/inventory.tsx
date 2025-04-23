import React from 'react';
import { EuiPageTemplate } from '@elastic/eui';
import {
  EnhancedTableUseParentDataSourceSearchBar,
  EnhancedTableUseParentDataSourceSearchBarTableID,
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

export interface ITHygieneInventoryDashboardTableProps {
  DataSource: any;
  DataSourceRepositoryCreator: any;
  tableDefaultColumns: { id: string }[];
  getDashboardPanels: (indexPatternID: string) => any;
  managedFilters: CustomSearchBarProps['filterInputs'];
  managedFiltersProps?: CustomSearchBarProps['filterInputsProps'];
  tableID: EnhancedTableUseParentDataSourceSearchBarTableID;
}

export const ITHygieneInventoryDashboardTable = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  getDashboardPanels,
  managedFilters,
  managedFiltersProps,
  tableID,
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
          {!isDataSourceLoading && (
            <>
              <CustomSearchBar
                searchBarProps={searchBarProps}
                indexPattern={dataSource?.indexPattern}
                setFilters={setFilters}
                fixedFilters={fixedFilters}
                filterInputs={managedFilters || []}
                filterInputsProps={managedFiltersProps}
              />
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
                    hidePanelTitles: true,
                    lastReloadRequestTime: fingerprint,
                  }}
                />
              )}
              <EnhancedTableUseParentDataSourceSearchBar
                dataSource={dataSource}
                filters={filters}
                fetchFilters={fetchFilters}
                fixedFilters={fixedFilters}
                isDataSourceLoading={isDataSourceLoading}
                fetchData={fetchData}
                setFilters={setFilters}
                searchBarProps={searchBarProps}
                fingerprint={fingerprint}
                tableDefaultColumns={tableDefaultColumns}
                displayOnlyNoResultsCalloutOnNoResults={true}
                showSearchBar={false}
                tableID={tableID}
              />
            </>
          )}
        </EuiPageTemplate>
      </>
    </IntlProvider>
  );
};
