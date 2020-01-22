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
 * @param {*} $q Promise library for Angular.js resolves.
 * @param {*} genericReq Wazuh module for doing generic requests to our backend.
 * @param {*} $location Angular.js library for URL and paths manipulation.
 */
export function apiCount($q, genericReq, $location, appState) {
  const deferred = $q.defer();
  genericReq
    .request('GET', '/hosts/apis')
    .then(async data => {
      if (!data || !data.data || !data.data.length)
        throw new Error('No API entries found');
      if (!appState.getCurrentAPI()) {
        await tryToSetDefault(data.data, appState);
      }
      deferred.resolve();
    })
    .catch(() => {
      $location.search('_a', null);
      $location.search('tab', 'api');
      $location.path('/settings');
      deferred.resolve();
    });
  return deferred.promise;
}

// Iterates the API entries in order to set one as default
function tryToSetDefault(apis, appState) {
  try {
    for (let idx in apis) {
      const api = apis[idx];
      try {
        appState.setCurrentAPI(
          JSON.stringify({
            name: api.cluster_info.manager,
            id: api.id
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
}
