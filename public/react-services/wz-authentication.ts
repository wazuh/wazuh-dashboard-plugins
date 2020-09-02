/*
 * Wazuh app - Authentication service for Wazuh
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from './wz-request';
import { AppState } from './app-state';
import { GenericRequest } from './generic-request';
import jwtDecode from 'jwt-decode';
import store from '../redux/store';
import { updateUserPermissions, updateUserRoles } from '../redux/actions/appStateActions';
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../util/constants';

const delay = (timeout: number) => new Promise(res => {refreshTimeout = setTimeout(res, timeout)});

export let userToken;
let refreshTimeout;
const marginSeconds = 0;

export class WzAuthentication{
  static getToken(){
    return userToken;
  }
  private static async login(force=false){
    try{
      const idHost = JSON.parse(AppState.getCurrentAPI()).id;
      if(!idHost){
        const response = await GenericRequest.request('GET', '/hosts/apis');
        const hosts = response.data;
        for(var i=0; i< hosts.length; i++){
          const loginResponse =  await WzRequest.genericReq('POST', '/api/login', { idHost: hosts[i].id, force});
          return ((loginResponse || {}).data || {}).token;
        }
    }else{
      const response = await WzRequest.genericReq('POST', '/api/login', { idHost, force });
      return response.data.token as string;
    }
    }catch(error){
      console.log("error", error)
      return Promise.reject(error);
    }
  }
  static async refresh(force = false){
    try{
      // Get user token
      const token: string = await WzAuthentication.login(force);

      // Decode token and get expiration time
      userToken = jwtDecode(token);
      // Dispatch actions to set permissions and roles
      store.dispatch(updateUserPermissions(userToken.rbac_policies));
      store.dispatch(updateUserRoles(WzAuthentication.mapUserRolesIDToAdministratorRole(userToken.rbac_roles)));
      
    }catch(error){
      return Promise.reject(error);
    }
  }
  private static mapUserRolesIDToAdministratorRole(roles){
    return roles.map((role: number) => role === WAZUH_ROLE_ADMINISTRATOR_ID ? WAZUH_ROLE_ADMINISTRATOR_NAME : role);
  }
  static cancelRefresh(){
    clearTimeout(refreshTimeout);
  }
  static logout(){
    //TODO: logout
  }
}