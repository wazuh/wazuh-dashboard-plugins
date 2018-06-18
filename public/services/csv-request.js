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
import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

app.service('csvReq', function (genericReq) {
    return {
        fetch: async (path, id, filters = null) => {
            try {
                const output = await genericReq.request('POST','/api/wazuh-api/csv',{ path, id, filters });
                return output.data;
            } catch (error) {
               return Promise.reject(error);  
            }
        }
    }
});