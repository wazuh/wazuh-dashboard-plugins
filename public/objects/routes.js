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
    .when('/agents/', {
        template: require('plugins/wazuh/templates/agents.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/', {
        template: require('plugins/wazuh/templates/manager.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/osseclog/', {
        template: require('plugins/wazuh/templates/manager-osseclog.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/configuration/', {
        template: require('plugins/wazuh/templates/manager-configuration.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/metrics/', {
        template: require('plugins/wazuh/templates/manager-metrics.html'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/ruleset/', {
        template: require('plugins/wazuh/templates/ruleset.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/settings/', {
        template: require('plugins/wazuh/templates/settings.html')
    })
    .when('/', {
        redirectTo: '/agents/',
        resolve: {
            "check": settingsWizard
        }
    })
    .when('', {
        redirectTo: '/agents/',
        resolve: {
            "check": settingsWizard
        }
    })
    .otherwise({
        redirectTo: '/settings/'
    });