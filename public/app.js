// Require CSS
require('plugins/wazuh/less/loader');

// Set up Wazuh app
const app = require('ui/modules').get('app/wazuh', ['ngCookies', 'ngMaterial']);

app.config(['$compileProvider', function ($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
}])

app.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.useApplyAsync(true);
}]);

// Font Awesome, Kibana UI framework and others
require('plugins/wazuh/utils/fontawesome/css/font-awesome.min.css');
require('plugins/wazuh/utils/when-scrolled/when-scrolled.js');
require('../../../ui_framework/dist/ui_framework.css');

// Material
require('plugins/wazuh/../node_modules/angular-material/angular-material.css');
require('plugins/wazuh/../node_modules/angular-aria/angular-aria.js');
require('plugins/wazuh/../node_modules/angular-animate/angular-animate.js');
require('plugins/wazuh/../node_modules/angular-material/angular-material.js');

// Cookies
require('plugins/wazuh/../node_modules/angular-cookies/angular-cookies.min.js');

////////////////////////////////////////////////////////////////////
// Require Kibana integrations
require('ui/autoload/all');
require('ui/chrome');
require('plugins/wazuh/kibana-integrations/kibana-visualization.js');
require('plugins/wazuh/kibana-integrations/kibana-filter-bar.js');
require('plugins/wazuh/kibana-integrations/kibana-discover.js');

// Require services
require('plugins/wazuh/services/error-handler.js');
require('plugins/wazuh/services/theming.js');
require('plugins/wazuh/services/api-request.js');
require('plugins/wazuh/services/generic-request.js');
require('plugins/wazuh/services/data-handler.js');
require('plugins/wazuh/services/app-state.js');
require('plugins/wazuh/services/api-tester.js');
require('plugins/wazuh/services/pattern-handler.js');

// Set up routes and views
require('plugins/wazuh/services/routes.js');

// Require controllers

// Factories
require('plugins/wazuh/factories/data-handler-composer.js');

// Wazuh Directives
require('plugins/wazuh/directives/wz-dynamic/wz-dynamic.js');
require('plugins/wazuh/directives/wz-enter/wz-enter.js');
require('plugins/wazuh/directives/wz-menu/wz-menu.js');
require('plugins/wazuh/directives/wz-menu/wz-menu.less');
require('plugins/wazuh/directives/wz-search-bar/wz-search-bar.js');
require('plugins/wazuh/directives/wz-table-header/wz-table-header.js');
require('plugins/wazuh/directives/wz-table-header/wz-table-header.less');
require('plugins/wazuh/directives/wz-table/wz-table.js');
require('plugins/wazuh/directives/wz-table/wz-table.less');

// Blank Screen
require('plugins/wazuh/controllers/blank-screen-controller.js');

// Login
require('plugins/wazuh/controllers/login.js');

// Overview
require('plugins/wazuh/controllers/overview.js');

// Manager
require('plugins/wazuh/controllers/manager.js');
require('plugins/wazuh/controllers/ruleset.js');
require('plugins/wazuh/controllers/osseclog.js');
require('plugins/wazuh/controllers/groups.js');

// Agents
require('plugins/wazuh/controllers/agents.js');
require('plugins/wazuh/controllers/agents-preview.js');

// Settings
require('plugins/wazuh/controllers/settings.js');

// Health check
require('plugins/wazuh/controllers/health-check.js');
