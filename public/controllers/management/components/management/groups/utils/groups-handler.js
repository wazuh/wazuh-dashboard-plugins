/*
 * Wazuh app - Ruleset handler service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../../../react-services/wz-request';

export default class GroupsHandler {
  /**
   * Save a new group
   * @param {String} name
   */
  static async saveGroup(name) {
    try {
      const result = await WzRequest.apiReq('PUT', `/agents/groups/${name}`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Delete a group
   * @param {String} name
   */
  static async deleteGroup(name) {
    try {
      const result = await WzRequest.apiReq('DELETE', '/agents/groups', {
        ids: name,
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get list agents in a group
   * @param {String} name
   */
  static async agentsGroup(name) {
    try {
      const result = await WzRequest.apiReq('GET', `/agents/groups/${name}`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get list groups
   * @param {String} name
   */
  static async listGroups(filters) {
    try {
      const result = await WzRequest.apiReq('GET', '/agents/groups', filters);
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
