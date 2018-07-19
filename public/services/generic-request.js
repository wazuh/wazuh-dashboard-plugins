/*
 * Wazuh app - Generic request service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import chrome from 'ui/chrome';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.service('genericReq', function ($q, $http, appState, wazuhConfig) {
    return {
        request: async (method, path, payload = null) => {
            try {
                if (!method || !path) {
                    throw new Error('Missing parameters');
                }

                const { timeout }    = wazuhConfig.getConfig();
                const requestHeaders = { headers: { "Content-Type": 'application/json' }, timeout: timeout || 8000 };
                const tmpUrl         = chrome.addBasePath(path);
              
                requestHeaders.headers.pattern = appState.getCurrentPattern();
              
                try { 
                    requestHeaders.headers.id = JSON.parse(appState.getCurrentAPI()).id; 
                } catch (error) { 
                    // Intended 
                }

                const data = {};
                if (method === "GET")    Object.assign(data, await $http.get(tmpUrl, requestHeaders));
                if (method === "PUT")    Object.assign(data, await $http.put(tmpUrl, payload, requestHeaders));
                if (method === "POST")   Object.assign(data, await $http.post(tmpUrl, payload, requestHeaders));
                if (method === "DELETE") Object.assign(data, await $http.delete(tmpUrl));

                if (!data) {
                    throw new Error(`Error doing a request to ${tmpUrl}, method: ${method}.`);
                }

                if (data.error && data.error !== '0') {
                    throw new Error(data.error);
                } 

                return $q.resolve(data);
                        
            } catch (error) {
                return $q.reject(error);
            }
        }
    };
});
