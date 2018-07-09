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
import managerTemplate     from '../templates/manager/manager.jade'
import overviewTemplate    from '../templates/overview/overview.jade'
import discoverTemplate    from '../templates/discover/discover.jade'
import settingsTemplate    from '../templates/settings/settings.jade'
import blankScreenTemplate from '../templates/error-handler/blank-screen.html'
import devToolsTemplate    from '../templates/dev-tools/dev-tools.html'

//Routes
routes.enable();
routes
    .when('/health-check', {
        template: healthCheckTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
            "ip": getIp
        }
    })
    .when('/agents/:id?/:tab?/:view?', {
        template: agentsTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig, $timeout,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig, $timeout)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/agents-preview/:tab?/', {
        template: agentsPrevTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig, $timeout,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig, $timeout)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
        }
    })
    .when('/manager/:tab?/', {
        template: managerTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig, $timeout,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig, $timeout)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/overview/', {
        template: overviewTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig, $timeout,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig, $timeout)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/wazuh-discover/', {
        template: discoverTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig, $timeout,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig, $timeout)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/settings/:tab?/', {
        template: settingsTemplate,
        resolve: {
            "getWzConfig": getWzConfig
        }
    })
    .when('/visualize/create?', {
        redirectTo: function () {},
        resolve: {
            "getWzConfig": getWzConfig,
            "checkAPI": goToKibana
        }
    })
    .when('/context/:pattern?/:type?/:id?', {
        redirectTo: function () {},
        resolve: {
            "getWzConfig": getWzConfig,
            "checkAPI": goToKibana
        }
    })
    .when('/doc/:pattern?/:index?/:type?/:id?', {
        redirectTo: function () {},
        resolve: {
            "getWzConfig": getWzConfig,
            "checkAPI": goToKibana
        }
    })
    .when('/wazuh-dev', {
        template: devToolsTemplate,
        resolve: {
            "nestedResolve": function(
                $q, genericReq, errorHandler, wazuhConfig, $timeout,
                $rootScope, $location, $window, testAPI, appState, wzMisc
            ) {
                return getWzConfig($q, genericReq, errorHandler, wazuhConfig, $timeout)
                .then(() => settingsWizard($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc, wazuhConfig));
            },
        }
    })
    .when('/blank-screen', {
        template: blankScreenTemplate,
        resolve: {
            "getWzConfig": getWzConfig,
        }
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
