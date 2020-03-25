/*
 * Wazuh app - Module to execute some checks on most app routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { checkTimestamp } from './check-timestamp';
import { healthCheck } from './health-check';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { ApiCheck } from '../../react-services/wz-api-check';

export function settingsWizard(
  $location,
  $q,
  $window,
  testAPI,
  appState,
  genericReq,
  errorHandler,
  wzMisc,
  disableErrors = false
) {
  try {
    const wazuhConfig = new WazuhConfig();
    const deferred = $q.defer();
    const checkResponse = data => {
      let fromWazuhHosts = false;
      if (parseInt(data.data.error) === 2) {
        !disableErrors &&
          errorHandler.handle(
            'Please set up Wazuh API credentials.',
            false,
            true
          );
      } else if (
        JSON.stringify(data).includes('socket hang up') ||
        ((data || {}).data || {}).apiIsDown ||
        (((data || {}).data || {}).data || {}).apiIsDown
      ) {
        wzMisc.setApiIsDown(true);
      } else {
        fromWazuhHosts = true;
        wzMisc.setBlankScr(errorHandler.handle(data));
        AppState.removeCurrentAPI();
      }

      if (!fromWazuhHosts) {
        wzMisc.setWizard(true);
        if (!$location.path().includes('/settings')) {
          $location.search('_a', null);
          $location.search('tab', 'api');
          $location.path('/settings');
        }
      } else {
        if (
          parseInt(((data || {}).data || {}).statusCode) === 500 &&
          parseInt(((data || {}).data || {}).error) === 7 &&
          ((data || {}).data || {}).message === '401 Unauthorized'
        ) {
          !disableErrors &&
            errorHandler.handle(
              'Wrong Wazuh API credentials, please add a new API and/or modify the existing one'
            );
          if (!$location.path().includes('/settings')) {
            $location.search('_a', null);
            $location.search('tab', 'api');
            $location.path('/settings');
          }
        } else {
          $location.path('/blank-screen');
        }
      }

      deferred.resolve();
    };

    const changeCurrentApi = data => {
      let currentApi = false;
      try {
        currentApi = JSON.parse(AppState.getCurrentAPI()).id;
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

          AppState.setCurrentAPI(str);
      AppState.setClusterInfo(clusterInfo);
    };

    const callCheckStored = () => {
      const config = wazuhConfig.getConfig();
      let currentApi = false;

      try {
        currentApi = JSON.parse(AppState.getCurrentAPI()).id;
      } catch (error) {
        console.log(
          'Error parsing JSON (settingsWizards.callCheckStored 1)',
          error
        );
      }
      if (currentApi && !AppState.getExtensions(currentApi)) {
        const extensions = {
          audit: config['extensions.audit'],
          pci: config['extensions.pci'],
          gdpr: config['extensions.gdpr'],
          hipaa: config['extensions.hipaa'],
          nist: config['extensions.nist'],
          oscap: config['extensions.oscap'],
          ciscat: config['extensions.ciscat'],
          aws: config['extensions.aws'],
          virustotal: config['extensions.virustotal'],
          osquery: config['extensions.osquery'],
          mitre: config['extensions.mitre'],
          docker: config['extensions.docker']
        };
        AppState.setExtensions(currentApi, extensions);
      }
      checkTimestamp(genericReq, $location, wzMisc)
        .then(() => ApiCheck.checkStored(currentApi))
        .then(data => {
          if (data === 3099) {
            deferred.resolve();
          } else {
            if (data.data.error || data.data.data.apiIsDown) {
              checkResponse(data);
            } else {
              if (((data || {}).data || {}).idChanged) {
                let apiRaw = false;
                try {
                  apiRaw = JSON.parse(AppState.getCurrentAPI());
                } catch (error) {
                  // eslint-disable-next-line
                  console.log(
                    `Error parsing JSON (settingsWizards.callCheckStored 2)`
                  );
                }
                AppState.setCurrentAPI(
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
          AppState.removeCurrentAPI();
          setUpCredentials(
            'Wazuh App: Please set up Wazuh API credentials.',
            false
          );
        });
    };

    const setUpCredentials = (msg, redirect = false) => {
      const comeFromWizard = wzMisc.getWizard();
      !comeFromWizard && errorHandler.handle(msg, false, true);
      wzMisc.setWizard(true);
      if (redirect) {
        AppState.setCurrentAPI(redirect);

      } else if (!$location.path().includes('/settings')) {
        $location.search('_a', null);
        $location.search('tab', 'api');
        $location.path('/settings');
      }
      return deferred.resolve();
    };

    // Iterates them in order to set one as default
    const tryToSetDefault = async apis => {
      try {
        let errors = 0;
        for (let idx in apis) {
          const api = apis[idx];
          const id = api.id;
          try {
            const clus = await ApiCheck.checkApi(api);
            api.cluster_info = clus.data;
            if (api && api.cluster_info && api.cluster_info.manager) {
              const defaultApi = JSON.stringify({
                name: api.cluster_info.manager,
                id: id
              });
              AppState.setCurrentAPI(defaultApi);
              callCheckStored();
              return defaultApi;
            }
          } catch (error) {
            // Sum errors to check if any API could be selected
            errors++;
            if (errors >= apis.length) {
              AppState.setNavigation({ status: false });
              AppState.setNavigation({
                reloaded: false,
                discoverPrevious: false,
                discoverSections: ['/overview/', '/agents', '/wazuh-dev']
              });
              throw new Error('Could not select any API entry');
            }
          }
        }
      } catch (error) {
        return Promise.reject(error);
      }
    };

    const currentParams = $location.search();
    const targetedAgent =
      currentParams && (currentParams.agent || currentParams.agent === '000');
    const targetedRule =
      currentParams && currentParams.tab === 'ruleset' && currentParams.ruleid;
    if (
      !targetedAgent &&
      !targetedRule &&
      !disableErrors &&
      healthCheck($window)
    ) {
      $location.path('/health-check');
      deferred.resolve();
    } else {
      // There's no cookie for current API
      const currentApi = AppState.getCurrentAPI();
      if (!currentApi) {
        genericReq
          .request('GET', '/hosts/apis')
          .then(async data => {
            if (data.data.length > 0) {
              // Try to set some API entry as default
              const defaultApi = await tryToSetDefault(data.data);
              setUpCredentials(
                'Wazuh App: Default API has been updated.',
                defaultApi
              );
            } else {
              setUpCredentials(
                'Wazuh App: Please set up Wazuh API credentials.'
              );
            }
            $location.path('health-check');
            deferred.resolve();
          })
          .catch(error => {
            !disableErrors && errorHandler.handle(error);
            wzMisc.setWizard(true);
            if (!$location.path().includes('/settings')) {
              $location.search('_a', null);
              $location.search('tab', 'api');
              $location.path('/settings');
            }
            deferred.resolve();
          });
      } else {
        const apiId = (JSON.parse(currentApi) || {}).id;
        genericReq
          .request('GET', '/hosts/apis')
          .then(async data => {
            if (
              data.data.length > 0 &&
              data.data.find(api => api.id == apiId)
            ) {
              callCheckStored();
            } else {
              AppState.removeCurrentAPI();
              if (data.data.length > 0) {
                // Try to set some as default
                const defaultApi = await tryToSetDefault(data.data);
                setUpCredentials(
                  'Wazuh App: Default API has been updated.',
                  defaultApi
                );
                $location.path('health-check');
              } else {
                setUpCredentials(
                  'Wazuh App: Please set up Wazuh API credentials.',
                  false
                );
              }
            }
          })
          .catch(error => {
            setUpCredentials('Wazuh App: Please set up Wazuh API credentials.');
          });
      }
    }
    AppState.setWzMenu();
    return deferred.promise;
  } catch (error) {
    !disableErrors && errorHandler.handle(error);
  }
}
