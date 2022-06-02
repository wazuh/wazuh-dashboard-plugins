/*
 * Wazuh app - Acntion Agents Service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WzRequest } from './wz-request';
import { getToasts } from '../kibana-services';
import { API_NAME_AGENT_STATUS, UI_LOGGER_LEVELS } from '../../common/constants';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';

export class ActionAgents {
  static showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  /**
   * Upgrade unique agent to the latest version avaible.
   * @param {Number} agentId
   */
  static async upgradeAgent(agentId) {
    try {
      await WzRequest.apiReq('PUT', `/agents/${agentId}/upgrade`, {
        force: 1,
      });
      this.showToast('success', 'Upgrading agent...', '', 5000);
    } catch (error) {
      const options = {
        context: `${ActionAgents.name}.upgradeAgent`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error upgrading the agent`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Upgrade list of agents to the latest version avaible.
   * @param {Array} selectedItems
   */
  static async upgradeAgents(selectedItems) {
    for (let item of selectedItems.filter(
      (item) => item.outdated && item.status !== API_NAME_AGENT_STATUS.DISCONNECTED
    )) {
      try {
        await WzRequest.apiReq('PUT', `/agents/${item.id}/upgrade`, '1');
        this.showToast('success', 'Upgrading selected agents...', '', 5000);
      } catch (error) {
        const options = {
          context: `${ActionAgents.name}.upgradeAgents`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Error upgrading selected agents`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }
  }

  /**
   * Upgrade a list of agents to the latest version avaible.
   * @param {Array} selectedItems
   * @param {String} managerVersion
   */
  static async upgradeAllAgents(selectedItems, managerVersion) {
    selectedItems.forEach(async (agent) => {
      if (
        agent.id !== '000' &&
        this.compareVersions(agent.version, managerVersion) === true &&
        agent.status === API_NAME_AGENT_STATUS.ACTIVE
      ) {
        try {
          await WzRequest.apiReq('PUT', `/agents/${agent.id}/upgrade`, '1');
          this.showToast('success', 'Upgrading all agents...', '', 5000);
        } catch (error) {
          const options = {
            context: `${ActionAgents.name}.upgradeAllAgents`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            store: true,
            error: {
              error: error,
              message: error.message || error,
              title: `Error upgrading all the agents`,
            },
          };
          getErrorOrchestrator().handleError(options);
        }
      }
    });
  }

  /**
   * Restart an agent
   * @param {Number} agentId
   */
  static async restartAgent(agentId) {
    try {
      await WzRequest.apiReq('PUT', `/agents/restart`, { ids: agentId });
      this.showToast('success', 'Restarting agent...', '', 5000);
    } catch (error) {
      const options = {
        context: `${ActionAgents.name}.restartAgent`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error restarting agent`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Restart a list of agents
   * @param {Array} selectedItems
   */
  static async restartAgents(selectedItems) {
    const agentsId = selectedItems.map((item) => item.id);
    try {
      await WzRequest.apiReq('PUT', `/agents/restart`, { ids: [...agentsId] });
      this.showToast('success', 'Restarting selected agents...', '', 5000);
    } catch (error) {
      const options = {
        context: `${ActionAgents.name}.restartAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error restarting selected agents`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Restart a list of agents
   * @param {Array} selectedItems
   */
  static async restartAllAgents(selectedItems) {
    let idAvaibleAgents = [];
    selectedItems.forEach((agent) => {
      if (agent.id !== '000' && agent.status === API_NAME_AGENT_STATUS.ACTIVE) {
        idAvaibleAgents.push(agent.id);
      }
    });
    try {
      await WzRequest.apiReq('PUT', `/agents/restart`, { ids: [...idAvaibleAgents] });
      this.showToast('success', 'Restarting all agents...', '', 5000);
    } catch (error) {
      const options = {
        context: `${ActionAgents.name}.restartAllAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error restarting all agents`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * Delete an agent
   * @param {Number} selectedItems
   */
  static async deleteAgents(selectedItems) {
    const auxAgents = selectedItems
      .map((agent) => {
        return agent.id !== '000' ? agent.id : null;
      })
      .filter((agent) => agent !== null);
    try {
      await WzRequest.apiReq('DELETE', `/agents`, {
        purge: true,
        ids: auxAgents,
        older_than: '1s',
      });
      this.showToast('success', `Selected agents were successfully deleted`, '', 5000);
    } catch (error) {
      const options = {
        context: `${ActionAgents.name}.deleteAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Failed to delete selected agents`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  /**
   * This function compare version between any agents and master.
   * Return true if ManagerVersion > AgentVersion
   * @param {String} agentVersion
   * @param {String} managerVersion
   * @returns {Boolean}
   */
  static compareVersions(managerVersion, agentVersion) {
    let agentMatch = new RegExp(/[.+]?v(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/).exec(
      agentVersion
    );
    let managerMatch = new RegExp(/[.+]?v(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/).exec(
      managerVersion
    );
    if (agentMatch === null || managerMatch === null) return;
    return managerMatch[1] <= agentMatch[1]
      ? managerMatch[2] <= agentMatch[2]
        ? managerMatch[3] <= agentMatch[3]
          ? true
          : false
        : false
      : false;
  }
}
