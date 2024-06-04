/*
 * Wazuh app - Module to execute some checks on most app routes
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { ApiCheck } from '../../react-services/wz-api-check';
import { ErrorHandler } from '../../react-services/error-handler';
import { GenericRequest } from '../../react-services';
import NavigationService from '../../react-services/navigation-service';
import { getWzCurrentAppID } from '../../kibana-services';
import { settings } from '../../utils/applications';

export function settingsWizard(_, wzMisc, disableErrors = false) {
  try {
    const callCheckStored = async () => {
      let currentApi = false;

      try {
        currentApi = JSON.parse(AppState.getCurrentAPI()).id;
      } catch (error) {
        throw Error('Error parsing JSON (settingsWizards.callCheckStored 1)');
      }
    };

    const setUpCredentials = (msg, redirect = false) => {
      const comeFromWizard = wzMisc.getWizard();
      !comeFromWizard && ErrorHandler.handle(msg, '', { warning: true });
      wzMisc.setWizard(true);
      if (redirect) {
        AppState.setCurrentAPI(redirect);
      } else if (
        !NavigationService.getInstance().getPathname().includes('/settings') &&
        !NavigationService.getInstance().getPathname().includes('/blank-screen')
      ) {
        if (getWzCurrentAppID() === settings.id) {
          NavigationService.getInstance().navigate('/settings?tab=api');
        } else {
          NavigationService.getInstance().navigateToApp(settings.id);
        }
      }
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
                id: id,
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
                discoverSections: ['/overview/', '/agents', '/wazuh-dev'],
              });
              throw new Error('Could not select any API entry');
            }
          }
        }
      } catch (error) {
        return Promise.reject(error);
      }
    };

    AppState.setWzMenu();
    const currentParams = new URLSearchParams(
      NavigationService.getInstance().getSearch(),
    );
    const targetedAgent =
      currentParams &&
      (currentParams.get('agent') || currentParams.get('agent') === '000');
    const targetedRule =
      currentParams &&
      currentParams.get('tab') === 'ruleset' &&
      currentParams.get('ruleid');
    if (!targetedAgent && !targetedRule && !disableErrors && healthCheck()) {
      NavigationService.getInstance().navigate({
        pathname: '/health-check',
        state: { prevLocation: NavigationService.getInstance().getLocation() },
      });
    } else {
      // There's no cookie for current API
      const currentApi = AppState.getCurrentAPI();
      if (!currentApi) {
        return GenericRequest.request('GET', '/hosts/apis')
          .then(async data => {
            if (data.data.length > 0) {
              // Try to set some API entry as default
              const defaultApi = await tryToSetDefault(data.data);
              setUpCredentials('Default API has been updated.', defaultApi);
              NavigationService.getInstance().navigate({
                pathname: '/health-check',
                state: {
                  prevLocation: NavigationService.getInstance().getLocation(),
                },
              });
            } else {
              setUpCredentials('Please set up API credentials.');
            }
          })
          .catch(error => {
            !disableErrors && ErrorHandler.handle(error);
            wzMisc.setWizard(true);
            if (
              !NavigationService.getInstance()
                .getPathname()
                .includes('/settings')
            ) {
              if (getWzCurrentAppID() === settings.id) {
                NavigationService.getInstance().navigate('/settings?tab=api');
              } else {
                NavigationService.getInstance().navigateToApp(settings.id);
              }
            }
          });
      } else {
        const apiId = (JSON.parse(currentApi) || {}).id;
        return GenericRequest.request('GET', '/hosts/apis')
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
                setUpCredentials('Default API has been updated.', defaultApi);
                NavigationService.getInstance().navigate({
                  pathname: '/health-check',
                  state: {
                    prevLocation: NavigationService.getInstance().getLocation(),
                  },
                });
              } else {
                setUpCredentials('Please set up API credentials.', false);
              }
            }
          })
          .catch(error => {
            setUpCredentials('Please set up API credentials.');
          });
      }
    }
  } catch (error) {
    const options = {
      context: `${settingsWizard.name}`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.CRITICAL,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
      },
    };
    !disableErrors && getErrorOrchestrator().handleError(options);
  }
}
