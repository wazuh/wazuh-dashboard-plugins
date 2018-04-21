// Require routes
import routes from 'ui/routes';

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

const checkTimestamp = async (appState,genericReq,errorHandler,$rootScope,$location) => {
    try {
        const data = await genericReq.request('GET', '/api/wazuh-elastic/timestamp');
        const current = appState.getCreatedAt();
        if(data && data.data){
            if(!current) appState.setCreatedAt(data.data.lastRestart);
            $rootScope.lastRestart = data.data.lastRestart;
            if(!$rootScope.$$phase) $rootScope.$digest();
        } else {
            $rootScope.blankScreenError = 'Your .wazuh-version index is empty or corrupt.'
            $location.search('tab',null);
            $location.path('/blank-screen');
        }
        return;
    } catch (err){
        $rootScope.blankScreenError = err.message || err;
        $location.search('tab',null);
        $location.path('/blank-screen');
    }
}

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
        } else if((data.data && (data.data.apiIsDown || data.data.message === 'socket hang up')) || 
                  (data.data.data && (data.data.data.apiIsDown || data.data.data.message === 'socket hang up'))){
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
            if(!$location.path().includes("/settings")) {
                $location.search('_a', null);
                $location.search('tab', 'api');
                $location.path('/settings');
            }
        } else {
            if(data && data.data && parseInt(data.data.statusCode) === 500 && parseInt(data.data.error) === 7 && data.data.message === '401 Unauthorized'){
                errorHandler.handle('Wrong Wazuh API credentials, please add a new API and/or modify the existing one.','Routes');
                $location.search('_a', null);
                $location.search('tab', 'api');
                $location.path('/settings');
            } else {
                $location.path('/blank-screen');
            }
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
        checkTimestamp(appState,genericReq,errorHandler,$rootScope,$location)
        .then(() => testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id))
        .then(data => {
            if(data && data === 'cookies_outdated'){
                $location.search('tab','general');
                $location.path('/overview')
            } else {
                if (data.data.error || data.data.data.apiIsDown) {
                    checkResponse(data);
                } else {
                    $rootScope.apiIsDown = null;
                    changeCurrentApi(data);
                }
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
                    if(!$location.path().includes("/settings")) {
                        $location.search('_a', null);
                        $location.search('tab', 'api');
                        $location.path('/settings');
                    }
                    deferred.reject();
                }
            })
            .catch(error => {
                errorHandler.handle(error,'Routes');
                $rootScope.comeFromWizard = true;
                if(!$location.path().includes("/settings")) {
                    $location.search('_a', null);
                    $location.search('tab', 'api');
                    $location.path('/settings');
                }
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

const getIp = (Promise, courier, config, $q, $rootScope, $window, $location, Private, appState, genericReq,errorHandler) => {
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
            
            genericReq.request('GET', '/get-list')
            .then(data => {
                let currentPattern = '';
                if (appState.getCurrentPattern()) { // There's cookie for the pattern
                    currentPattern = appState.getCurrentPattern();
                } else {
                    if(!data.data.data.length){
                        $rootScope.blankScreenError = 'Sorry but no valid index patterns were found'
                        $location.search('tab',null);
                        $location.path('/blank-screen');
                        return;
                    }
                    currentPattern = data.data.data[0].id;
                    appState.setCurrentPattern(currentPattern);
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
                    $rootScope.blankScreenError = errorHandler.handle(error,'Elasticsearch',false,true);
                    $location.path('/blank-screen');
                });

            })
            .catch(error => {
                deferred.reject(error);
                $rootScope.blankScreenError = errorHandler.handle(error,'Elasticsearch',false,true);
                $location.path('/blank-screen');
            });
        })
        .catch(error => {
            deferred.reject(error);
            $rootScope.blankScreenError = errorHandler.handle(error,'Elasticsearch',false,true);
            $location.path('/blank-screen');
        });
    }
    return deferred.promise;

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

// HTML templates
import healthCheckTemplate from 'plugins/wazuh/templates/health-check/health-check.html'
import agentsTemplate      from 'plugins/wazuh/templates/agents/agents.jade'
import agentsPrevTemplate  from 'plugins/wazuh/templates/agents-prev/agents-prev.jade'
import managerTemplate     from 'plugins/wazuh/templates/manager/manager.jade'
import overviewTemplate    from 'plugins/wazuh/templates/overview/overview.jade'
import discoverTemplate    from 'plugins/wazuh/templates/discover/discover.jade'
import settingsTemplate    from 'plugins/wazuh/templates/settings/settings.html'
import loginTemplate       from 'plugins/wazuh/templates/auth/login.html'
import blankScreenTemplate from 'plugins/wazuh/templates/error-handler/blank-screen.html'

//Routes
routes.enable();
routes
    .when('/health-check', {
        template: healthCheckTemplate,
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/agents/:id?/:tab?/:view?', {
        template: agentsTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/agents-preview/:tab?/', {
        template: agentsPrevTemplate,
        resolve: {
            "checkAPI": settingsWizard
        }
    })
    .when('/manager/:tab?/', {
        template: managerTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/overview/', {
        template: overviewTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/wazuh-discover/', {
        template: discoverTemplate,
        resolve: {
            "checkAPI": settingsWizard,
            "ip": getIp,
            "savedSearch": getSavedSearch
        }
    })
    .when('/settings/:tab?/', {
        template: settingsTemplate,
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
    .when('/wlogin', {
        template: loginTemplate
    })
    .when('/blank-screen', {
        template: blankScreenTemplate
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
