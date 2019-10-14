/*
 * Wazuh app - API request service
 * Copyright (C) 2015-2019 Wazuh, Inc.
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

export class WzRequest {
  /**
   * Perform an API request
   * @param {String} method Eg. GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} body Request body
   */
  static async request(method, path, body) {
    try {
      if (!method || !path || !body) {
        throw new Error('Missing parameters');
      }
      const url = chrome.addBasePath('/api/request');
      const id = this.getCookie('API').id;
      const requestData = { method, path, body, id };
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
        data: requestData,
        url: url,
        timeout: 20000
      };
      
      const data = await axios(options);
      if (data.error) {
        throw new Error(data.error);
      }
      
      return Promise.resolve(data);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(error.data.message)
        : Promise.reject(error.message || error);
    }
  }

  /**
   * Gets the current API in order to get the credentials from it
   * @param {String} cookieName
   */
  static getCookie(cookieName) {
    try {
      const value = "; " + document.cookie;
      const parts = value.split("; " + cookieName + "=");
      const cookie = parts.length === 2 ? parts.pop().split(';').shift() : false;
      if (cookie && decodeURIComponent(cookie)) {
        const decode = decodeURIComponent(cookie);
        try {
          return JSON.parse(JSON.parse(decode));
        } catch(error) {
          return decode;
        }
      } else {
        throw `Cannot get ${cookieName}`;
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
