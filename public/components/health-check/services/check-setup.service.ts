/*
 * Wazuh app - Check Setup Service
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { AppState } from '../../../react-services/app-state';
import { GenericRequest } from '../../../react-services/generic-request';
import { WzRequest } from '../../../react-services/wz-request';

export const checkSetupService = async (): Promise<{ errors: string[] }> => {
  let errors: string[] = [];
  const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
  if (currentApi && currentApi.id) {
    const versionData = await WzRequest.apiReq('GET', '//', {});
    const apiVersion = versionData.data.data['api_version'];
    const setupData = await GenericRequest.request('GET', '/api/setup');
    if (!setupData.data.data['app-version']) {
      errors.push('Error fetching app version');
    }
    if (!apiVersion) {
      errors.push('Error fetching Wazuh API version');
    } else {
      const api = /v?(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/.exec(apiVersion);
      const appSplit = setupData.data.data['app-version'].split('.');
      if (
        !api ||
        !api.groups ||
        api.groups.version !== appSplit[0] ||
        api.groups.minor !== appSplit[1]
      ) {
        errors.push('API version mismatch. Expected v' + setupData.data.data['app-version']);
      }
    }
  }

  return { errors };
};
