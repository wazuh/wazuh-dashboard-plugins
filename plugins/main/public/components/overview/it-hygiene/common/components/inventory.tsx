import React, { useState } from 'react';
import { EuiTabs, EuiTab, EuiPageTemplate } from '@elastic/eui';
import { EnhancedTableUseParentDataSourceSearchBar } from '../../../../common/wazuh-discover/table';
import { useDataSourceWithSearchBar } from '../../../../common/hooks/use-data-source-search-context';
import { IntlProvider } from 'react-intl';
import { CustomSearchBar } from '../../../../common/custom-search-bar';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';

export interface ITHygieneInventoryTabLayoutProps {
  tabs: { id: string; name: string; component: any }[];
}

export const ITHygieneInventoryTabLayout = ({
  tabs,
}: ITHygieneInventoryTabLayoutProps) => {
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);

  const Component = tabs.find(({ id }) => id === selectedTab)?.component; // TODO: use navigation based on URL

  return (
    <>
      <EuiTabs>
        {tabs.map(tab => (
          <EuiTab
            key={tab.id}
            isSelected={tab.id === selectedTab}
            onClick={() => setSelectedTab(tab.id)}
          >
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>
      {Component && <Component />}
    </>
  );
};

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

export const ITHygieneInventoryDashboardTable = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  getDashboardPanels,
  managedFilters,
}: ITHygieneInventoryTabLayoutProps) => {
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
              />
              {getDashboardPanels && (
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
                    description: 'IT Hygiene dashboard ',
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
              />
            </>
          )}
        </EuiPageTemplate>
      </>
    </IntlProvider>
  );
};
