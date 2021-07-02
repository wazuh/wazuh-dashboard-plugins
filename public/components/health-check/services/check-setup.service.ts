/*
 * Wazuh app - Check setup service
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { AppState, GenericRequest, WzRequest } from '../../../react-services';
import { CheckLogger } from '../types/check_logger';

export const checkSetupService = appInfo => async (checkLogger: CheckLogger) => {
  const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
  if (currentApi && currentApi.id) {
    checkLogger.info(`Current API in cookie: [${currentApi.id}]`);
    checkLogger.info(`Getting API version data...`);
    const versionData = await WzRequest.apiReq('GET', '//', {});
    const apiVersion = versionData.data.data['api_version'];
    checkLogger.info(`API version: [${apiVersion}]`);
    checkLogger.info(`Getting the app version...`);
    const setupData = await GenericRequest.request('GET', '/api/setup');
    if (!setupData.data.data['app-version']) {
      checkLogger.info('Error fetching app version');
    }else{
      checkLogger.info(`App version: [${setupData.data.data['app-version']}]`);
    };

    if (!apiVersion) {
      checkLogger.info('Error fetching Wazuh API version');
    } else {
      const api = /v?(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/.exec(apiVersion);
      const appSplit = setupData.data.data['app-version'].split('.');
      if (
        !api ||
        !api.groups ||
        api.groups.version !== appSplit[0] ||
        api.groups.minor !== appSplit[1]
      ) {
        checkLogger.error(`API and APP version mismatch. API version: ${apiVersion}. App version: ${setupData.data.data['app-version']}. At least, major and minor should match`);
      }
    }
  }

};
