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

import WzRequest from './wz-request';
import AppState from './app-state';
import jwtDecode from 'jwt-decode';
import store from '../redux/store';
import { updateUserPermissions, updateUserRoles } from '../redux/actions/appStateActions';
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../util/constants';
import { getToasts } from '../kibana-services';

const login = async (force = false) => {
  try {
    var idHost = JSON.parse(AppState.getCurrentAPI().toString()).id;
    while (!idHost) {
      await new Promise((r) => setTimeout(r, 500));
      idHost = JSON.parse(AppState.getCurrentAPI().toString()).id;
    }
    const response = await WzRequest.genericReq('POST', '/api/login', { idHost, force });
    const token = ((response || {}).data || {}).token;
    return token as string;
  } catch (error) {
    return Promise.reject(error);
  }
};
const refresh = async (force = false) => {
  try {
    // Get user token
    const token: string = await login(force);
    if (!token) {
      return;
    }
    // Decode token and get expiration time
    const jwtPayload = jwtDecode(token);

    // Get user Policies
    const userPolicies = await getUserPolicies();
    // Dispatch actions to set permissions and roles
    store.dispatch(updateUserPermissions(userPolicies));
    store.dispatch(updateUserRoles(mapUserRolesIDToAdministratorRole(jwtPayload.rbac_roles || [])));
  } catch (error) {
    getToasts().add({
      color: 'danger',
      title: 'Error getting the authorization token',
      text: error.message || error,
      toastLifeTimeMs: 300000,
    });
    return Promise.reject(error);
  }
};
const getUserPolicies = async () => {
  try {
    var idHost = JSON.parse(AppState.getCurrentAPI().toString()).id;
    while (!idHost) {
      await new Promise((r) => setTimeout(r, 500));
      idHost = JSON.parse(AppState.getCurrentAPI().toString()).id;
    }
    const response = await WzRequest.apiReq('GET', '/security/users/me/policies', { idHost });
    const policies = ((response || {}).data || {}).data || {};
    return policies;
  } catch (error) {
    return Promise.reject(error);
  }
};
const mapUserRolesIDToAdministratorRole = (roles) => {
  return roles.map((role: number) =>
    role === WAZUH_ROLE_ADMINISTRATOR_ID ? WAZUH_ROLE_ADMINISTRATOR_NAME : role
  );
};
const logout = () => {
  //TODO: logout
};

export default {
  login,
  refresh,
  getUserPolicies,
  mapUserRolesIDToAdministratorRole,
  logout,
};
