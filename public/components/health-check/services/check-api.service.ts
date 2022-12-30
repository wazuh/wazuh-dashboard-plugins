/*
 * Wazuh app - Check APIs service
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { ApiCheck, AppState, GenericRequest } from '../../../react-services';
import { CheckLogger } from '../types/check_logger';
import { i18n } from '@kbn/i18n';
const Descp1 = i18n.translate('components.addModule.guide.Descp1', {
  defaultMessage: 'Getting API hosts...',
});
const Descp2 = i18n.translate('components.addModule.guide.Descp2', {
  defaultMessage: 'API hosts found:',
});
const Descp3 = i18n.translate('components.addModule.guide.Descp3', {
  defaultMessage: 'Checking API host id',
});
const Descp4 = i18n.translate('components.addModule.guide.Descp4', {
  defaultMessage: 'Could not connect to API id',
});
const Descp5 = i18n.translate('components.addModule.guide.Descp5', {
  defaultMessage: '',
});
const Descp6 = i18n.translate('components.addModule.guide.Descp6', {
  defaultMessage: 'No API available to connect',
});
const Descp7 = i18n.translate('components.addModule.guide.Descp7', {
  defaultMessage: 'No API configuration found',
});
const Descp8 = i18n.translate('components.addModule.guide.Descp8', {
  defaultMessage: 'Error connecting to API:',
});
const Descp9 = i18n.translate('components.addModule.guide.Descp9', {
  defaultMessage: 'No current API selected',
});
const Descp10 = i18n.translate('components.addModule.guide.regkeyDescp', {
  defaultMessage: 'Filter by check reason',
});
const Descp11 = i18n.translate('components.addModule.guide.regkeyDescp11', {
  defaultMessage: 'Current API id',
});
const Descp12 = i18n.translate('components.addModule.guide.regkeyDescp12', {
  defaultMessage: 'Checking current API id',
});

const trySetDefault = async (checkLogger: CheckLogger) => {
  try {
    checkLogger.info(Descp1);
    const response = await GenericRequest.request('GET', '/hosts/apis');
    checkLogger.info(Descp2` ${response.data.length}`);
    const hosts = response.data;
    const errors = [];

    if (hosts.length) {
      for (var i = 0; i < hosts.length; i++) {
        try {
          checkLogger.info(Descp3` [${hosts[i].id}]...`);
          const API = await ApiCheck.checkApi(hosts[i], true);
          if (API && API.data) {
            return hosts[i].id;
          }
        } catch (err) {
          checkLogger.info(Descp4` [${hosts[i].id}]: ${err.message || err}`);
          errors.push(Descp4` [${hosts[i].id}]: ${err.message || err}`);
        }
      }
      if (errors.length) {
        return Promise.reject(Descp5);
      }
    }
    return Promise.reject(Descp6);
  } catch (error) {
    checkLogger.error(Descp7` ${error}`);
    return Promise.reject(Descp7` ${error}`);
  }
};

export const checkApiService =
  (appInfo: any) => async (checkLogger: CheckLogger) => {
    let apiChanged = false;
    try {
      let currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (!currentApi.id) {
        checkLogger.info(``);
        currentApi.id = await trySetDefault(checkLogger);
        apiChanged = true;
      }

      checkLogger.info(Descp6` [${currentApi.id}]`);
      checkLogger.info(Descp7` [${currentApi.id}]...`);
      const data = await ApiCheck.checkStored(currentApi.id).catch(
        async err => {
          checkLogger.info(
            `Current API id [${currentApi.id}] has some problem: ${
              err.message || err
            }`,
          );
          const newApi = await trySetDefault(checkLogger);
          if (newApi.error) {
            return { error: newApi.error };
          }
          apiChanged = true;
          checkLogger.info(`API host id [${newApi}] available`);
          return await ApiCheck.checkStored(newApi, true);
        },
      );

      if (apiChanged) {
        const api = ((data || {}).data || {}).data || {};
        const name = (api.cluster_info || {}).manager || false;
        AppState.setCurrentAPI(JSON.stringify({ name: name, id: api.id }));
        checkLogger.info(
          `Set current API in cookie: id [${api.id}], name [${name}]`,
        );
        getToasts().add({
          color: 'warning',
          title: 'Selected Wazuh API has been updated',
          text: '',
          toastLifeTimeMs: 3000,
        });
      }
      //update cluster info
      const cluster_info = (((data || {}).data || {}).data || {}).cluster_info;
      if (cluster_info) {
        AppState.setClusterInfo(cluster_info);
        checkLogger.info(`Set cluster info in cookie`);
      }
      if (data === 3099) {
        checkLogger.error('Wazuh not ready yet');
      } else if (data.data.error || data.data.data.apiIsDown) {
        const errorMessage = data.data.data.apiIsDown
          ? 'Wazuh API is down'
          : `Error connecting to the API: ${
              data.data.error && data.data.error.message
                ? ` ${data.data.error.message}`
                : ''
            }`;
        checkLogger.error(errorMessage);
      }
    } catch (error) {
      AppState.removeNavigation();
      checkLogger.info('Removed [navigate] cookie');
      throw error;
    }
  };
