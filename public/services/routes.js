// Require routes
let routes = require('ui/routes');

//Installation wizard
const settingsWizard = ($location, $q, Notifier, testAPI, appState) => {
    const notify = new Notifier();

    let deferred = $q.defer();
    testAPI.check_stored()
    .then((data) => {
        if (data.data.error) {
            if (parseInt(data.data.error) === 2){
                notify.warning("Wazuh App: Please set up Wazuh API credentials.");
            } else {
                notify.error("Could not connect with Wazuh RESTful API.");
            }
            $location.path('/settings');
            deferred.reject();
        } else {
            appState.setClusterInfo(data.data.data.cluster_info);
            appState.setExtensions(data.data.data.extensions);
            deferred.resolve();
        }
    });

    return deferred.promise;
};

// Manage leaving the app to another Kibana tab
const goToKibana = ($location, $window) => {
    let url = $location.$$absUrl.substring(0, $location.$$absUrl.indexOf('#'));

    if (sessionStorage.getItem(`lastSubUrl:${url}`).includes('/wazuh#/visualize') ||
        sessionStorage.getItem(`lastSubUrl:${url}`).includes('/wazuh#/doc') ||
        sessionStorage.getItem(`lastSubUrl:${url}`).includes('/wazuh#/context')){

            sessionStorage.setItem(`lastSubUrl:${url}`, url);

    }

    $window.location.href = $location.absUrl().replace('/wazuh#', '/kibana#');
};

//Routes
routes.enable();
routes
    .when('/agents/:id?/:tab?/:view?', {
        template: require('plugins/wazuh/templates/agents.jade'),
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/manager/:tab?/', {
        template: require('plugins/wazuh/templates/manager.jade'),
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/overview/', {
        template: require('plugins/wazuh/templates/overview.jade'),
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/discover/', {
        template: require('plugins/wazuh/templates/discover.jade'),
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/settings/:tab?/', {
        template: require('plugins/wazuh/templates/settings.html')
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
    .when('/', {
        redirectTo: '/overview/',
    })
    .when('', {
        redirectTo: '/overview/',
    })
    .otherwise({
        redirectTo: '/overview/'
    });
