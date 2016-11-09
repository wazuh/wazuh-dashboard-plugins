// Require routes
var routes = require('ui/routes');

//Installation wizard
var settingsWizard = function ($location, testConnection, $mdToast, appState) {
    testConnection.test()
        .then(function (data) {
			appState.setDefaultManager(data.manager);
		}, function (data) {
            $mdToast.show({
                template: '<md-toast>Could not connect with Wazuh API. Please, configure it on settings tab.</md-toast>',
                position: 'bottom left',
                hideDelay: 5000,
            });
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
        template: require('plugins/wazuh/templates/manager.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
	.when('/overview/', {
        template: require('plugins/wazuh/templates/overview.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/dashboards/', {
        template: require('plugins/wazuh/templates/dashboards.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/dashboard/:select?', {
        template: require('plugins/wazuh/templates/dashboards.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
	.when('/discover/', {
        template: require('plugins/wazuh/templates/discover.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/settings/', {
        template: require('plugins/wazuh/templates/settings.html')
    })
	.when('/doc/', {
		template: require('plugins/wazuh/templates/discover.jade'),
        resolve: {
            "check": settingsWizard
        }

    })
    .when('/', {
        redirectTo: '/overview/',
    })
    .when('', {
        redirectTo: '/overview/',
    })
    .otherwise({
        redirectTo: '/overview/'
    });