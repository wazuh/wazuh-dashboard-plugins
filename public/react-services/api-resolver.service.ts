/*
 * Wazuh app - Module to fetch API entries
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * If there are no API entries it throws an exception, then it redirects to Settings
 * for adding a new API entry.
 * If there are API entries, then it continues to the health check itself.
 */
import AppState from './app-state';
import GenericRequest from './generic-request';

export const resolveApis = async () => {
  try {
    const data = await GenericRequest.request('GET', '/hosts/apis');
    if (!data || !data.data || !data.data.length) throw new Error('No API entries found');
    if (!AppState.getCurrentAPI()) {
      await tryToSetDefault(data.data, AppState);
    }

    return;
  } catch (error) {
    // TODO migration resolve when there is no api
  
  }
};

// Iterates the API entries in order to set one as default
const tryToSetDefault = async (apis, AppState) => {
  try {
    for (let idx in apis) {
      const api = apis[idx];
      try {
        AppState.setCurrentAPI(
          JSON.stringify({
            name: api.cluster_info.manager,
            id: api.id,
          })
        );
        break;
      } catch (error) {
        //Do nothing in order to follow the flow of the for
      }
    }
  } catch (error) {
    return Promise.reject(error);
  }
};
