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
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../util/constants';
import { toastNotifications } from 'ui/notify';


export class WzAuthentication{
  private static async login(force=false){
    try{
      var idHost = JSON.parse(AppState.getCurrentAPI()).id;
      while(!idHost){
        await new Promise(r => setTimeout(r, 500));
        idHost = JSON.parse(AppState.getCurrentAPI()).id;
      }
      const response = await WzRequest.genericReq('POST', '/api/login', { idHost, force });
      const token = ((response || {}).data || {}).token;
      return token as string;
    }catch(error){
      return Promise.reject(error);
    }
  }
  static async refresh(force = false){
    try{
      // Get user token
      const token: string = await WzAuthentication.login(force);
      if(!token){
        return;
      }
      // Decode token and get expiration time
      const jwtPayload = jwtDecode(token);
      
      // Get user Policies
      const userPolicies = await WzAuthentication.getUserPolicies();
      // Dispatch actions to set permissions and roles
      store.dispatch(updateUserPermissions(userPolicies));
      store.dispatch(updateUserRoles(WzAuthentication.mapUserRolesIDToAdministratorRole(jwtPayload.rbac_roles || [])));
    }catch(error){
      toastNotifications.add({
        color: 'danger',
        title: 'Error getting the authorization token',
        text: error.message || error,
        toastLifeTimeMs: 300000
      });
      return Promise.reject(error);
    }
  }
  private static async getUserPolicies(){
    try{
      var idHost = JSON.parse(AppState.getCurrentAPI()).id;
      while(!idHost){
        await new Promise(r => setTimeout(r, 500));
        idHost = JSON.parse(AppState.getCurrentAPI()).id;
      }
      const response = await WzRequest.apiReq('GET', '/security/users/me/policies', { idHost });
      const policies = ((response || {}).data || {}).data || {};
      return policies;
    }catch(error){
      return Promise.reject(error);
    }
  }
  private static mapUserRolesIDToAdministratorRole(roles){
    return roles.map((role: number) => role === WAZUH_ROLE_ADMINISTRATOR_ID ? WAZUH_ROLE_ADMINISTRATOR_NAME : role);
  }
  static logout(){
    //TODO: logout
  }
}