/*
 * Wazuh app - Group handler service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class GroupHandler {
  constructor(apiReq) {
    this.apiReq = apiReq;
  }

  async removeAgentFromGroup(group, agentId) {
    try {
      const result = await this.apiReq.request('DELETE',`/agents/${agentId}/group/${group}`,{})
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async addAgentToGroup(group, agentId) {
    try {
      const result = await this.apiReq.request('PUT',`/agents/${agentId}/group/${group}`,{})
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async modifyGroup(group, content) {
    try {
      throw new Error('Not yet implemented');
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
