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
import { ManageHosts } from './manage-hosts';
import { UpdateRegistry } from './update-registry';

export class ApiInterceptor {
  constructor() {
    this.manageHosts = new ManageHosts();
    this.updateRegistry = new UpdateRegistry();
  }

  async authenticateApi(idHost) {
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
      url: `${api.url}:${api.port}/security/user/authenticate`,
    };

    return axios(options)
      .then(response => {
        const token = response.data.token;
        this.updateRegistry.updateTokenByHost(idHost, token);
        return response;
      })
      .catch(error => {
        throw error;
      });
  }

  async buildOptionsObject(method, path, payload, idHost) {
    let token = await this.updateRegistry.getTokenById(idHost);

    if (token === null) {
      token = await this.authenticateApi(idHost);
      await this.updateRegistry.updateTokenByHost(idHost, token);
    }

    return {
      method: method,
      headers: {
        'content-type': 'application/json',
        Authorization: ' Bearer ' + token,
      },
      data: payload,
      url: path,
    };
  }

  async request(method, path, payload = {}, idHost, attempts = 3) {
    const options = await this.buildOptionsObject(method, path, payload, idHost);

    return axios(options)
      .then(response => {
        return response;
      })
      .catch(async error => {
        if (attempts > 0) {
          if (error.response.status === 401) {
            return this.authenticateApi(idHost)
              .then(response => {
                return this.request(method, path, payload, idHost, attempts - 1);
              })
              .catch(errorAuth => {
                return errorAuth.response;
              });
          }
        }
        return error.response;
      });
  }
}
