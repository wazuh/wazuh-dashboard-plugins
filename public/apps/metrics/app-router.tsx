/*
 *   Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import { EuiBreadcrumb, EuiPage, EuiPageBody, EuiPageSideBar } from '@elastic/eui';
import { flow, map, mapValues, partial } from 'lodash';
import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { AppDependencies } from './types';
// import { AuditLogging } from './panels/audit-logging/audit-logging';
// import { AuditLoggingEditSettings } from './panels/audit-logging/audit-logging-edit-settings';
// import {
//   SUB_URL_FOR_COMPLIANCE_SETTINGS_EDIT,
//   SUB_URL_FOR_GENERAL_SETTINGS_EDIT,
// } from './panels/audit-logging/constants';
// import { AuthView } from './panels/auth-view/auth-view';
import { DashboardPage } from './views/dashboard/dashboard';
// import { InternalUserEdit } from './panels/internal-user-edit/internal-user-edit';
import { NavPanel } from './components/nav-panel/nav-panel';
// import { PermissionList } from './panels/permission-list/permission-list';
// import { RoleEdit } from './panels/role-edit/role-edit';
// import { RoleList } from './panels/role-list';
// import { RoleEditMappedUser } from './panels/role-mapping/role-edit-mapped-user';
// import { RoleView } from './panels/role-view/role-view';
// import { TenantList } from './panels/tenant-list/tenant-list';
// import { UserList } from './panels/user-list';
import { Action, ResourceType, RouteItem, SubAction } from './types';
// import { buildHashUrl, buildUrl } from './utils/url-builder';
// import { CrossPageToast } from './cross-page-toast';

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
