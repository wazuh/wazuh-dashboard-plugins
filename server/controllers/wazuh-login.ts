/*
 * Wazuh app - Class for Wazuh login functions
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import {} from '../lib/get-configuration';
import { ApiInterceptor } from '../lib/api-interceptor';
import { ISecurityFactory, SecurityObj } from '../lib/security-factory';

export class WazuhLoginCtrl {
  static PLATFORM?: 'xpack' | 'opendistro';
  server; 
  securityObj: ISecurityFactory;
  apiInterceptor: ApiInterceptor;

  constructor(server) {
    this.server = server;
    WazuhLoginCtrl.PLATFORM = this.getCurrentPlatform(server);
    this.securityObj = SecurityObj(WazuhLoginCtrl.PLATFORM, server);
    this.apiInterceptor = new ApiInterceptor();
  }

  getCurrentPlatform(server) {
    if (server.plugins.security) {
      return 'xpack';
    }
    if (server.plugins.opendistro_security) {
      return 'opendistro';
    }
    return undefined;
  }

  async getToken(req, reply) {
    try {
      const { idHost } = req.payload;
      const authContext = await this.securityObj.getCurrentUser(req);
      const token = await this.apiInterceptor.authenticateApi(idHost, authContext)
      return { token };
    } catch (error){
      console.log("error", error)
      // log('wazuh-elastic:getCurrentUser', error.message || error);
      // return ErrorResponse(error.message || error, 4011, 500, reply);
    }
  }

  
}