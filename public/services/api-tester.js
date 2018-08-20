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
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class ApiTester {
    constructor($http, appState, wzMisc, wazuhConfig) {
        this.$http       = $http
        this.appState    = appState;
        this.wzMisc      = wzMisc;
        this.wazuhConfig = wazuhConfig;
    }

    async checkStored(data) {
        try {
            const configuration = this.wazuhConfig.getConfig();
            const timeout = configuration ? configuration.timeout : 8000;
            const headers = {headers:{ "Content-Type": 'application/json' }, timeout: timeout || 8000};

            /** Checks for outdated cookies */
            const current     = this.appState.getCreatedAt();
            const lastRestart = this.wzMisc.getLastRestart();
            
            if(current && lastRestart && lastRestart > current){
                this.appState.removeCurrentPattern();
                this.appState.removeCurrentAPI();
                this.appState.removeClusterInfo();
                this.appState.removeCreatedAt();
                this.wzMisc.setLastRestart(null);

                this.appState.setPatternSelector(configuration['ip.selector']);

                return 'cookies_outdated';
                /** End of checks for outdated cookies */

            } else {

                const result = await this.$http.post(chrome.addBasePath('/api/wazuh-api/checkStoredAPI'), data,headers);

                this.appState.setPatternSelector(configuration['ip.selector']);

                if(result.error) {
                    return Promise.reject(result);
                }
                return result;
            }
        } catch (error) {
            if(error.status && error.status === -1){
                this.wzMisc.setApiIsDown(true);
            } 
            return Promise.reject(error);
            
        }
    }

    async check(data) {
        try {
            const { timeout } = this.wazuhConfig.getConfig();

            const headers = {headers:{ "Content-Type": 'application/json' },timeout: timeout || 8000};

            const url = chrome.addBasePath("/api/wazuh-api/checkAPI");
            const response = await this.$http.post(url, data, headers);

            if (response.error) {
                return Promise.reject(response);
            }

            return response;

        } catch(error) {
            return Promise.reject(error);
        }
    }
}

app.service('testAPI', ApiTester);