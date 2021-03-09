/*
 * Wazuh app - Tools to check the version of the plugin
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { GenericRequest } from '../react-services/generic-request';
import { AxiosResponse } from 'axios';
import _ from 'lodash';
import meta from '../assets/meta.json';
import { getCookies } from '../kibana-services';

type TAppInfo = {
  revision: string;
  'app-version': string;
};

type TAppInfoResponse = {
  statusCode: number;
  data: TAppInfo;
};

export const checkPluginVersion = async () => {
  try {
    const response: AxiosResponse<TAppInfoResponse> = await GenericRequest.request(
      'GET',
      '/api/setup'
    );
    const { revision, 'app-version': appRevision } = response.data.data;
    return checkClientAppVersion({ revision, 'app-version': appRevision });
  } catch (error) {
    console.error(`Error when getting the plugin version: ${error}`);
  }
};

const checkClientAppVersion = (appInfo: TAppInfo) => {
  if (appInfo['app-version'] !== meta.version || appInfo.revision !== meta.revision) {
    clearBrowserInfo(appInfo);
  } else {
    const storeAppInfo = localStorage.getItem('appInfo');
    !storeAppInfo && updateAppInfo(appInfo);
  }
};

function clearBrowserInfo(appInfo: TAppInfo) {
  console.warn('Clearing browser cache');
  //remove cookies
  const cookies = getCookies().getAll();
  Object.keys(cookies).forEach((cookie) => getCookies().remove(cookie));

  //remove cache
  if (caches) {    
    caches.keys().then(function (names) {
      for (let name of names) caches.delete(name);
    });
  }

  //update localStorage
  updateAppInfo(appInfo);

  // delete browser cache and hard reload
  window.location.reload(true);
}

function updateAppInfo(appInfo: TAppInfo) {
  localStorage.setItem('appInfo', JSON.stringify(appInfo));
}
