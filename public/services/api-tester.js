/*
 * Wazuh app - API test service
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

export class ApiTester {
  /**
   * Class constructor
   * @param {*} $http
   * @param {*} appState
   * @param {*} wzMisc
   * @param {*} wazuhConfig
   */
  constructor($http, appState, wzMisc, wazuhConfig) {
    this.$http = $http;
    this.appState = appState;
    this.wzMisc = wzMisc;
    this.wazuhConfig = wazuhConfig;
  }

  async checkStored(data) {
    try {
      const configuration = this.wazuhConfig.getConfig();
      const timeout = configuration ? configuration.timeout : 20000;
      const headers = {
        headers: { 'Content-Type': 'application/json' },
        timeout: timeout || 20000
      };

      const result = await this.$http.post(
        chrome.addBasePath('/api/check-stored-api'),
        data,
        headers
      );

      this.appState.setPatternSelector(configuration['ip.selector']);

      if (result.error) {
        return Promise.reject(result);
      }
      return result;
    } catch (error) {
      if (((error || {}).data || {}).code === 3099) {
        // Do nothing
        return 3099;
      }
      if (error.status && error.status === -1) {
        this.wzMisc.setApiIsDown(true);
      }
      return Promise.reject(error);
    }
  }

  async check(data) {
    try {
      const { timeout } = this.wazuhConfig.getConfig();

      const headers = {
        headers: { 'Content-Type': 'application/json' },
        timeout: timeout || 20000
      };

      const url = chrome.addBasePath('/api/check-api');
      const response = await this.$http.post(url, data, headers);

      if (response.error) {
        return Promise.reject(response);
      }

      return response;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
