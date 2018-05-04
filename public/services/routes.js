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
import { healthCheck, settingsWizard, getSavedSearch, goToKibana, getIp } from './resolves'

// HTML templates
import healthCheckTemplate from 'plugins/wazuh/templates/health-check/health-check.html'
import agentsTemplate      from 'plugins/wazuh/templates/agents/agents.jade'
import agentsPrevTemplate  from 'plugins/wazuh/templates/agents-prev/agents-prev.jade'
import managerTemplate     from 'plugins/wazuh/templates/manager/manager.jade'
import overviewTemplate    from 'plugins/wazuh/templates/overview/overview.jade'
import discoverTemplate    from 'plugins/wazuh/templates/discover/discover.jade'
import settingsTemplate    from 'plugins/wazuh/templates/settings/settings.html'
import loginTemplate       from 'plugins/wazuh/templates/auth/login.html'
import blankScreenTemplate from 'plugins/wazuh/templates/error-handler/blank-screen.html'

//Routes
routes.enable();
routes
    .when('/health-check', {
        template: healthCheckTemplate,
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/agents/:id?/:tab?/:view?', {
        template: agentsTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/agents-preview/:tab?/', {
        template: agentsPrevTemplate,
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/manager/:tab?/', {
        template: managerTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/overview/', {
        template: overviewTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/wazuh-discover/', {
        template: discoverTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/settings/:tab?/', {
        template: settingsTemplate,
    })
    .when('/visualize/create?', {
        redirectTo: function () {},
        resolve: {
            "checkAPI": goToKibana
        }
    })
    .when('/context/:pattern?/:type?/:id?', {
        redirectTo: function () {},
        resolve: {
            "checkAPI": goToKibana
        }
    })
    .when('/doc/:pattern?/:index?/:type?/:id?', {
        redirectTo: function () {},
        resolve: {
            "checkAPI": goToKibana
        }
    })
    .when('/wlogin', {
        template: loginTemplate
    })
    .when('/blank-screen', {
        template: blankScreenTemplate
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
