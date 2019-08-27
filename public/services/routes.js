/*
 * Wazuh app - File for routes definition
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import agentsTemplate from '../templates/agents/agents.pug';
import agentsPrevTemplate from '../templates/agents-prev/agents-prev.pug';
import managementTemplate from '../templates/management/management.pug';
import overviewTemplate from '../templates/overview/overview.pug';
import discoverTemplate from '../templates/discover/discover.pug';
import settingsTemplate from '../templates/settings/settings.pug';
import blankScreenTemplate from '../templates/error-handler/blank-screen.html';
import devToolsTemplate from '../templates/dev-tools/dev-tools.html';

const assignPreviousLocation = ($rootScope, $location) => {
  const path = $location.path();
  // Save current location if we aren't performing a health-check, to later be able to come back to the same tab
  if (!path.includes('/health-check')) {
    $rootScope.previousLocation = path;
  }
};

function ip(
  indexPatterns,
  $q,
  $rootScope,
  $window,
  $location,
  Private,
  appState,
  genericReq,
  errorHandler,
  wzMisc
) {
  assignPreviousLocation($rootScope, $location);
  return getIp(
    indexPatterns,
    $q,
    $window,
    $location,
    Private,
    appState,
    genericReq,
    errorHandler,
    wzMisc
  );
}

function nestedResolve(
  $q,
  genericReq,
  errorHandler,
  wazuhConfig,
  $rootScope,
  $location,
  $window,
  testAPI,
  appState,
  wzMisc
) {
  const healthCheckStatus = $window.sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;

  assignPreviousLocation($rootScope, $location);
  const location = $location.path();
  return getWzConfig($q, genericReq, wazuhConfig).then(() =>
    settingsWizard(
      $location,
      $q,
      $window,
      testAPI,
      appState,
      genericReq,
      errorHandler,
      wzMisc,
      wazuhConfig,
      location && location.includes('/health-check')
    )
  );
}

function savedSearch(
  redirectWhenMissing,
  $location,
  $window,
  $rootScope,
  savedSearches,
  $route
) {
  const healthCheckStatus = $window.sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;
  assignPreviousLocation($rootScope, $location);
  return getSavedSearch(
    redirectWhenMissing,
    $location,
    $window,
    savedSearches,
    $route
  );
}

function wzConfig($q, genericReq, wazuhConfig, $rootScope, $location) {
  assignPreviousLocation($rootScope, $location);
  return getWzConfig($q, genericReq, wazuhConfig);
}

function wzKibana($location, $window, $rootScope) {
  assignPreviousLocation($rootScope, $location);
  // Sets ?_a=(columns:!(_source),filters:!())
  $location.search('_a', '(columns:!(_source),filters:!())');
  // Removes ?_g
  $location.search('_g', null);
  return goToKibana($location, $window);
}

function clearRuleId(commonData) {
  commonData.removeRuleId();
  return Promise.resolve();
}

function enableWzMenu($rootScope, $location) {
  const location = $location.path();
  $rootScope.hideWzMenu = location.includes('/health-check');
}

//Routes
routes.enable();
routes
  .when('/health-check', {
    template: healthCheckTemplate,
    resolve: { apiCount, wzConfig, ip }
  })
  .when('/agents/:id?/:tab?/:view?', {
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
  .when('/overview/', {
    template: overviewTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/wazuh-discover/', {
    template: discoverTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/settings', {
    template: settingsTemplate,
    resolve: { enableWzMenu, nestedResolve, ip, savedSearch }
  })
  .when('/visualize/create?', {
    redirectTo: function() {},
    resolve: { wzConfig, wzKibana }
  })
  .when('/context/:pattern?/:type?/:id?', {
    redirectTo: function() {},
    resolve: { wzKibana }
  })
  .when('/doc/:pattern?/:index?/:type?/:id?', {
    redirectTo: function() {},
    resolve: { wzKibana }
  })
  .when('/wazuh-dev', {
    template: devToolsTemplate,
    resolve: { enableWzMenu, nestedResolve }
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
