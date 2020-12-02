/*
 * Wazuh app - API status check service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import store from '../redux/store';
import axios, { Method } from 'axios';
import AppState from './app-state';
import { updateApiIsDown } from '../redux/actions/appStateActions';
import { AppConfigState } from '../redux/types';
import { getHttp } from '../kibana-services';

const checkStored = async (data, idChanged = false) => {
  const configuration = (store.getState().appConfigReducer as AppConfigState).data;
  const payload: any = { id: data };
  if (idChanged) {
    payload.idChanged = data;
  }
  try {
    const url = getHttp().basePath.prepend('/api/check-stored-api');
    const options = {
      method: 'POST' as Method,
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
      url: url,
      data: payload,
      timeout: (configuration.timeout as number) || 20000,
    };

    if (Object.keys(configuration).length) {
      AppState.setPatternSelector(configuration['ip.selector']);
      AppState.setAPISelector(configuration['api.selector']);
    }

    return await axios(options);
  } catch (err) {
    if (err.response) {
      store.dispatch(updateApiIsDown(true));
      const response = (err.response.data || {}).message || err.message;
      return Promise.reject(response);
    } else {
      return (err || {}).message || false
        ? Promise.reject(err.message)
        : Promise.reject(err || 'Server did not respond');
    }
  }
};

/**
 * Check the status of an API entry
 * @param {String} apiObject
 */
const checkApi = async (apiEntry, forceRefresh = false) => {
  try {
    const { timeout } = (store.getState().appConfigReducer as AppConfigState).data;
    const url = getHttp().basePath.prepend('/api/check-api');

    const options = {
      method: 'POST' as Method,
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
      url: url,
      data: { ...apiEntry, forceRefresh },
      timeout: timeout || 20000,
    };

    return await axios(options);
  } catch (err) {
    if (err.response) {
      const response = (err.response.data || {}).message || err.message;
      return Promise.reject(response);
    } else {
      return (err || {}).message || false
        ? Promise.reject(err.message)
        : Promise.reject(err || 'Server did not respond');
    }
  }
};

export default {
  checkStored,
  checkApi,
};
