/*
 * Wazuh app - Groups handler service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import {
  WzRequest
} from '../../../../../../react-services/wz-request';

export default class GroupsHandler {
  /**
   * Save a new group
   * @param {String} name
   */
  static async saveGroup(name) {
    try {
      const result = await WzRequest.apiReq('POST', `/groups`, {
        params: {
          group_id: name
        }
      });
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
      const result = await WzRequest.apiReq('DELETE', `/groups`, {
        params: {
          groups_list: name
        }
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Remove a single group of an agent
   * @param {String} agentId
   * @param {String} groupId
   */
  static async deleteAgent(agentId, groupId) {
    try {
      const result = await WzRequest.apiReq(
        'DELETE',
        `/agents/${agentId}/group/${groupId}`,
        {}
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get list agents in a group
   * @param {String} name
   */
  static async agentsGroup(name, filters) {
    try {
      const result = await WzRequest.apiReq('GET', `/groups/${name}/agents`, filters);
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get files in a group
   * @param {String} name
   */
  static async filesGroup(name, filters) {
    try {
      const result = await WzRequest.apiReq('GET', `/groups/${name}/files`, filters);
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
      const result = await WzRequest.apiReq('GET', '/groups', filters);
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the content of groups files
   * @param {String} path
   */
  static async getFileContent(path) {
    try {
      const result = await WzRequest.apiReq('GET', path, {});
      return ((result || {}).data) || false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Send the file content
   * @param {String} fileName
   * @param {String} groupId
   * @param {String} content
   */
  static async sendGroupConfiguration(fileName, groupId, content) {
    try {
      const result = await WzRequest.apiReq('PUT', `/groups/${groupId}/configuration`, {
        body: content,
        origin: 'xmleditor'
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
