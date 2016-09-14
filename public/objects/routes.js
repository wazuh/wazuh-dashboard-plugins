// Require routes
var routes = require('ui/routes');

//Installation wizard
var settingsWizard = function ($location, testConnection) {
    testConnection.test()
        .then(function () { }, function () {
            $location.path('/settings');
        });
}

//Routes
routes.enable();
routes
    .when('/agents/:submenu?', {
        template: require('plugins/wazuh/templates/agents.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/:submenu?', {
        template: require('plugins/wazuh/templates/manager.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/ruleset/:submenu?', {
        template: require('plugins/wazuh/templates/ruleset.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/settings/', {
        template: require('plugins/wazuh/templates/settings.html')
    })
    .when('/', {
        redirectTo: '/manager/',
        resolve: {
            "check": settingsWizard
        }
    })
    .when('', {
        redirectTo: '/manager/',
        resolve: {
            "check": settingsWizard
        }
    })
    .otherwise({
        redirectTo: '/manager/'
    });