/*
 * Wazuh app - Status handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
      const result = await WzRequest.apiReq('GET', `/agents/summary/status`, {});
      return result;
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  /**
   * Get node node_id’s status
   */
  static async clusterNodeStatus(nodeId) {
    try {
      const result = await WzRequest.apiReq(
        'GET',
        `/cluster/${nodeId}/status`,
        {}
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get node_id’s information
   */
  static async clusterNodeInfo(nodeId) {
    try {
      const result = await WzRequest.apiReq(
        'GET',
        `/cluster/${nodeId}/info`,
        {}
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get agents node count
   */
  static async clusterAgentsCount() {
    try {
      const result = await WzRequest.apiReq(
        'GET',
        `/overview/agents`,
        {}
      );
      return result;
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  /**
   * Get last agent
   */
  static async lastAgentRaw() {
    try {
      const result = await WzRequest.apiReq('GET', '/agents', {
        params: {
          limit: 1,
          sort: '-dateAdd',
          q: 'id!=000'
        }
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart cluster
   */
  static async restartCluster() {
    try {
      const validationError = await WzRequest.apiReq(
        'GET',
        `/cluster/configuration/validation`,
        {}
      );

      const data = ((validationError || {}).data || {}).data || {};
      const isOk = data.status === 'OK';
      if (!isOk && Array.isArray(data.details)) {
        const str = data.details.join();
        throw new Error(str);
      }
      await WzRequest.apiReq('PUT', `/cluster/restart`, { delay: 15000 });
      return { data: { data: 'Restarting cluster' } };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restart manager (single-node API call)
   */
  static async restartManager() {
    try {
      const validationError = await WzRequest.apiReq(
        'GET',
        `/manager/configuration/validation`,
        {}
      );

      const data = ((validationError || {}).data || {}).data || {};
      const isOk = data.status === 'OK';
      if (!isOk && Array.isArray(data.details)) {
        const str = data.details.join();
        throw new Error(str);
      }

      const result = await WzRequest.apiReq('PUT', `/manager/restart`, {});
      return result;
    } catch (error) {
      throw error;
    }
  }
}
