/*
 * Wazuh app - API request service
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
import chrome from 'ui/chrome';
import { AppState } from './app-state';
import { ApiCheck } from './wz-api-check';
import { WzMisc } from '../factories/misc';
import { WazuhConfig } from './wazuh-config';

export class WzRequest {
  /**
   * Permorn a generic request
   * @param {String} method
   * @param {String} path
   * @param {Object} payload
   */
  static async genericReq(method, path, payload = null, customTimeout = false) {
    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }
      this.wazuhConfig = new WazuhConfig();
      const configuration = this.wazuhConfig.getConfig();
      const timeout = configuration ? configuration.timeout : 20000;

      const url = chrome.addBasePath(path);
      const options = {
        method: method,
        headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
        url: url,
        data: payload,
        timeout: customTimeout || timeout
      };
      const data = await axios(options);
      if (data.error) {
        throw new Error(data.error);
      }
      return Promise.resolve(data);
    } catch (err) {
      //if the requests fails, we need to check if the API is down
      const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (currentApi && currentApi.id) {
        try {
          await ApiCheck.checkStored(currentApi.id);
        } catch (err) {
          const wzMisc = new WzMisc();
          wzMisc.setApiIsDown(true);

          if (!window.location.hash.includes('#/settings')) {
            window.location.href = '/app/wazuh#/health-check';
          }
          return;
        }
      }
      return (err || {}).message || false
        ? Promise.reject(err.message)
        : Promise.reject(err || 'Server did not respond');
    }
  }

  /**
   * Perform a request to the Wazuh API
   * @param {String} method Eg. GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} body Request body
   */
  static async apiReq(method, path, body) {
    try {
      if (!method || !path || !body) {
        throw new Error('Missing parameters');
      }
      const id = JSON.parse(AppState.getCurrentAPI()).id;
      const requestData = { method, path, body, id };
      const data = await this.genericReq('POST', '/api/request', requestData);
      return Promise.resolve(data);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(error.data.message)
        : Promise.reject(error.message || error);
    }
  }

  /**
   * Perform a request to generate a CSV
   * @param {String} path
   * @param {Object} filters
   */
  static async csvReq(path, filters) {
    try {
      if (!path || !filters) {
        throw new Error('Missing parameters');
      }
      const id = JSON.parse(AppState.getCurrentAPI()).id;
      const requestData = { path, id, filters };
      const data = await this.genericReq('POST', '/api/csv', requestData, 0);
      return Promise.resolve(data);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(error.data.message)
        : Promise.reject(error.message || error);
    }
  }
}
