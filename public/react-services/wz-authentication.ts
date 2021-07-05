/*
 * Wazuh app - Authentication service for Wazuh
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
import {
  updateUserPermissions,
  updateUserRoles,
  updateWithUserLogged,
  updateAllowedAgents,
} from '../redux/actions/appStateActions';
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../common/constants';
import { getToasts } from '../kibana-services';
import { getAuthorizedAgents } from '../react-services/wz-agents';

export class WzAuthentication {
  private static async login(force = false) {
    try {
      var idHost = JSON.parse(AppState.getCurrentAPI()).id;
      while (!idHost) {
        await new Promise((r) => setTimeout(r, 500));
        idHost = JSON.parse(AppState.getCurrentAPI()).id;
      }

      const response = await WzRequest.genericReq('POST', '/api/login', { idHost, force });

      const token = ((response || {}).data || {}).token;
      return token as string;
    } catch (error) {
      throw error;
    }
  }
  static async refresh(force = false) {
    try {
      // Get user token
      const token: string = await WzAuthentication.login(force);
      if (!token) {
        // Remove old existent token
        await WzAuthentication.deleteExistentToken();
        return;
      }

      // Decode token and get expiration time
      const jwtPayload = jwtDecode(token);

      // Get user Policies
      const userPolicies = await WzAuthentication.getUserPolicies();

      //Get allowed agents for the current user
      let allowedAgents: any = [];
      if (WzAuthentication.userHasAgentsPermissions(userPolicies)) {
        allowedAgents = await getAuthorizedAgents();
        allowedAgents = allowedAgents.length ? allowedAgents : ['-1']; // users without read:agent police should not view info about any agent
      }
      store.dispatch(updateAllowedAgents(allowedAgents));

      // Dispatch actions to set permissions and roles
      store.dispatch(updateUserPermissions(userPolicies));
      store.dispatch(
        updateUserRoles(
          WzAuthentication.mapUserRolesIDToAdministratorRole(jwtPayload.rbac_roles || [])
        )
      );
      store.dispatch(updateWithUserLogged(true));
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error getting the authorization token',
        text: error.message || error,
        toastLifeTimeMs: 300000,
      });
      store.dispatch(updateWithUserLogged(true));
      return Promise.reject(error);
    }
  }
  private static async getUserPolicies() {
    try {
      var idHost = JSON.parse(AppState.getCurrentAPI()).id;
      while (!idHost) {
        await new Promise((r) => setTimeout(r, 500));
        idHost = JSON.parse(AppState.getCurrentAPI()).id;
      }
      const response = await WzRequest.apiReq('GET', '/security/users/me/policies', { idHost });
      const policies = ((response || {}).data || {}).data || {};
      return policies;
    } catch (error) {
      throw error;
    }
  }

  private static mapUserRolesIDToAdministratorRole(roles) {
    return roles.map((role: number) =>
      role === WAZUH_ROLE_ADMINISTRATOR_ID ? WAZUH_ROLE_ADMINISTRATOR_NAME : role
    );
  }

  static async deleteExistentToken() {
    try {
      const response = await WzRequest.apiReq('DELETE', '/security/user/authenticate', {});

      return ((response || {}).data || {}).data || {};
    } catch (error) {
      throw error;
    }
  }

  /**
   * This function returns true only if the user has some police that need be filtered.
   * Returns false if the user has permission for all agents.
   * Returns true if the user has no one police for agent:read.
   * @param policies
   * @returns boolean
   */
  static userHasAgentsPermissions(policies) {
    const agentReadPolicies = policies['agent:read'];
    if (agentReadPolicies) {
      const allIds = agentReadPolicies['agent:id:*'] == 'allow';
      const allGroups = agentReadPolicies['agent:group:*'] == 'allow';
      const denyAgents = Object.keys(agentReadPolicies).some(
        (k) => !k.includes('*') && agentReadPolicies[k] == 'deny'
      );
      return !((allIds || allGroups) && !denyAgents);
    }
    // users without read:agent police should not view info about any agent
    return true;
  }
}
