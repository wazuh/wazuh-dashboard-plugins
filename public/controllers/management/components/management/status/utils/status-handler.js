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

export default class StatusHandler {
  /**
   * Get summary of agents
   */
  static async agentsSummary() {
    try {
      const result = await WzRequest.apiReq('GET', `/agents/summary`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get cluster status
   */
  static async clusterStatus() {
    try {
      const result = await WzRequest.apiReq('GET', `/cluster/status`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get cluster nodes
   */
  static async clusterNodes() {
    try {
      const result = await WzRequest.apiReq('GET', `/cluster/nodes`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get node node_id’s status
   */
  static async clusterNodeStatus(nodeId) {
    try {
      const result = await WzRequest.apiReq('GET', `/cluster/${nodeId}/status`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get node_id’s information
   */
  static async clusterNodeInfo(nodeId) {
    try {
      const result = await WzRequest.apiReq('GET', `/cluster/${nodeId}/info`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get manager info
   */
  static async managerInfo() {
    try {
      const result = await WzRequest.apiReq('GET', `/manager/info`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get manager status
   */
  static async managerStatus() {
    try {
      const result = await WzRequest.apiReq('GET', `/manager/status`, {});
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get last agent
   */
  static async lastAgentRaw() {
    try {
      const result = await WzRequest.apiReq('GET', '/agents', {
        limit: 1,
        sort: '-dateAdd',
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
