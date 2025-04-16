import React, { useState } from 'react';
import { EuiTabs, EuiTab } from '@elastic/eui';
import { WzTableDiscover } from '../../../../common/wazuh-discover/table';

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

export const ITHygieneInventoryDashboardTable = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
}: ITHygieneInventoryTabLayoutProps) => {
  return (
    <>
      <WzTableDiscover
        DataSource={DataSource}
        DataSourceRepositoryCreator={DataSourceRepositoryCreator}
        showSearchBar={true}
        searchBarProps={{
          showDatePicker: false,
          showQueryInput: true,
          showQueryBar: true,
          showSaveQuery: true,
        }}
        displayOnlyNoResultsCalloutOnNoResults={true}
        tableDefaultColumns={tableDefaultColumns}
      />
    </>
  );
};
