// Require routes
var routes = require('ui/routes');

//Installation wizard
var settingsWizard = function ($location, testConnection, $mdToast, appState, $q, genericReq) {
    var deferred = $q.defer();
    testConnection.check_stored().then(function (data)
    {
		appState.setDefaultManager(data.manager);
		appState.setExtensions(data.extensions);
		genericReq.request('PUT', '/api/wazuh-elastic/wazuh-pattern').then(function (data) { 
			deferred.resolve();
		});
	}, function (data) {
		$mdToast.show({
			template: '<md-toast>Could not connect with Wazuh API. Please, configure it on settings tab.</md-toast>',
			position: 'bottom left',
			hideDelay: 5000,
		});
		deferred.reject();
		$location.path('/settings');
    });
    return deferred.promise;
}

//Routes
routes.enable();
routes
    .when('/agents/:id?/:tab?/:view?', {
        template: require('plugins/wazuh/templates/agents.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
    .when('/manager/:tab?/', {
        template: require('plugins/wazuh/templates/manager.jade'),
        resolve: {
            "check": settingsWizard
        }
    })
	.when('/overview/:tab?/:view?', {
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
    .when('/settings/:tab?/', {
        template: require('plugins/wazuh/templates/settings.html')
    })
	.when('/test/', {
        template: require('plugins/wazuh/templates/test.html'),
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
