// Require routes
let routes = require('ui/routes');

// Kibana dependencies to load index-patterns and saved searches
import { StateProvider } from 'ui/state_management/state';
import { SavedObjectsClientProvider } from 'ui/saved_objects';

const healthCheck = ($window, $rootScope) => {
    if (!$window.sessionStorage.getItem('healthCheck')) { // New session, execute health check
        $window.sessionStorage.setItem('healthCheck', 'executed');
        return true;
    } else {
        return false;
    }
};

//Installation wizard
const settingsWizard = ($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler) => {
    let deferred = $q.defer();

    // Save current location if we aren't performing a health-check, to later be able to come back to the same tab
    if (!$location.path().includes("/health-check")) {
        $rootScope.previousLocation = $location.path();
    }

    const checkResponse = data => {
        let fromElastic = false;
        if (parseInt(data.data.error) === 2){
            errorHandler.handle('Wazuh App: Please set up Wazuh API credentials.','Routes',true);
        } else if(data.data.data && data.data.data.apiIsDown){
            $rootScope.apiIsDown = "down";
            errorHandler.handle('Wazuh RESTful API seems to be down.','Routes');
        } else {
            fromElastic = true;
            $rootScope.blankScreenError = errorHandler.handle(data,'Routes');
            appState.removeCurrentAPI();
        }

        if(!fromElastic){
            $rootScope.comeFromWizard = true;
            if(!$rootScope.$$phase) $rootScope.$digest();
            if(!$location.path().includes("/settings")) $location.path('/settings');
        } else {
            $location.path('/blank-screen');
        }

        deferred.reject();
    }

    const changeCurrentApi = data => {
        // Should change the currentAPI configuration depending on cluster
        if (data.data.data.cluster_info.status === 'disabled'){
            appState.setCurrentAPI(JSON.stringify({
                name: data.data.data.cluster_info.manager,
                id: JSON.parse(appState.getCurrentAPI()).id
            }));
        } else {
            appState.setCurrentAPI(JSON.stringify({
                name: data.data.data.cluster_info.cluster,
                id: JSON.parse(appState.getCurrentAPI()).id
            }));
        }

        appState.setClusterInfo(data.data.data.cluster_info);
        appState.setExtensions(data.data.data.extensions);
        deferred.resolve();
    }

    const callCheckStored = () => {
        testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id)
        .then(data => {
            if (data.data.error || data.data.data.apiIsDown) {
                checkResponse(data);
            } else {
                $rootScope.apiIsDown = null;
                changeCurrentApi(data);
            }
        })
        .catch(error => errorHandler.handle(error,'Routes'));
    }

    if (!$location.path().includes("/health-check") && healthCheck($window, $rootScope)) {
        $location.path('/health-check');
        deferred.reject();
    } else {
        // There's no cookie for current API
        if (!appState.getCurrentAPI()) {
            genericReq.request('GET', '/api/wazuh-api/apiEntries')
            .then(data => {
                if (data.data.length > 0) {
                    const apiEntries = data.data;
                    appState.setCurrentAPI(JSON.stringify({name: apiEntries[0]._source.cluster_info.manager, id: apiEntries[0]._id }));
                    callCheckStored();
                } else {
                    errorHandler.handle('Wazuh App: Please set up Wazuh API credentials.','Routes',true);
                    $rootScope.comeFromWizard = true;
                    if(!$location.path().includes("/settings")) $location.path('/settings');
                    deferred.reject();
                }
            })
            .catch(error => {
                errorHandler.handle(error,'Routes');
                $rootScope.comeFromWizard = true;
                if(!$location.path().includes("/settings")) $location.path('/settings');
                deferred.reject();
            });
        } else {
            callCheckStored();
        }
    }

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

const getIp = (Promise, courier, config, $q, $rootScope, $window, $location, Private, appState, genericReq) => {
    let deferred = $q.defer();
    if (healthCheck($window, $rootScope)) {
        deferred.reject();
        $location.path('/health-check');
    } else {
        const State = Private(StateProvider);
        const savedObjectsClient = Private(SavedObjectsClientProvider);
        
        savedObjectsClient.find({
            type   : 'index-pattern',
            fields : ['title'],
            perPage: 10000
        })
        .then(({ savedObjects }) => {

            let currentPattern = '';

            genericReq.request('GET', '/api/wazuh-elastic/current-pattern')
            .then(data => {

                if (appState.getCurrentPattern()) { // There's cookie for the pattern
                    currentPattern = appState.getCurrentPattern();
                } else {
                    currentPattern = data.data.data;
                    appState.setCurrentPattern(data.data.data);
                }

                const onlyWazuhAlerts = savedObjects.filter(element => element.id === currentPattern);

                if (onlyWazuhAlerts.length === 0) { // There's now selected ip
                    deferred.resolve('No ip');
                    return;
                }

                courier.indexPatterns.get(currentPattern)
                .then(data => {
                    deferred.resolve({
                        list         : onlyWazuhAlerts,
                        loaded       : data,
                        stateVal     : null,
                        stateValFound: false
                    });
                })
                .catch(error => {
                    deferred.reject(error);
                    $rootScope.blankScreenError = errorHandler.handle(error,'Elasticsearch');  
                    $location.path('/blank-screen');
                });

            })  
            .catch(error => {
                deferred.reject(error);
                $rootScope.blankScreenError = errorHandler.handle(error,'Elasticsearch');  
                $location.path('/blank-screen');
            });          
        })
        .catch(error => {
            deferred.reject(error);
            $rootScope.blankScreenError = errorHandler.handle(error,'Elasticsearch');  
            $location.path('/blank-screen');
        });
    }
    return deferred.promise;
    
};

const getAllIp = (Promise, $q, $window, $rootScope, courier, config, $location, Private) => {

    if (healthCheck($window, $rootScope) && !$location.path().includes("/settings")) {
        let deferred = $q.defer();
        $location.path('/health-check');
        deferred.reject();
        return deferred.promise;
    } else {
        const State = Private(StateProvider);
        const savedObjectsClient = Private(SavedObjectsClientProvider);

        return savedObjectsClient.find({
            type: 'index-pattern',
            fields: ['title'],
            perPage: 10000
        })
        .then(({ savedObjects }) => {
            /**
             *  In making the indexPattern modifiable it was placed in appState. Unfortunately,
             *  the load order of AppState conflicts with the load order of many other things
             *  so in order to get the name of the index we should use, and to switch to the
             *  default if necessary, we parse the appState with a temporary State object and
             *  then destroy it immediatly after we're done
             *
             *  @type {State}
             */
            const state = new State('_a', {});

            const specified = !!state.index;
            const exists = _.findIndex(savedObjects, o => o.id === state.index) > -1;
            const id = exists ? state.index : config.get('defaultIndex');
            state.destroy();

            return Promise.props({
                list: savedObjects,
                loaded: courier.indexPatterns.get(id),
                stateVal: state.index,
                stateValFound: specified && exists
            });
        });
    }
};

const getSavedSearch = (courier, $q, $window, $rootScope, savedSearches, $route) => {
    if (healthCheck($window, $rootScope)) {
        let deferred = $q.defer();
        $location.path('/health-check');
        deferred.reject();
        return deferred.promise;
    } else {
        return savedSearches.get($route.current.params.id)
        .catch(courier.redirectWhenMissing({
            'search': '/discover',
            'index-pattern': '/management/kibana/objects/savedSearches/' + $route.current.params.id
        }));
    }
};

//Routes
routes.enable();
routes
    .when('/health-check', {
        template: require('plugins/wazuh/templates/health-check/health-check.html'),
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/agents/:id?/:tab?/:view?', {
        template: require('plugins/wazuh/templates/agents/agents.jade'),
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "ips": getAllIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/agents-preview', {
        template: require('plugins/wazuh/templates/agents-prev/agents-prev.jade'),
        resolve: {
            "ips": getAllIp,
            "checkAPI": settingsWizard
        }
    })
    .when('/manager/:tab?/', {
        template: require('plugins/wazuh/templates/manager/manager.jade'),
        resolve: {
            "ips": getAllIp,
            "checkAPI": settingsWizard
        }
    })
    .when('/overview/', {
        template: require('plugins/wazuh/templates/overview/overview.jade'),
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "ips": getAllIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/wazuh-discover/', {
        template: require('plugins/wazuh/templates/discover/discover.jade'),
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "ips": getAllIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/settings/:tab?/', {
        template: require('plugins/wazuh/templates/settings/settings.html'),
        resolve: {
            "ips": getAllIp
        }
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
    .when('/login', {
        template: require('plugins/wazuh/templates/auth/login.html')
    })
    .when('/blank-screen', {
        template: require('plugins/wazuh/templates/error-handler/blank-screen.html')
    })
    .when('/', {
        redirectTo: '/overview/'
    })
    .when('', {
        redirectTo: '/overview/'
    })
    .otherwise({
        redirectTo: '/overview/'
    });
