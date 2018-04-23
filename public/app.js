/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require CSS
import 'plugins/wazuh/less/loader';
import * as modules from 'ui/modules'
// Set up Wazuh app
const app = modules.get('app/wazuh', ['ngCookies', 'ngMaterial']);

app.config(['$compileProvider', function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
}])

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.useApplyAsync(true);
}]);

// Font Awesome, Kibana UI framework and others
import 'plugins/wazuh/utils/fontawesome/css/font-awesome.min.css';
import 'plugins/wazuh/utils/when-scrolled/when-scrolled.js';
import '../../../ui_framework/dist/ui_framework.css';

// Material
import 'plugins/wazuh/../node_modules/angular-material/angular-material.css';
import 'plugins/wazuh/../node_modules/angular-aria/angular-aria.js';
import 'plugins/wazuh/../node_modules/angular-animate/angular-animate.js';
import 'plugins/wazuh/../node_modules/angular-material/angular-material.js';

// Cookies
import 'plugins/wazuh/../node_modules/angular-cookies/angular-cookies.min.js';

////////////////////////////////////////////////////////////////////
// Require Kibana integrations
import 'ui/autoload/all';
import 'ui/chrome';
import 'plugins/wazuh/kibana-integrations/kibana-visualization.js';
import 'plugins/wazuh/kibana-integrations/kibana-filter-bar.js';
import 'plugins/wazuh/kibana-integrations/kibana-discover.js';
import 'plugins/wazuh/kibana-integrations/saved-visualizations.js';

// Require services
import 'plugins/wazuh/services/error-handler.js';
import 'plugins/wazuh/services/theming.js';
import 'plugins/wazuh/services/api-request.js';
import 'plugins/wazuh/services/generic-request.js';
import 'plugins/wazuh/services/data-handler.js';
import 'plugins/wazuh/services/app-state.js';
import 'plugins/wazuh/services/api-tester.js';
import 'plugins/wazuh/services/pattern-handler.js';

// Set up routes and views
import 'plugins/wazuh/services/routes.js';

// Require controllers

// Factories
import 'plugins/wazuh/factories/data-handler-composer.js';

// Wazuh Directives
import 'plugins/wazuh/directives/wz-dynamic/wz-dynamic.js';
import 'plugins/wazuh/directives/wz-enter/wz-enter.js';
import 'plugins/wazuh/directives/wz-menu/wz-menu.js';
import 'plugins/wazuh/directives/wz-menu/wz-menu.less';
import 'plugins/wazuh/directives/wz-search-bar/wz-search-bar.js';
import 'plugins/wazuh/directives/wz-table-header/wz-table-header.js';
import 'plugins/wazuh/directives/wz-table-header/wz-table-header.less';
import 'plugins/wazuh/directives/wz-table/wz-table.js';
import 'plugins/wazuh/directives/wz-table/wz-table.less';

// Blank Screen
import 'plugins/wazuh/controllers/blank-screen-controller.js';

// Login
import 'plugins/wazuh/controllers/login.js';

// Overview
import 'plugins/wazuh/controllers/overview.js';

// Manager
import 'plugins/wazuh/controllers/manager.js';
import 'plugins/wazuh/controllers/ruleset.js';
import 'plugins/wazuh/controllers/osseclog.js';
import 'plugins/wazuh/controllers/groups.js';

// Agents
import 'plugins/wazuh/controllers/agents.js';
import 'plugins/wazuh/controllers/agents-preview.js';

// Settings
import 'plugins/wazuh/controllers/settings.js';

// Health check
import 'plugins/wazuh/controllers/health-check.js';
