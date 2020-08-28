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
import jwtDecode from 'jwt-decode';
import store from '../redux/store';
import { updateUserPermissions, updateUserRoles } from '../redux/actions/appStateActions';

const delay = (timeout: number) => new Promise(res => {refreshTimeout = setTimeout(res, timeout)});

export let userToken;
let refreshTimeout;
const marginSeconds = 0;

export class WzAuthentication{
  static getToken(){
    return userToken;
  }
  private static async login(){
    try{
      const idHost = JSON.parse(AppState.getCurrentAPI()).id;
      const response = await WzRequest.genericReq('GET', '/wz-login/login', { idHost });
      return response.data.token as string;
    }catch(error){
      return Promise.reject(error);
    }
  }
  static async refresh(){
    try{
      // Get user token
      const token: string = await WzAuthentication.login();
      console.log('refresh token', token)

      // Decode token and get expiration time
      userToken = jwtDecode(token);
      const expirationTime = (userToken.exp - (Date.now() / 1000) - marginSeconds) as number;
      console.log(userToken.exp, Date.now() / 1000, userToken.exp - (Date.now() / 1000))
      
      // Dispatch actions to set permissions and roles
      store.dispatch(updateUserPermissions(userToken.rbac_policies));
      store.dispatch(updateUserRoles(userToken.rbac_roles));
      
      // Wait to next expiration time and call itself recursively
      await delay(expirationTime*1000);
      await WzAuthentication.refresh();
    }catch(error){
      return Promise.reject(error);
    }
  }
  static cancelRefresh(){
    clearTimeout(refreshTimeout);
  }
  static logout(){
    //TODO: logout
  }
}