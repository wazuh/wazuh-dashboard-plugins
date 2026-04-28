/*
 * Wazuh app - Generic request
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ApiCheck } from './wz-api-check';
import { WzMisc } from '../factories/misc';
import { getHttp, getDataPlugin, getWazuhCorePlugin } from '../kibana-services';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';
import { request } from '../services/request-handler';
import NavigationService from './navigation-service';
import { AppState } from './app-state';

export class GenericRequest {
  /**
   * Generic request
   * @template T
   * @param {string} method
   * @param {string} path
   * @param {any} payload
   * @param {boolean} returnError
   * @returns {Promise<T>}
   */
  static async request(method, path, payload = null, returnError = false) {
    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }
      const timeout = await getWazuhCorePlugin().configuration.get('timeout');
      const requestHeaders = {
        ...PLUGIN_PLATFORM_REQUEST_HEADERS,
        'content-type': 'application/json',
      };
      const tmpUrl = getHttp().basePath.prepend(path);

      try {
        const patternId = AppState.getCurrentPattern();
        requestHeaders.pattern = (
          await getDataPlugin().indexPatterns.get(patternId)
        ).title;
      } catch (error) {}

      try {
        requestHeaders.id = JSON.parse(AppState.getCurrentAPI()).id;
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
          timeout: timeout,
        };
      }
      if (method === 'PUT') {
        options = {
          method: method,
          headers: requestHeaders,
          data: payload,
          url: tmpUrl,
          timeout: timeout,
        };
      }
      if (method === 'POST') {
        options = {
          method: method,
          headers: requestHeaders,
          data: payload,
          url: tmpUrl,
          timeout: timeout,
        };
      }
      if (method === 'DELETE') {
        options = {
          method: method,
          headers: requestHeaders,
          data: payload,
          url: tmpUrl,
          timeout: timeout,
        };
      }

      Object.assign(data, await request(options));
      if (!data) {
        throw new Error(
          `Error doing a request to ${tmpUrl}, method: ${method}.`,
        );
      }

      return data;
    } catch (err) {
      //if the requests fails, we need to check if the API is down
      const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (currentApi && currentApi.id) {
        try {
          await ApiCheck.checkStored(currentApi.id);
        } catch (err) {
          const wzMisc = new WzMisc();
          wzMisc.setApiIsDown(true);

          if (
            ['/settings'].every(
              pathname =>
                !NavigationService.getInstance()
                  .getPathname()
                  .startsWith(pathname),
            )
          ) {
            // TODO: manage the API is inaccessible.
          }
        }
      }
      if (returnError) return Promise.reject(err);
      return (((err || {}).response || {}).data || {}).message || false
        ? Promise.reject(new Error(err.response.data.message))
        : Promise.reject(err || new Error('Server did not respond'));
    }
  }
}
