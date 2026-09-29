import React, { useCallback, useEffect } from 'react';
import { EuiTabs, EuiTab } from '@elastic/eui';
import NavigationService from '../../react-services/navigation-service';
import { useRouterSearch } from '../common/hooks';

export interface TabsManagedBySearchParamProps {
  tabs: { id: string; name: string; component: React.ComponentType }[];
  searchParamNavigation: string;
  tabsProps: React.ComponentProps<typeof EuiTabs>;
}

/**
 * It renders tabs that are managed by a search query parameter and if the search
 * parameter is another value different to the expected tabs, then it selects the first tab
 * and replaces the search parameter value.
 * It uses the NavigationService to navigate.
 * @param param0
 * @returns
 */
export const TabsManagedBySearchParam = ({
  tabs,
  searchParamNavigation,
  tabsProps = {},
}: TabsManagedBySearchParamProps) => {
  const search = useRouterSearch();
  const selectedTabId = search[searchParamNavigation];
  /* The search parameter can be missing or hold a value that belongs to another module (for
  example, when switching between modules that have tabs managed by the same search parameter),
  so the first tab is used as fallback to avoid rendering an empty view. */
  const selectedTab = tabs.find(tab => tab.id === selectedTabId) ?? tabs[0];

  const switchTab = useCallback(
    (view: string, options?: { replace?: boolean }) => {
      NavigationService.getInstance().updateAndNavigateSearchParams(
        { [searchParamNavigation]: view },
        options,
      );
    },
    [searchParamNavigation],
  );

  useEffect(() => {
    if (selectedTabId !== selectedTab.id) {
      // Sync the URL with the rendered tab without adding a new history entry
      switchTab(selectedTab.id, { replace: true });
    }
  }, [selectedTabId, selectedTab.id, switchTab]);

  const { component: SelectedTabComponent } = selectedTab;

  return (
    <>
      <EuiTabs {...tabsProps} style={{ padding: '0px 14px' }}>
        {tabs.map(tab => (
          <EuiTab
            key={tab.id}
            isSelected={tab.id === selectedTab.id}
            onClick={() => switchTab(tab.id)}
          >
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>
      <SelectedTabComponent />
    </>
  );
};
