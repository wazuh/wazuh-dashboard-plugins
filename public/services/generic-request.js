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
import chrome       from 'ui/chrome';
import { uiModules } from 'ui/modules'

uiModules.get('app/wazuh', [])
.service('genericReq', function ($q, $http, $location, $rootScope, appState,errorHandler) {

    const _request = (method, url, payload = null) => {
        let defered = $q.defer();

        if (!method || !url) {
            defered.reject({
                'error':   -1,
                'message': 'Missing parameters'
            });
            return defered.promise;
        }
        let requestHeaders = { headers: { "Content-Type": 'application/json' }, timeout: $rootScope.userTimeout || 8000 };

        let tmpUrl = chrome.addBasePath(url), tmp = null;
        if(appState.getUserCode()) requestHeaders.headers.code = appState.getUserCode();
        const id = appState.getCurrentAPI() ? JSON.parse(appState.getCurrentAPI()).id : false;
        if(id) requestHeaders.headers.id = id;
        if (method === "GET")    tmp = $http.get(tmpUrl, requestHeaders);
        if (method === "PUT")    tmp = $http.put(tmpUrl, payload, requestHeaders);
        if (method === "POST")   tmp = $http.post(tmpUrl, payload, requestHeaders);
        if (method === "DELETE") tmp = $http.delete(tmpUrl);

        if(!tmp) {
            defered.reject({
                error: -2,
                message: `Error doing a request to ${tmpUrl}, method: ${method}.`
            });
            return defered.promise;
        }

        tmp
        .then(data => {
            if (data.error && data.error !== '0') {
                defered.reject(data);
            } else {
                defered.resolve(data);
            }
        })
        .catch(defered.reject);

        return defered.promise;
    };

    return {
        request: (method, path, payload = null) => {
            if (!method || !path) {
                return Promise.reject(new Error('Missing parameters'));
            }

            const defered = $q.defer();
            
            _request(method, path, payload)
            .then(defered.resolve)
            .catch(defered.reject);

            return defered.promise;
        }
    };
});
