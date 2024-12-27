/*
 * Wazuh app - API status check service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WzMisc } from '../factories/misc';
import { getHttp } from '../kibana-services';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';
import { request } from '../services/request-handler';
import { WazuhConfig } from './wazuh-config';

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

      const url = getHttp().basePath.prepend('/api/check-stored-api');
      const options = {
        method: 'POST',
        headers: {
          ...PLUGIN_PLATFORM_REQUEST_HEADERS,
          'content-type': 'application/json',
        },
        url: url,
        data: payload,
        timeout: timeout || 20000,
      };
      const response = await request(options);

      if (response.error) {
        throw this.returnErrorInstance(response);
      }

      return response;
    } catch (error) {
      if (error.response) {
        const wzMisc = new WzMisc();

        wzMisc.setApiIsDown(true);

        const response = error.response.data?.message || error.message;

        throw this.returnErrorInstance(response);
      } else {
        return error?.message || false
          ? Promise.reject(this.returnErrorInstance(error, error.message))
          : Promise.reject(
              this.returnErrorInstance(
                error,
                error || 'Server did not respond',
              ),
            );
      }
    }
  }

  /**
   * Check the status of an API entry
   * @param {String} apiObject
   */
  static async checkApi(apiEntry, forceRefresh = false) {
    try {
      const wazuhConfig = new WazuhConfig();
      const { timeout } = wazuhConfig.getConfig();
      const url = getHttp().basePath.prepend('/api/check-api');
      const options = {
        method: 'POST',
        headers: {
          ...PLUGIN_PLATFORM_REQUEST_HEADERS,
          'content-type': 'application/json',
        },
        url: url,
        data: { ...apiEntry, forceRefresh },
        timeout: timeout || 20000,
      };
      const response = await request(options);

      if (response.error) {
        throw this.returnErrorInstance(response);
      }

      return response;
    } catch (error) {
      if (error.response) {
        const response = error.response?.data?.message || error.message;

        throw this.returnErrorInstance(response);
      } else {
        return error?.message || false
          ? Promise.reject(this.returnErrorInstance(error, error.message))
          : Promise.reject(
              this.returnErrorInstance(
                error,
                error || 'Server did not respond',
              ),
            );
      }
    }
  }

  /**
   * Customize message and return an error object
   * @param error
   * @param message
   * @returns error
   */
  static returnErrorInstance(error, message) {
    if (!error || typeof error === 'string') {
      return new Error(message || error);
    }

    error.message = message;

    return error;
  }
}
