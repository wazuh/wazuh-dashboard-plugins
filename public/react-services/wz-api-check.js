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
import { WazuhConfig } from './wazuh-config';
import chrome from 'ui/chrome';
import axios from 'axios';
import { AppState } from './app-state';
import { WzMisc } from '../factories/misc';

export class ApiCheck {
  static async checkStored(data, idChanged = false) {
    try {
      const wazuhConfig = new WazuhConfig();
      const configuration = wazuhConfig.getConfig();
      const timeout = configuration ? configuration.timeout : 20000;
      const payload = { id: data };
      if (idChanged) {
        payload.idChanged = data;
      }

      const url = chrome.addBasePath('/api/check-stored-api');
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
        url: url,
        data: payload,
        timeout: timeout || 20000
      };

      if (Object.keys(configuration).length) {
        AppState.setPatternSelector(configuration['ip.selector']);
        AppState.setAPISelector(configuration['api.selector']);
      }

      const response = await axios(options);

      if (response.error) {
        return Promise.reject(response);
      }

      return response;
    } catch (err) {
      if (err.response) {
        const wzMisc = new WzMisc();
        wzMisc.setApiIsDown(true);
        const response = (err.response.data || {}).message || err.message;
        return Promise.reject(response);
      } else {
        return (err || {}).message || false
          ? Promise.reject(err.message)
          : Promise.reject(err || 'Server did not respond');
      }
    }
  }

  /**
   * Check the status of an API entry
   * @param {String} apiObject
   */
  static async checkApi(apiEntry, forceRefresh=false) {
    try {
      const wazuhConfig = new WazuhConfig();
      const { timeout } = wazuhConfig.getConfig();
      const url = chrome.addBasePath('/api/check-api');

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
        url: url,
        data: {...apiEntry, forceRefresh},
        timeout: timeout || 20000
      };

      const response = await axios(options);

      if (response.error) {
        return Promise.reject(response);
      }

      return response;
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
  }
}
