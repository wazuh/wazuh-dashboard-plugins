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
import { ManageHosts } from '../lib/manage-hosts';


export class WazuhLoginCtrl {
  static PLATFORM?: 'xpack' | 'opendistro';
  server; 
  securityObj: ISecurityFactory;
  apiInterceptor: ApiInterceptor;
  manageHosts: ManageHosts;

  constructor(server) {
    this.server = server;
    this.manageHosts = new ManageHosts();
    WazuhLoginCtrl.PLATFORM = this.getCurrentPlatform(server);
    this.securityObj = SecurityObj(WazuhLoginCtrl.PLATFORM, server);
    this.apiInterceptor = new ApiInterceptor();
  }

  async checkWazuhWui(apiId){
    const host = await this.manageHosts.getHostById(apiId);
    if(host && host.username === 'wazuh-wui') return true;
    return false;
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
      const authContext = await this.securityObj.getCurrentUser(req);
      if(req.headers.cookie && !req.payload.initial){
        const getWzToken = /.*wz-token=([^;]+)/;
        const wzToken = req.headers.cookie.match(getWzToken)
        if(wzToken && wzToken.length && wzToken[1]) return {token :wzToken[1], test: true}
      }
      const { idHost } = req.payload;
      const isWazuhWui = await this.checkWazuhWui(idHost);
      let token;
      if(isWazuhWui){
        token = await this.apiInterceptor.authenticateApi(idHost, authContext)
      }else{
        token = await this.apiInterceptor.authenticateApi(idHost)
      }
      const response = reply.response({token})
      response.state('wz-token', token, {isSecure: false, path: '/'})
      response.state('wz-user', token, {isSecure: false, path: '/'})

      return { token };
    } catch (error){
      console.log("error", error)
      // log('wazuh-elastic:getCurrentUser', error.message || error);
      // return ErrorResponse(error.message || error, 4011, 500, reply);
    }
  }

  
}