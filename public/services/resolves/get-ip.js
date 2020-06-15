/*
 * Wazuh app - Module to fetch index patterns
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { healthCheck } from './health-check';
import { AppState } from '../../react-services/app-state';
import { npStart } from 'ui/new_platform';
import { ErrorHandler } from '../../react-services/error-handler';

export function getIp(
  $q,
  $window,
  $location,
  Private,
  appState,
  genericReq,
  errorHandler,
  wzMisc
) {
  const deferred = $q.defer();

  const buildSavedObjectsClient = async () => {
    try {
      const savedObjectsClient = npStart.core.savedObjects.client;

      const savedObjectsData = await savedObjectsClient.find({
        type: 'index-pattern',
        fields: ['title'],
        perPage: 10000
      });

      const { savedObjects } = savedObjectsData;

      let currentPattern = '';

      if (AppState.getCurrentPattern()) {
        // There's cookie for the pattern
        currentPattern = AppState.getCurrentPattern();
      } else {
        if (!$location.path().includes('/health-check')) {
          $location.search('tab', null);
          $location.path('/health-check');
        }
      }

      const onlyWazuhAlerts = savedObjects.filter(
        element => element.id === currentPattern
      );

      if (!onlyWazuhAlerts || !onlyWazuhAlerts.length) {
        // There's now selected ip
        deferred.resolve('No ip');
        return;
      }

      const courierData = await npStart.plugins.data.indexPatterns.get(currentPattern);

      deferred.resolve({
        list: onlyWazuhAlerts,
        loaded: courierData,
        stateVal: null,
        stateValFound: false
      });
    } catch (error) {
      deferred.reject(error);
      wzMisc.setBlankScr(
        ErrorHandler.handle(error, 'Elasticsearch', { silent: true })
      );
      $location.path('/blank-screen');
    }
  };

  const currentParams = $location.search();
  const targetedAgent =
    currentParams && (currentParams.agent || currentParams.agent === '000');
  const targetedRule =
    currentParams && currentParams.tab === 'ruleset' && currentParams.ruleid;
  if (!targetedRule && healthCheck($window)) {
    deferred.reject();
    $location.path('/health-check');
  } else {
    buildSavedObjectsClient();
  }
  return deferred.promise;
}
