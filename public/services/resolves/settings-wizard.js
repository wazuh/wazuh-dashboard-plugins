/*
 * Wazuh app - Module to execute some checks on most app routes
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import checkTimestamp from './check-timestamp';
import healthCheck from './health-check';
import totalRAM from './check-ram';

export default (
  $rootScope,
  $location,
  $q,
  $window,
  testAPI,
  appState,
  genericReq,
  errorHandler,
  wzMisc,
  wazuhConfig
) => {
  try {
    const deferred = $q.defer();

    !$location.path().includes('health-check') &&
      totalRAM(genericReq, errorHandler);

    const checkResponse = data => {
      let fromElastic = false;
      if (parseInt(data.data.error) === 2) {
        errorHandler.handle(
          'Wazuh App: Please set up Wazuh API credentials.',
          'Routes',
          true
        );
      } else if (
        JSON.stringify(data).includes('socket hang up') ||
        (data && data.data && data.data.apiIsDown) ||
        (data && data.data && data.data.data && data.data.data.apiIsDown)
      ) {
        wzMisc.setApiIsDown(true);
        errorHandler.handle('Wazuh RESTful API seems to be down.', 'Routes');
      } else {
        fromElastic = true;
        wzMisc.setBlankScr(errorHandler.handle(data, 'Routes'));
        appState.removeCurrentAPI();
      }

      if (!fromElastic) {
        wzMisc.setWizard(true);
        if (!$location.path().includes('/settings')) {
          $location.search('_a', null);
          $location.search('tab', 'api');
          $location.path('/settings');
        }
      } else {
        if (
          data &&
          data.data &&
          parseInt(data.data.statusCode) === 500 &&
          parseInt(data.data.error) === 7 &&
          data.data.message === '401 Unauthorized'
        ) {
          errorHandler.handle(
            'Wrong Wazuh API credentials, please add a new API and/or modify the existing one.',
            'Routes'
          );
          $location.search('_a', null);
          $location.search('tab', 'api');
          $location.path('/settings');
        } else {
          $location.path('/blank-screen');
        }
      }

      deferred.reject();
    };

    const changeCurrentApi = data => {
      let currentApi = false;
      try {
        currentApi = JSON.parse(appState.getCurrentAPI()).id;
      } catch (error) {
        // eslint-disable-next-line
        console.log(`Error parsing JSON (settingsWizards.changeCurrentApi)`);
      }
      const clusterInfo = data.data.data.cluster_info;

      // Should change the currentAPI configuration depending on cluster
      const str =
        clusterInfo.status === 'disabled'
          ? JSON.stringify({ name: clusterInfo.manager, id: currentApi })
          : JSON.stringify({ name: clusterInfo.cluster, id: currentApi });

      appState.setCurrentAPI(str);
      appState.setClusterInfo(clusterInfo);
    };

    const callCheckStored = () => {
      const config = wazuhConfig.getConfig();

      let currentApi = false;

      try {
        currentApi = JSON.parse(appState.getCurrentAPI()).id;
      } catch (error) {
        // eslint-disable-next-line
        console.log(`Error parsing JSON (settingsWizards.callCheckStored 1)`);
      }

      if (currentApi && !appState.getExtensions(currentApi)) {
        const extensions = {
          audit: config['extensions.audit'],
          pci: config['extensions.pci'],
          gdpr: config['extensions.gdpr'],
          oscap: config['extensions.oscap'],
          ciscat: config['extensions.ciscat'],
          aws: config['extensions.aws'],
          virustotal: config['extensions.virustotal']
        };
        appState.setExtensions(currentApi, extensions);
      }

      checkTimestamp(appState, genericReq, $location, wzMisc)
        .then(() => testAPI.checkStored(currentApi))
        .then(data => {
          if (data && data === 'cookies_outdated') {
            $location.search('tab', 'welcome');
            $location.path('/overview');
          } else {
            if (data.data.error || data.data.data.apiIsDown) {
              checkResponse(data);
            } else {
              if (data && data.data && data.data.idChanged) {
                let apiRaw = false;
                try {
                  apiRaw = JSON.parse(appState.getCurrentAPI());
                } catch (error) {
                  // eslint-disable-next-line
                  console.log(
                    `Error parsing JSON (settingsWizards.callCheckStored 2)`
                  );
                }
                appState.setCurrentAPI(
                  JSON.stringify({ name: apiRaw.name, id: data.data.idChanged })
                );
              }
              wzMisc.setApiIsDown(false);
              changeCurrentApi(data);
              deferred.resolve();
            }
          }
        })
        .catch(error => {
          appState.removeCurrentAPI();

          errorHandler.handle(error, 'Routes');
          errorHandler.handle(
            'Please insert a new Wazuh API or select an existing valid one.',
            'Routes',
            true
          );

          $location.search('_a', null);
          $location.search('tab', 'api');
          $location.path('/settings');
        });
    };

    if (
      !$location.path().includes('/health-check') &&
      healthCheck($window, $rootScope)
    ) {
      $location.path('/health-check');
      deferred.reject();
    } else {
      // There's no cookie for current API
      if (!appState.getCurrentAPI()) {
        genericReq
          .request('GET', '/api/wazuh-api/apiEntries')
          .then(data => {
            if (data.data.length > 0) {
              const apiEntries = data.data;
              appState.setCurrentAPI(
                JSON.stringify({
                  name: apiEntries[0]._source.cluster_info.manager,
                  id: apiEntries[0]._id
                })
              );
              callCheckStored();
            } else {
              const comeFromWizard = wzMisc.getWizard();
              !comeFromWizard &&
                errorHandler.handle(
                  'Wazuh App: Please set up Wazuh API credentials.',
                  'Routes',
                  true
                );
              wzMisc.setWizard(true);
              if (!$location.path().includes('/settings')) {
                $location.search('_a', null);
                $location.search('tab', 'api');
                $location.path('/settings');
              }
              deferred.reject();
            }
          })
          .catch(error => {
            errorHandler.handle(error, 'Routes');
            wzMisc.setWizard(true);
            if (!$location.path().includes('/settings')) {
              $location.search('_a', null);
              $location.search('tab', 'api');
              $location.path('/settings');
            }
            deferred.reject();
          });
      } else {
        callCheckStored();
      }
    }

    return deferred.promise;
  } catch (error) {
    errorHandler.handle(error, 'Routes');
  }
};
