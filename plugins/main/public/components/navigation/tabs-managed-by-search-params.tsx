import React from 'react';
import { EuiTabs, EuiTab } from '@elastic/eui';
import NavigationService from '../../react-services/navigation-service';
import { useRouterSearch } from '../common/hooks';
import { Redirect, Route, Switch } from '../router-search';

export interface TabsManagedBySearchParamProps {
  tabs: { id: string; name: string; component: any }[];
  searchParamNavigation: string;
  tabsProps: any;
}

/**
 * Get the search URL parameter for a search object
 * @param search
 * @returns
 */
function getSearchParametersFromSearch(search: { [key: string]: string }) {
  return Object.entries(search)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

/**
 * It renders tabs that are managed by a search query parameter and if the search
 * parameter is another value different to the expected tabs, then it redirects to the first tab.
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

  const switchTab = (view: string) => {
    const navigationService = NavigationService.getInstance();

    const newSeach = {
      ...search,
      [searchParamNavigation]: view,
    };
    const url = `${navigationService.getPathname()}?${getSearchParametersFromSearch(
      newSeach,
    )}`;
    navigationService.navigate(url);
  };

  return (
    <>
      <EuiTabs {...tabsProps} style={{ padding: '0px 8px' }}>
        {tabs.map(tab => (
          <EuiTab
            key={tab.id}
            isSelected={tab.id === search[searchParamNavigation]}
            onClick={() => switchTab(tab.id)}
          >
            {tab.name}
          </EuiTab>
        ))}
      </EuiTabs>
      <Switch>
        {tabs
          .map(({ id, component: Component }) => {
            return (
              <Route path={`?${searchParamNavigation}=${id}`} key={id}>
                <Component />
              </Route>
            );
          })
          .flat()}

        <Redirect
          to={`?${getSearchParametersFromSearch({
            ...search,
            [searchParamNavigation]: tabs[0].id,
          })}`}
        ></Redirect>
      </Switch>
    </>
  );
};
