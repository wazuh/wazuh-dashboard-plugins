/*
 * Wazuh app - Group handler service
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
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';

export class GroupHandler {
  static async removeGroup(group) {
    try {
      const result = await WzRequest.apiReq('DELETE', `/agents/groups/${group}`, {});
      return result;
    } catch (error) {
      const options = {
        context: `${GroupHandler.name}.removeGroup`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error removing selected group`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  static async removeAgentFromGroup(group, agentId) {
    try {
      const result = await WzRequest.apiReq('DELETE', `/agents/${agentId}/group/${group}`, {});
      return result;
    } catch (error) {
      const options = {
        context: `${GroupHandler.name}.removeAgentFromGroup`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error removing selected agent`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  static async addAgentToGroup(group, agentId) {
    try {
      const result = await WzRequest.apiReq('PUT', `/agents/${agentId}/group/${group}`, {});
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async sendConfiguration(group, content) {
    try {
      const result = await WzRequest.apiReq('POST', `/agents/groups/${group}/files/agent.conf`, {
        content,
        origin: 'xmleditor',
      });
      return result;
    } catch (error) {
      const options = {
        context: `${GroupHandler.name}.sendConfiguration`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error sending configuration to selected group`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  static async createGroup(name) {
    try {
      const result = await WzRequest.apiReq('PUT', `/agents/groups`, {
        content: { group_id: name },
      });
      return result;
    } catch (error) {
      throw error;
    }
  }
}
