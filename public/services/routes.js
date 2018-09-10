/*
 * Wazuh app - File for routes definition
 * Copyright (C) 2018 Wazuh, Inc.
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
import { settingsWizard, getSavedSearch, goToKibana, getIp, getWzConfig } from './resolves';

// HTML templates
import healthCheckTemplate from '../templates/health-check/health-check.html'
import agentsTemplate      from '../templates/agents/agents.jade'
import agentsPrevTemplate  from '../templates/agents-prev/agents-prev.jade'
import managementTemplate  from '../templates/management/management.jade'
import overviewTemplate    from '../templates/overview/overview.jade'
import discoverTemplate    from '../templates/discover/discover.jade'
import settingsTemplate    from '../templates/settings/settings.jade'
import blankScreenTemplate from '../templates/error-handler/blank-screen.html'
import devToolsTemplate    from '../templates/dev-tools/dev-tools.html'

const assignPreviousLocation = ($rootScope,$location) => {
    const path = $location.path();
    // Save current location if we aren't performing a health-check, to later be able to come back to the same tab
    if (!path.includes("/health-check")) {
        $rootScope.previousLocation = path;
    } 
}

function ip(indexPatterns, $q, $rootScope, $window, $location, Private, appState, genericReq,errorHandler, wzMisc){
    assignPreviousLocation($rootScope,$location);
    return getIp(indexPatterns, $q, $rootScope, $window, $location, Private, appState, genericReq,errorHandler, wzMisc);
}

function nestedResolve(
    $q, genericReq, errorHandler, wazuhConfig,
    $rootScope, $location, $window, testAPI, appState, wzMisc
) {
    assignPreviousLocation($rootScope,$location);
    return getWzConfig($q, genericReq, errorHandler, wazuhConfig)
    .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
}

function savedSearch(redirectWhenMissing, $location, $window, $rootScope, savedSearches, $route){
    assignPreviousLocation($rootScope,$location);
    return getSavedSearch(redirectWhenMissing, $location, $window, $rootScope, savedSearches, $route);
}

function wzConfig($q, genericReq, errorHandler, wazuhConfig, $rootScope, $location) {
    assignPreviousLocation($rootScope,$location);
    return getWzConfig($q, genericReq, errorHandler, wazuhConfig);
}

function wzKibana($location, $window, $rootScope) {
    assignPreviousLocation($rootScope,$location);
    return goToKibana($location, $window);
}

function clearRuleId(commonData) {
    commonData.removeRuleId()
    return Promise.resolve()
}

//Routes
routes.enable();
routes
    .when('/health-check', {
        template: healthCheckTemplate,
        resolve: { nestedResolve, ip }
    })
    .when('/agents/:id?/:tab?/:view?', {
        template: agentsTemplate,
        resolve: { nestedResolve, ip, savedSearch }
    })
    .when('/agents-preview/:tab?/', {
        template: agentsPrevTemplate,
        resolve: { nestedResolve }
    })
    .when('/manager/:tab?/', {
        template: managementTemplate,
        resolve: { nestedResolve, ip, savedSearch, clearRuleId }
    })
    .when('/overview/', {
        template: overviewTemplate,
        resolve: { nestedResolve, ip, savedSearch }
    })
    .when('/wazuh-discover/', {
        template: discoverTemplate,
        resolve: { nestedResolve, ip, savedSearch }
    })
    .when('/settings/:tab?/', {
        template: settingsTemplate,
        resolve: { wzConfig }
    })
    .when('/visualize/create?', {
        redirectTo: function () {},
        resolve: { wzConfig, wzKibana }
    })
    .when('/context/:pattern?/:type?/:id?', {
        redirectTo: function () {},
        resolve: { wzConfig,wzKibana }
    })
    .when('/doc/:pattern?/:index?/:type?/:id?', {
        redirectTo: function () {},
        resolve: { wzConfig, wzKibana }
    })
    .when('/wazuh-dev', {
        template: devToolsTemplate,
        resolve: { nestedResolve }
    })
    .when('/blank-screen', {
        template: blankScreenTemplate,
        resolve: { wzConfig }
    })
    .when('/', {
        redirectTo: '/overview/'
    })
    .when('', {
        redirectTo: '/overview/'
    })
    .otherwise({
        redirectTo: '/overview/'
    });
