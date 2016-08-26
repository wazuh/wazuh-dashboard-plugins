// Require config
require('plugins/wazuh/config/config.js');

// Require CSS
require('plugins/wazuh/less/main.less');

// Set up Wazuh app
var app = require('ui/modules').get('app/wazuh', ['angularUtils.directives.dirPagination', 'angular.filter', 'AxelSoft', 'chart.js', 'ngAlertify', '720kb.tooltips', 'ngMaterial'])
  .config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data|blob):/);
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.useApplyAsync(true);
  }]);

// Require services and factories
require('plugins/wazuh/objects/theming.js');
require('plugins/wazuh/objects/apiReq.js');
require('plugins/wazuh/objects/dataFactory.js');
require('plugins/wazuh/objects/sharedProperties.js');
require('plugins/wazuh/objects/tabProvider.js');
require('plugins/wazuh/objects/testConnection.js');

// Set up routes and views
require('plugins/wazuh/objects/routes.js');


// Require controllers
require('plugins/wazuh/controllers/general.js');
require('plugins/wazuh/controllers/agents.js');
require('plugins/wazuh/controllers/settings.js');
require('plugins/wazuh/controllers/manager.js');
require('plugins/wazuh/controllers/fim.js');
require('plugins/wazuh/controllers/policy-monitoring.js');
require('plugins/wazuh/controllers/ruleset.js');
require('plugins/wazuh/controllers/osseclog.js');
require('plugins/wazuh/controllers/kibanaIntegration.js');
require('plugins/wazuh/controllers/visLoader.js');

//Bootstrap and font awesome
require('plugins/wazuh/../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('plugins/wazuh/../node_modules/bootstrap/dist/js/bootstrap.min.js');
require('plugins/wazuh/utils/fontawesome/css/font-awesome.min.css');

//Material
require('plugins/wazuh/../node_modules/angular-material/angular-material.css');
require('plugins/wazuh/../node_modules/angular-aria/angular-aria.js');
require('plugins/wazuh/../node_modules/angular-animate/angular-animate.js');
require('plugins/wazuh/../node_modules/angular-material/angular-material.js');

//External angularjs libs
require('plugins/wazuh/../node_modules/angular-utils-pagination/dirPagination.js');
require('plugins/wazuh/../node_modules/angular-filter/dist/angular-filter.min.js');
require('plugins/wazuh/utils/customSelect/bootstrap.min.js');
require('plugins/wazuh/utils/customSelect/customSelect.js');
require('plugins/wazuh/utils/customSelect/style.css');
require('plugins/wazuh/../node_modules/angular-chart.js/dist/angular-chart.js');
require('plugins/wazuh/../node_modules/angular-chart.js/dist/angular-chart.css');
require('plugins/wazuh/../node_modules/alertify.js/dist/css/alertify.css');
require('plugins/wazuh/../node_modules/alertify.js/dist/js/alertify.js');
require('plugins/wazuh/../node_modules/alertify.js/dist/js/ngAlertify.js');
require('plugins/wazuh/../node_modules/angular-tooltips/dist/angular-tooltips.min.css');
require('plugins/wazuh/../node_modules/angular-tooltips/dist/angular-tooltips.min.js');
