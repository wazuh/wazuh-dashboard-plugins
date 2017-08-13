// Require routes
var routes = require('ui/routes');

//Installation wizard
var settingsWizard = function ($location, testConnection, appState, $q, genericReq, Notifier) {
	const notify = new Notifier();
    var deferred = $q.defer();
    testConnection.check_stored().then(function (data)
    {
		appState.setClusterInfo(data.cluster_info);
		appState.setExtensions(data.extensions);
		deferred.resolve();
	}, function (data) {
		if(data.error == 2)
			notify.warning("Wazuh App: Please set up Wazuh API credentials.");
		else
			notify.error("Could not connect with Wazuh RESTful API.");
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
        template: require('plugins/wazuh/templates/test.html')
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
