/*
 * Wazuh app - Module to fetch API entries
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
    .request('GET', '/elastic/apis')
    .then(data => {
      if (!data.data.length) throw new Error('No API entries found');
      else {
        const firstEntry = data.data[0];
        appState.setCurrentAPI(
          JSON.stringify({
            name: firstEntry._source.cluster_info.manager,
            id: firstEntry._id
          })
        );
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
