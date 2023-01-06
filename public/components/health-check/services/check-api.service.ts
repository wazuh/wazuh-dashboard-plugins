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
const descp1 = i18n.translate('wazuh.components.healthCheck.descp1', {
  defaultMessage: 'Getting API hosts...',
});
const descp2 = i18n.translate('wazuh.components.healthCheck.descp2', {
  defaultMessage: 'API hosts found:',
});
const descp3 = i18n.translate('wazuh.components.healthCheck.descp3', {
  defaultMessage: 'Checking API host id',
});
const descp4 = i18n.translate('wazuh.components.healthCheck.descp4', {
  defaultMessage: 'Could not connect to API id',
});
const descp5 = i18n.translate('wazuh.components.healthCheck.descp5', {
  defaultMessage: 'No API available to connect',
});
const descp6 = i18n.translate('wazuh.components.healthCheck.descp6', {
  defaultMessage: 'No API configuration found',
});
const descp7 = i18n.translate('wazuh.components.healthCheck.descp7', {
  defaultMessage: 'Error connecting to API:',
});
const descp8 = i18n.translate('wazuh.components.healthCheck.descp8', {
  defaultMessage: 'No current API selected',
});
const descp9 = i18n.translate('wazuh.components.healthCheck.descp9', {
  defaultMessage: 'Current API id',
});
const descp10 = i18n.translate('wazuh.components.healthCheck.regkeydescp', {
  defaultMessage: 'Filter by check reason',
});
const descp11 = i18n.translate('wazuh.components.healthCheck.regkeydescp11', {
  defaultMessage: 'Checking current API id',
});
const descp12 = i18n.translate('wazuh.components.healthCheck.regkeydescp12', {
  defaultMessage: 'have some problem',
});
const descp13 = i18n.translate('wazuh.components.healthCheck.regkeydescp13', {
  defaultMessage: 'API host id',
});
const descp14 = i18n.translate('wazuh.components.healthCheck.regkeydescp14', {
  defaultMessage: 'available',
});
const descp15 = i18n.translate('wazuh.components.healthCheck.regkeydescp15', {
  defaultMessage: 'Set current API in cookie: id',
});
const descp16 = i18n.translate('wazuh.components.healthCheck.regkeydescp16', {
  defaultMessage: 'name',
});
const descp17 = i18n.translate('wazuh.components.healthCheck.regkeydescp17', {
  defaultMessage: 'Selected Wazuh API has been updated',
});
const descp18 = i18n.translate('wazuh.components.healthCheck.regkeydescp18', {
  defaultMessage: 'Set cluster info in cookie',
});
const descp19 = i18n.translate('wazuh.components.healthCheck.regkeydescp19', {
  defaultMessage: 'Wazuh not ready yet',
});
const descp20 = i18n.translate('wazuh.components.healthCheck.regkeydescp20', {
  defaultMessage: 'Wazuh API is down',
});
const descp21 = i18n.translate('wazuh.components.healthCheck.regkeydescp21', {
  defaultMessage: 'Error connecting to the API:',
});
const descp22 = i18n.translate('wazuh.components.healthCheck.regkeydescp22', {
  defaultMessage: 'Removed [navigate] cookie',
});
const trySetDefault = async (checkLogger: CheckLogger) => {
  try {
    checkLogger.info(descp1);
    const response = await GenericRequest.request('GET', '/hosts/apis');
    checkLogger.info(`${descp2} ${response.data.length}`);
    const hosts = response.data;
    const errors = [];

    if (hosts.length) {
      for (var i = 0; i < hosts.length; i++) {
        try {
          checkLogger.info(`${descp3} [${hosts[i].id}]...`);
          const API = await ApiCheck.checkApi(hosts[i], true);
          if (API && API.data) {
            return hosts[i].id;
          }
        } catch (err) {
          checkLogger.info(`${descp4} [${hosts[i].id}]: ${err.message || err}`);
          errors.push(`${descp4} [${hosts[i].id}]: ${err.message || err}`);
        }
      }
      if (errors.length) {
        return Promise.reject(descp5);
      }
    }
    return Promise.reject(descp6);
  } catch (error) {
    checkLogger.error(`${descp7} ${error}`);
    return Promise.reject(`${descp7} ${error}`);
  }
};

export const checkApiService =
  (appInfo: any) => async (checkLogger: CheckLogger) => {
    let apiChanged = false;
    try {
      let currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (!currentApi.id) {
        checkLogger.info(descp8);
        currentApi.id = await trySetDefault(checkLogger);
        apiChanged = true;
      }

      checkLogger.info(`${descp9} [${currentApi.id}]`);
      checkLogger.info(`${descp10} [${currentApi.id}]...`);
      const data = await ApiCheck.checkStored(currentApi.id).catch(
        async err => {
          checkLogger.info(
            `${descp11} [${currentApi.id}] ${descp12} ${err.message || err}`,
          );
          const newApi = await trySetDefault(checkLogger);
          if (newApi.error) {
            return { error: newApi.error };
          }
          apiChanged = true;
          checkLogger.info(`${descp13} [${newApi}] ${descp14}`);
          return await ApiCheck.checkStored(newApi, true);
        },
      );

      if (apiChanged) {
        const api = ((data || {}).data || {}).data || {};
        const name = (api.cluster_info || {}).manager || false;
        AppState.setCurrentAPI(JSON.stringify({ name: name, id: api.id }));
        checkLogger.info(`${descp15} [${api.id}], ${descp16} [${name}]`);
        getToasts().add({
          color: 'warning',
          title: descp17,
          text: '',
          toastLifeTimeMs: 3000,
        });
      }
      //update cluster info
      const cluster_info = (((data || {}).data || {}).data || {}).cluster_info;
      if (cluster_info) {
        AppState.setClusterInfo(cluster_info);
        checkLogger.info(descp18);
      }
      if (data === 3099) {
        checkLogger.error(descp19);
      } else if (data.data.error || data.data.data.apiIsDown) {
        const errorMessage = data.data.data.apiIsDown
          ? descp20
          : `${descp21} ${
              data.data.error && data.data.error.message
                ? ` ${data.data.error.message}`
                : ''
            }`;
        checkLogger.error(errorMessage);
      }
    } catch (error) {
      AppState.removeNavigation();
      checkLogger.info(descp22);
      throw error;
    }
  };
