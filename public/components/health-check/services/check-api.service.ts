/*
 * Wazuh app - Check Api Service
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { getToasts } from '../../../kibana-services';
import AppState from '../../../react-services/app-state';
import GenericRequest from '../../../react-services/generic-request';
import ApiCheck from '../../../react-services/wz-api-check';

const trySetDefault = async () => {
  try {
    const response = await GenericRequest.request('GET', '/hosts/apis');
    const hosts = response.data;
    const errors = [];

    if (hosts.length) {
      for (var i = 0; i < hosts.length; i++) {
        try {
          const API = await ApiCheck.checkApi(hosts[i], true);
          if (API && API.data) {
            return hosts[i].id;
          }
        } catch (err) {
          return {
            error: `Could not connect to API with id: ${hosts[i].id}: ${err.message || err}`,
          };
        }
      }
      if (errors.length) {
        return Promise.reject('No API available to connect.');
      }
    }
  } catch (err) {
    return Promise.reject(`Error connecting to API: ${err}`);
  }
};

export const checkApiService = async (): Promise<{ errors: string[] }> => {
  let errors: string[] = [];
  let apiChanged = false;
  try {
    const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');

    const data = await ApiCheck.checkStored(currentApi.id).catch(async (err) => {
      const newApi = await trySetDefault();
      if (newApi.error) {
        return { error: newApi.error };
      }
      apiChanged = true;
      return await ApiCheck.checkStored(newApi, true);
    });

    if (apiChanged) {
      getToasts().add({
        color: 'warning',
        title: 'Selected Wazuh API has been updated',
        text: '',
        toastLifeTimeMs: 3000,
      });
      const api = ((data || {}).data || {}).data || {};
      const name = (api.cluster_info || {}).manager || false;
      AppState.setCurrentAPI(JSON.stringify({ name: name, id: api.id }));
    }
    //update cluster info
    const cluster_info = (((data || {}).data || {}).data || {}).cluster_info;
    if (cluster_info) {
      AppState.setClusterInfo(cluster_info);
    }

    if (data === 3099) {
      errors.push('Wazuh not ready yet.');
    } else if (data.data.error || data.data.data.apiIsDown) {
      errors.push(
        data.data.data.apiIsDown
          ? 'Wazuh API is down.'
          : `Error connecting to the API.${
              data.data.error && data.data.error.message ? ` ${data.data.error.message}` : ''
            }`
      );
    }
    return { errors };
  } catch (error) {
    AppState.removeNavigation();
    if (error && error.data && error.data.code && error.data.code === 3002) {
      return { errors };
    } else {
      throw error;
    }
  }
};
