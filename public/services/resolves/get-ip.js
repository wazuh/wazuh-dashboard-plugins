/*
 * Wazuh app - Module to fetch index patterns
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
import { ErrorHandler } from '../../react-services/error-handler';
import { getDataPlugin, getSavedObjects } from '../../kibana-services';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { getWzConfig } from './get-config';

export function getIp(
  $q,
  $window,
  $location,
  wzMisc
) {
  const deferred = $q.defer();

  const checkWazuhConfig = async (indexPatterns) => {
    const wazuhConfig = new WazuhConfig();
    const configuration = wazuhConfig.getConfig();
    const indexPatternFound = indexPatterns.find((indexPattern) => indexPattern.attributes.title === configuration.pattern);
    if(!indexPatternFound){
      AppState.removeCurrentPattern()
    }
    getDataPlugin().indexPatterns.setDefault(configuration.pattern, true);

    return indexPatternFound;
  }

  const checkWazuhPatterns = async (indexPatterns) => {
    const wazuhConfig = new WazuhConfig();
    const configuration = await getWzConfig($q, GenericRequest, wazuhConfig);
    const wazuhPatterns = [
      `${configuration['wazuh.monitoring.pattern']}`,
      `${configuration['cron.prefix']}-${configuration['cron.statistics.index.name']}-*`
    ];
    return wazuhPatterns.every(pattern => {
      return indexPatterns.find(
        element => element.id === pattern
      );
    });
  }

  const buildSavedObjectsClient = async () => {
    try {
      const savedObjectsClient = getSavedObjects().client;

      const savedObjectsData = await savedObjectsClient.find({
        type: 'index-pattern',
        fields: ['title'],
        perPage: 10000
      });

      const { savedObjects } = savedObjectsData;

      let currentPattern = '';

      if (AppState.getCurrentPattern() && await checkWazuhPatterns(savedObjects) && await checkWazuhConfig(savedObjects)) {
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

      const courierData = await getDataPlugin().indexPatterns.get(currentPattern);

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
