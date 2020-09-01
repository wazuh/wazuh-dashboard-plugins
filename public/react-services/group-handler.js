/*
 * Wazuh app - Group handler service
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

export class GroupHandler {
  static async removeGroup(group) {
    try {
      const result = await WzRequest.apiReq(
        'DELETE',
        `/agents/groups/${group}`,
        {}
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async removeAgentFromGroup(group, agentId) {
    try {
      const result = await WzRequest.apiReq(
        'DELETE',
        `/agents/${agentId}/group/${group}`,
        {}
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async addAgentToGroup(group, agentId) {
    try {
      const result = await WzRequest.apiReq(
        'PUT',
        `/agents/${agentId}/group/${group}`,
        {}
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async sendConfiguration(group, content) {
    try {
      const result = await WzRequest.apiReq(
        'POST',
        `/agents/groups/${group}/files/agent.conf`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async createGroup(name) {
    try {
      const result = await WzRequest.apiReq(
        'PUT',
        `/agents/groups/${name}`,
        {}
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
