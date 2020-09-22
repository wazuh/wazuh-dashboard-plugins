/*
 * Wazuh app - File for routes definition
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require routes
import routes from 'ui/routes';

// Functions to be executed before loading certain routes
import {
  settingsWizard,
  getSavedSearch,
  goToKibana,
  getIp,
  getWzConfig,
  apiCount
} from './resolves';

// HTML templates
import healthCheckTemplate from '../templates/health-check/health-check.html';
import agentsTemplate from '../templates/agents/dashboards.pug';
import agentsPrevTemplate from '../templates/agents-prev/agents-prev.pug';
import managementTemplate from '../templates/management/management.pug';
import overviewTemplate from '../templates/visualize/dashboards.pug';
import settingsTemplate from '../templates/settings/settings.pug';
import securityTemplate from '../templates/security/security.html';
import blankScreenTemplate from '../templates/error-handler/blank-screen.html';
import toolsTemplate from '../templates/tools/tools.pug';
import { WazuhConfig } from '../react-services/wazuh-config';
import { GenericRequest } from '../react-services/generic-request';
import { WzMisc } from '../factories/misc';
import { ApiCheck } from '../react-services/wz-api-check';
import { AppState } from '../react-services/app-state';

const assignPreviousLocation = ($rootScope, $location) => {
  const path = $location.path();	
  const params = $location.search();
  // Save current location if we aren't performing a health-check, to later be able to come back to the same tab
  if (!path.includes('/health-check')) {
    $rootScope.previousLocation = path;
    $rootScope.previousParams = params;
  }
};

function ip($q, $rootScope, $window, $location, Private, errorHandler) {
  const wzMisc = new WzMisc();
  assignPreviousLocation($rootScope, $location);
  return getIp(
    $q,
    $window,
    $location,
    Private,
    AppState,
    GenericRequest,
    errorHandler,
    wzMisc
  );
}

function nestedResolve($q, errorHandler, $rootScope, $location, $window) {
  const wzMisc = new WzMisc();
  const healthCheckStatus = $window.sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;
  const wazuhConfig = new WazuhConfig();
  assignPreviousLocation($rootScope, $location);
  const location = $location.path();
  return getWzConfig($q, GenericRequest, wazuhConfig).then(() =>
    settingsWizard(
      $location,
      $q,
      $window,
      ApiCheck,
      AppState,
      GenericRequest,
      errorHandler,
      wzMisc,
      location && location.includes('/health-check')
    )
  );
}

function savedSearch(
  $location,
  $window,
  $rootScope,
  $route
) {
  const healthCheckStatus = $window.sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;
  assignPreviousLocation($rootScope, $location);
  return getSavedSearch(
    $location,
    $window,
    $route
  );
}

function wzConfig($q, $rootScope, $location) {
  assignPreviousLocation($rootScope, $location);
  const wazuhConfig = new WazuhConfig();
  return getWzConfig($q, GenericRequest, wazuhConfig);
}

function wzKibana($location, $window, $rootScope) {
  assignPreviousLocation($rootScope, $location);
  if ($location.$$path !== '/visualize/create') {
    // Sets ?_a=(columns:!(_source),filters:!())
    $location.search('_a', '(columns:!(_source),filters:!())');
    // Removes ?_g
    $location.search('_g', null);
  }
  return goToKibana($location, $window);
}

function clearRuleId(commonData) {
  commonData.removeRuleId();
  return Promise.resolve();
}

function enableWzMenu($rootScope, $location) {
  const location = $location.path();
  $rootScope.hideWzMenu = location.includes('/health-check');
  if(!$rootScope.hideWzMenu){
    AppState.setWzMenu();
  }
}

//Routes
routes.enable();
routes
  .when('/health-check', {
    template: healthCheckTemplate,
    resolve: { apiCount, wzConfig, ip }
  })
  .when('/agents/:agent?/:tab?/:tabView?', {
    template: agentsTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/agents-preview/', {
    template: agentsPrevTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/manager/', {
    template: managementTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch, clearRuleId }
  })
  .when('/manager/:tab?', {
    template: managementTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch, clearRuleId }
  })
  .when('/overview/', {
    template: overviewTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/settings', {
    template: settingsTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/security', {
    template: securityTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/visualize/create?', {
    redirectTo: function () { },
    resolve: { wzConfig, wzKibana }
  })
  .when('/context/:pattern?/:type?/:id?', {
    redirectTo: function () { },
    resolve: { wzKibana }
  })
  .when('/doc/:pattern?/:index?/:type?/:id?', {
    redirectTo: function () { },
    resolve: { wzKibana }
  })
  .when('/wazuh-dev', {
    template: toolsTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/blank-screen', {
    template: blankScreenTemplate,
    resolve: { enableWzMenu, wzConfig }
  })
  .when('/', {
    redirectTo: '/overview/'
  })
  .when('', {
    redirectTo: '/overview/'
  })
  .otherwise({
    redirectTo: '/overview'
  });
