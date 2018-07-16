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
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.service('apiReq', function ($q, genericReq, appState) {
    return {
        request: async (method, path, body) => {
            try {

                if (!method || !path || !body) {
                    throw new Error('Missing parameters');
                }
    
                if (!appState.getCurrentAPI()){
                    throw new Error('No API selected.');
                }
    
                const { id }      = JSON.parse(appState.getCurrentAPI());
                const requestData = { method, path, body, id };

                const data = await genericReq.request('POST', '/api/wazuh-api/request', requestData);
  
                if (data.error) {
                    throw new Error(data.error);
                }
                
                return $q.resolve(data);

            } catch (error) {
                return error && error.data && error.data.message ?
                       $q.reject(error.data.message) :
                       $q.reject(error.message || error);
            }
        }
    };
});
