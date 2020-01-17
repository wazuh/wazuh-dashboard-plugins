/*
 * Wazuh app - Generic request service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import chrome from 'ui/chrome';
import { AppState } from '../react-services/app-state';

export class GenericRequest {
  /**
   * Class constructor
   * @param {*} $q
   * @param {*} $http
   * @param {*} appState
   * @param {*} wazuhConfig
   */
  constructor($q, $http, appState, wazuhConfig) {
    this.$q = $q;
    this.$http = $http;
    this.appState = appState;
    this.wazuhConfig = wazuhConfig;
  }

  /**
   * Executes a request to a remote host
   * @param {string} method Request method (GET, PUT, POST, DELETE)
   * @param {string} path Relative path to the remote host
   * @param {object} payload
   */
  async request(method, path, payload = null) {
    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }

      const { timeout } = this.wazuhConfig.getConfig();
      const requestHeaders = {
        headers: { 'Content-Type': 'application/json' },
        timeout: timeout || 20000
      };
      const tmpUrl = chrome.addBasePath(path);

      requestHeaders.headers.pattern = AppState.getCurrentPattern();

      try {
        requestHeaders.headers.id = JSON.parse(
          AppState.getCurrentAPI()
        ).id;
      } catch (error) {
        // Intended
      }

      const data = {};
      if (method === 'GET')
        Object.assign(data, await this.$http.get(tmpUrl, requestHeaders));
      if (method === 'PUT')
        Object.assign(
          data,
          await this.$http.put(tmpUrl, payload, requestHeaders)
        );
      if (method === 'POST')
        Object.assign(
          data,
          await this.$http.post(tmpUrl, payload, requestHeaders)
        );
      if (method === 'DELETE')
        Object.assign(data, await this.$http.delete(tmpUrl));

      if (!data) {
        throw new Error(
          `Error doing a request to ${tmpUrl}, method: ${method}.`
        );
      }

      if (data.error && data.error !== '0') {
        throw new Error(data.error);
      }

      return this.$q.resolve(data);
    } catch (error) {
      return this.$q.reject(error);
    }
  }
}
