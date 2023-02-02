import { EuiBreadcrumb, EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import { flow, map, mapValues, partial } from 'lodash';
import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AppDependencies } from './types';
import { DashboardPage } from './views/dashboard/dashboard';
import { NavPanel } from './components/nav-panel/nav-panel';
import { Action, ResourceType, RouteItem, SubAction } from './types';

const LANDING_PAGE_URL = '/getstarted';

const ROUTE_MAP: { [key: string]: RouteItem } = {
  getStarted: {
    name: 'Get Started',
    href: LANDING_PAGE_URL,
  }
};

const ROUTE_LIST = [
  ROUTE_MAP.getStarted,
];

const allNavPanelUrls = ROUTE_LIST.map((route) => route.href);

export function getBreadcrumbs(
  resourceType?: ResourceType,
  pageTitle?: string,
  subAction?: string
): EuiBreadcrumb[] {
  const breadcrumbs: EuiBreadcrumb[] = [
    {
      text: 'Metrics',
      href: '#',
    },
  ];

  if (pageTitle) {
    breadcrumbs.push({
      text: pageTitle,
    });
  }

  if (subAction) {
    breadcrumbs.push({
      text: subAction,
    });
  }
  return breadcrumbs;
}

function decodeParams(params: { [k: string]: string }): any {
  return Object.keys(params).reduce((obj: { [k: string]: string }, key: string) => {
    obj[key] = decodeURIComponent(params[key]);
    return obj;
  }, {});
}

export function AppRouter(props: AppDependencies) {
  const setGlobalBreadcrumbs = flow(getBreadcrumbs, props.coreStart.chrome.setBreadcrumbs);

  return (
    <Router>
      <EuiPage>
        {allNavPanelUrls.map((route) => (
          // Create different routes to update the 'selected' nav item .
          <Route key={route} path={route} exact>
            <EuiPageSideBar>
              <NavPanel items={ROUTE_LIST} />
            </EuiPageSideBar>
          </Route>
        ))}
        <EuiPageBody>
          <Switch>
            <Route
              path={ROUTE_MAP.getStarted.href}
              render={() => {
                setGlobalBreadcrumbs();
                return <DashboardPage {...props} />;
              }}
            />
            <Redirect exact from="/" to={LANDING_PAGE_URL} />
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </Router>
  );
}
