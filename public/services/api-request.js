/*
 * Wazuh app - API request service
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

const app = require('ui/modules').get('app/wazuh', []);
app.service('apiReq', function ($q, $http, genericReq, appState, $location, $rootScope) {
    return {
        request: (method, path, body) => {
            let defered = $q.defer();

            if (!method || !path || !body) {
                defered.reject({
                    error:   -1,
                    message: 'Missing parameters'
                });
                return defered.promise;
            }

            if (appState.getCurrentAPI() === undefined || appState.getCurrentAPI() === null)
                defered.reject({
                    error:   -3,
                    message: 'No API selected.'
                });

            let id = JSON.parse(appState.getCurrentAPI()).id;
            let requestData = { method, path, body, id };

            genericReq.request('POST', '/api/wazuh-api/request', requestData)
            .then(data => {
                if (data.error) {
                    defered.reject(data);
                } else {
                    defered.resolve(data);
                }
            })
            .catch(error => defered.reject(error));

            return defered.promise;
        }
    };
});
