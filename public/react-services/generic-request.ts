/*
 * Wazuh app - Generic request
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import axios from 'axios';
import AppState from './app-state';
import ApiCheck from './wz-api-check';
import { OdfeUtils } from '../utils';
import store from '../redux/store';
import { updateApiIsDown } from '../redux/actions/appStateActions';
import { AppConfigState } from '../redux/types';
import { getHttp } from '../kibana-services';

const request = async (
  method: string,
  path: string,
  payload: object | null = null
): Promise<any> => {  
  try {
    if (!method || !path) {
      throw new Error('Missing parameters');
    }
    const { timeout } = (store.getState().appConfigReducer as AppConfigState).data;
    const requestHeaders: any = {
      'Content-Type': 'application/json',
      'kbn-xsrf': 'kibana',
    };
    const tmpUrl = getHttp().basePath.prepend(path);

    requestHeaders.pattern = AppState.getCurrentPattern();

    try {
      requestHeaders.id = JSON.parse(AppState.getCurrentAPI().toString()).id;
    } catch (error) {
      // Intended
    }
    var options = {};

    const data = {};
    if (method === 'GET') {
      options = {
        method: method,
        headers: requestHeaders,
        url: tmpUrl,
        timeout: timeout || 20000,
      };
    }
    if (method === 'PUT') {
      options = {
        method: method,
        headers: requestHeaders,
        data: payload,
        url: tmpUrl,
        timeout: timeout || 20000,
      };
    }
    if (method === 'POST') {
      options = {
        method: method,
        headers: requestHeaders,
        data: payload,
        url: tmpUrl,
        timeout: timeout || 20000,
      };
    }
    if (method === 'DELETE') {
      options = {
        method: method,
        headers: requestHeaders,
        data: payload,
        url: tmpUrl,
        timeout: timeout || 20000,
      };
    }
    Object.assign(data, await axios(options));
    if (!data) {
      throw new Error(`Error doing a request to ${tmpUrl}, method: ${method}.`);
    }
    return data;
  } catch (err) {
    OdfeUtils.checkOdfeSessionExpired(err);
    //if the requests fails, we need to check if the API is down
    const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
    if (currentApi && currentApi.id) {
      try {
        await ApiCheck.checkStored(currentApi.id);
      } catch (err) {
        store.dispatch(updateApiIsDown(true));

        // TODO:MIGRATION check possible loop.
        if (!window.location.hash.includes('#/settings')) {
          window.location.href = '/app/wazuh#/health-check';
        }
      }
    }
    return (((err || {}).response || {}).data || {}).message || false
      ? Promise.reject(err.response.data.message)
      : Promise.reject(err || 'Server did not respond');
  }
};

export default {
  request,
};
