/*
 * Wazuh app - API test service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import chrome       from 'ui/chrome';
import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

app.service('testAPI', function ($http, $location, $rootScope, appState, wzMisc, wazuhConfig) {
    return {
        check_stored: async data => {
            try {
                const headers = {headers:{ "Content-Type": 'application/json' },timeout: $rootScope.userTimeout || 8000};

                /** Checks for outdated cookies */
                const current     = appState.getCreatedAt();
                const lastRestart = $rootScope.lastRestart;
                const configuration = wazuhConfig.getConfig();

                if(current && lastRestart && lastRestart > current){
                    appState.removeCurrentPattern();
                    appState.removeCurrentAPI();
                    appState.removeClusterInfo();
                    appState.removeCreatedAt();
                    delete $rootScope.lastRestart;

                    appState.setPatternSelector(configuration['ip.selector']);

                    return 'cookies_outdated';
                    /** End of checks for outdated cookies */

                } else {

                    const result = await $http.post(chrome.addBasePath('/api/wazuh-api/checkStoredAPI'), data,headers);

                    appState.setPatternSelector(configuration['ip.selector']);

                    if(result.error) {
                        return Promise.reject(result);
                    }
                    return result;
                }
            } catch (error) {
                if(error.status && error.status === -1){
                    wzMisc.setApiIsDown(true);
                } 
                return Promise.reject(error);
                
            }
        },
        check: async data => {
            try {
                const headers = {headers:{ "Content-Type": 'application/json' },timeout: $rootScope.userTimeout || 8000};

                const url = chrome.addBasePath("/api/wazuh-api/checkAPI");
                const response = await $http.post(url, data, headers);

                if (response.error) {
                    return Promise.reject(response);
                }

                return response;

            } catch(error) {
                return Promise.reject(error);
            }
        }
    };
});
