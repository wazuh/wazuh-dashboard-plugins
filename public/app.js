// Require CSS
require('plugins/wazuh/less/loader');
//require('plugins/wazuh/less/ui_framework.less');

// Set up Wazuh app
var app = require('ui/modules').get('app/wazuh', ['ngCookies','ngMaterial'])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.useApplyAsync(true);
  }]);

////////////////////////////////////////////////////////////////////
// Require Kibana integrations
require('ui/autoload/all');
require('ui/chrome');
require('plugins/wazuh/kibana-integrations/kibanaVisualizationDirective.js');
require('plugins/wazuh/kibana-integrations/kibanaFilterbarDirective.js');
require('plugins/wazuh/kibana-integrations/kibanaDiscoverDirective.js');

// Require services
require('plugins/wazuh/services/theming.js');
require('plugins/wazuh/services/apiReq.js');
require('plugins/wazuh/services/genericReq.js');
require('plugins/wazuh/services/dataHandler.js');
require('plugins/wazuh/services/appState.js');
require('plugins/wazuh/services/testAPI.js');
require('plugins/wazuh/services/implicitFilters.js');

// Set up routes and views
require('plugins/wazuh/services/routes.js');

// Require controllers

// Factories
require('plugins/wazuh/controllers/common/factories.js');
require('plugins/wazuh/controllers/common/filters.js');
require('plugins/wazuh/controllers/common/directives.js');

// Overview
require('plugins/wazuh/controllers/overview.js');

// Manager
require('plugins/wazuh/controllers/manager.js');
require('plugins/wazuh/controllers/ruleset.js');
require('plugins/wazuh/controllers/osseclog.js');
require('plugins/wazuh/controllers/groups.js');

// Agents
require('plugins/wazuh/controllers/agents.js');
require('plugins/wazuh/controllers/agentsPreview.js');

// Settings
require('plugins/wazuh/controllers/settings.js');

//Bootstrap and font awesome
require('plugins/wazuh/../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('plugins/wazuh/../node_modules/bootstrap/dist/js/bootstrap.min.js');
require('plugins/wazuh/utils/fontawesome/css/font-awesome.min.css');
require('plugins/wazuh/utils/when-scrolled/when-scrolled.js');
require('../../../ui_framework/dist/ui_framework.css');

//Material
require('plugins/wazuh/../node_modules/angular-material/angular-material.css');
require('plugins/wazuh/../node_modules/angular-aria/angular-aria.js');
require('plugins/wazuh/../node_modules/angular-animate/angular-animate.js');
require('plugins/wazuh/../node_modules/angular-material/angular-material.js');

//Cookies
require('plugins/wazuh/../node_modules/angular-cookies/angular-cookies.min.js');
