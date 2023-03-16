/*
 * Wazuh app - API request service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from './app-state';
import { ApiCheck } from './wz-api-check';
import { WzAuthentication } from './wz-authentication';
import { WzMisc } from '../factories/misc';
import { WazuhConfig } from './wazuh-config';
import IApiResponse from './interfaces/api-response.interface';
import { getHttp } from '../kibana-services';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';
import { request } from '../services/request-handler';

export class WzRequest {
  static wazuhConfig: any;

  /**
   * Permorn a generic request
   * @param {String} method
   * @param {String} path
   * @param {Object} payload
   */
  static async genericReq(
    method,
    path,
    payload: any = null,
    extraOptions: { shouldRetry?: boolean, checkCurrentApiIsUp?: boolean, overwriteHeaders?: any } = {
      shouldRetry: true, 
      checkCurrentApiIsUp: true,
      overwriteHeaders: {}
    }
  ) {
    const shouldRetry = typeof extraOptions.shouldRetry === 'boolean' ? extraOptions.shouldRetry : true; 
    const checkCurrentApiIsUp = typeof extraOptions.checkCurrentApiIsUp === 'boolean' ? extraOptions.checkCurrentApiIsUp : true;
    const overwriteHeaders = typeof extraOptions.overwriteHeaders === 'object' ? extraOptions.overwriteHeaders : {};
    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }
      this.wazuhConfig = new WazuhConfig();
      const configuration = this.wazuhConfig.getConfig();
      const timeout = configuration ? configuration.timeout : 20000;

      const url = getHttp().basePath.prepend(path);
      const options = {
        method: method,
        headers: { ...PLUGIN_PLATFORM_REQUEST_HEADERS, 'content-type': 'application/json', ...overwriteHeaders },
        url: url,
        data: payload,
        timeout: timeout,
      };

      const data = await request(options);

      if (data['error']) {
        throw new Error(data['error']);
      }

      return Promise.resolve(data);
    } catch (error) {
      //if the requests fails, we need to check if the API is down
      if(checkCurrentApiIsUp){
        const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
        if (currentApi && currentApi.id) {
          try {
            await ApiCheck.checkStored(currentApi.id);
          } catch (error) {
            const wzMisc = new WzMisc();
            wzMisc.setApiIsDown(true);
            if (!window.location.hash.includes('#/settings')) {
              window.location.href = getHttp().basePath.prepend('/app/wazuh#/health-check');
            }
            throw new Error(error);
          }
        }
      }
      const errorMessage =
        (error && error.response && error.response.data && error.response.data.message) ||
        (error || {}).message;
      if (
        typeof errorMessage === 'string' &&
        errorMessage.includes('status code 401') &&
        shouldRetry
      ) {
        try {
          await WzAuthentication.refresh(true);
          return this.genericReq(method, path, payload, { shouldRetry: false });
        } catch (error) {
          return ((error || {}).data || {}).message || false
            ? Promise.reject(this.returnErrorInstance(error, error.data.message))
            : Promise.reject(this.returnErrorInstance(error, error.message));
        }
      }
      return errorMessage
        ? Promise.reject(this.returnErrorInstance(error, errorMessage))
        : Promise.reject(this.returnErrorInstance(error,'Server did not respond'));
    }
  }

  /**
   * Perform a request to the Wazuh API
   * @param {String} method Eg. GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} body Request body
   */
  static async apiReq(
    method, 
    path, 
    body, 
    options: { checkCurrentApiIsUp?: boolean } = { checkCurrentApiIsUp: true }
  ): Promise<IApiResponse<any>> {
    try {
      if (!method || !path || !body) {
        throw new Error('Missing parameters');
      }      
      const id = JSON.parse(AppState.getCurrentAPI()).id;
      const requestData = { method, path, body, id };
      const response = await this.genericReq('POST', '/api/request', requestData, options);

      const hasFailed = (((response || {}).data || {}).data || {}).total_failed_items || 0;

      if (hasFailed) {
        const error =
          ((((response.data || {}).data || {}).failed_items || [])[0] || {}).error || {};
        const failed_ids =
          ((((response.data || {}).data || {}).failed_items || [])[0] || {}).id || {};
        const message = (response.data || {}).message || 'Unexpected error';
        const errorMessage = `${message} (${error.code}) - ${error.message} ${failed_ids && failed_ids.length > 1 ? ` Affected ids: ${failed_ids} ` : ''}`
        return Promise.reject(this.returnErrorInstance(null, errorMessage));
      }
      return Promise.resolve(response);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(this.returnErrorInstance(error, error.data.message))
        : Promise.reject(this.returnErrorInstance(error, error.message));
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
      const data = await this.genericReq('POST', '/api/csv', requestData);
      return Promise.resolve(data);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(this.returnErrorInstance(error, error.data.message))
        : Promise.reject(this.returnErrorInstance(error, error.message));
    }
  }

  /**
   * Customize message and return an error object
   * @param error 
   * @param message 
   * @returns error
   */
  static returnErrorInstance(error, message){
    if(!error || typeof error === 'string'){
      return new Error(message || error);
    }
    error.message = message
    return error
  }
}
