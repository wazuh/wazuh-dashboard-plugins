/*
 * Wazuh app - Tools to check the version of the plugin
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import GenericRequest from "../react-services/generic-request";
import { AxiosResponse } from 'axios';
import _ from "lodash";

type TAppInfo = {
  revision: string
  'app-version': string
}

type TAppInfoResponse = {
  statusCode: number
  data: TAppInfo
}

type cookie = [string, string];

const wazuhCookies: cookie[] = [
  ["currentApi", "/app/wazuh"],
  ["APISelector", "/app/wazuh"],
  ["clusterInfo", "/app/wazuh"],
  ["currentPattern", "/app/wazuh"],
  ["patternSelector", "/app/wazuh"],
]

export const checkPluginVersion = async () => {
  try {
    const response: AxiosResponse<TAppInfoResponse> = await GenericRequest.request('GET', '/api/setup');
    const { revision, "app-version": appRevision } = response.data.data;
    return checkLocalstorageVersion({ revision, "app-version": appRevision });
  } catch (error) {
    console.error(`Error when getting the plugin version: ${error}`)
  }
}

const checkLocalstorageVersion = (appInfo: TAppInfo) => {
  const storeAppInfo = localStorage.getItem('appInfo');

  if (!storeAppInfo) {
    updateAppInfo(appInfo);
    return;
  }

  !_.isEqual(appInfo, JSON.parse(storeAppInfo)) && clearBrowserInfo(appInfo);
}

const deleteWazuhCookies = ([name, path]: cookie) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
}

function clearBrowserInfo(appInfo: TAppInfo) {
  wazuhCookies.forEach(deleteWazuhCookies);
  updateAppInfo(appInfo);
}

function updateAppInfo(appInfo: TAppInfo) {
  localStorage.setItem("appInfo", JSON.stringify(appInfo));
}

