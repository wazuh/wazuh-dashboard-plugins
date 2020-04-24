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
import { AppState } from './app-state';
import { GenericRequest } from './generic-request';

export class ApiRequest {
  /**
   * Perform an API request
   * @param {String} method Eg. GET, PUT
   * @param {String} path API route
   * @param {Object} body Request body
   */
  static async request(method, path, body) {
    try {
      if (!method || !path || !body) {
        throw new Error('Missing parameters');
      }

      if (!AppState.getCurrentAPI()) {
        throw new Error('No API selected.');
      }

      const { id } = JSON.parse(AppState.getCurrentAPI());
      const requestData = { method, path, body, id };

      const data = await GenericRequest.request(
        'POST',
        '/api/request',
        requestData
      );

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }
}
