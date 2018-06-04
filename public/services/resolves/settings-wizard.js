/*
 * Wazuh app - Module to execute some checks on most app routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import checkTimestamp from './check-timestamp'
import healthCheck    from './health-check'
import totalRAM       from './check-ram'

export default ($rootScope, $location, $q, $window, testAPI, appState, genericReq, errorHandler, wzMisc) => {
    try {
        const deferred = $q.defer();

        totalRAM(genericReq,errorHandler);

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
                wzMisc.setApiIsDown(true)
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
                        wzMisc.setApiIsDown(false)
                        changeCurrentApi(data);
                    }
                }
            })
            .catch(error => {
                appState.removeCurrentAPI();
                errorHandler.handle(error,'Routes');
                errorHandler.handle('Wazuh App: please add a new API.','Routes',true);
                $location.search('_a', null);
                $location.search('tab', 'api');
                $location.path('/settings');
            });
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
    } catch (error) {
        errorHandler.handle(error,'Routes');
    }
};