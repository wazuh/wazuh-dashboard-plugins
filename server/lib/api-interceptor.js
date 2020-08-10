/*
 * Wazuh app - Interceptor API entries
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
import {
  ManageHosts
} from './manage-hosts';
import {
  UpdateRegistry
} from './update-registry';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

export class ApiInterceptor {
  constructor() {
    this.manageHosts = new ManageHosts();
    this.updateRegistry = new UpdateRegistry();
  }

  async authenticateApi(idHost) {
    try {
      const api = await this.manageHosts.getHostById(idHost);
      const options = {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
        },
        auth: {
          username: api.username,
          password: api.password,
        },
        url: `${api.url}:${api.port}/v4/security/user/authenticate`,
      };

      const response = await axios(options);
      const token = response.data.token;
      await this.updateRegistry.updateTokenByHost(idHost, token);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async buildOptionsObject(method, path, data, options) {
    if (!options.idHost) {
      return {};
    }
    const idHost = options.idHost;
    let token = await this.updateRegistry.getTokenById(idHost);

    if (token === null) {
      await this.authenticateApi(idHost);
      token = await this.updateRegistry.getTokenById(idHost);
    }

    if (token !== null) {
      return {
        method: method,
        headers: {
          'content-type': options.content_type || 'application/json',
          Authorization: ' Bearer ' + token,
        },
        data: data.body || data || {},
        params: data.params || {},
        url: path,
      };
    } else {
      return null;
    }
  }

  async request(method, path, data, options, attempts = 3) {
    const optionsObject = await this.buildOptionsObject(method, path, data, options);

    if (optionsObject !== null) {
      return axios(optionsObject)
        .then(response => {
          return response;
        })
        .catch(async error => {
          if (attempts > 0 && error.response) {
            if (error.response.status === 401) {
              const responseAuth = await this.authenticateApi(options.idHost);

              if (responseAuth.status === 200) {
                return this.request(method, path, data, options, attempts - 1);
              } else {
                return responseAuth;
              }
            }
            return error.response;
          } else {
            return {
              data: {
                detail: error.code,
              },
              status: 500,
            };
          }
        });
    } else {
      return {
        data: {
          detail: 'Error to create the options',
        },
        status: 500,
      };
    }
  }
}
