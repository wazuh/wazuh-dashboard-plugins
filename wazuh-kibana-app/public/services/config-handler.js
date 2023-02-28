/*
 * Wazuh app - Group handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WzRequest } from '../react-services/wz-request';
import { ErrorHandler } from '../react-services/error-handler';

export class ConfigHandler {
  constructor($rootScope, errorHandler) {
    this.$rootScope = $rootScope;
    this.errorHandler = errorHandler;
  }

  /**
   * Send ossec.conf content for manager (single-node API call)
   * @param {*} content XML raw content for ossec.conf file
   */
  async saveManagerConfiguration(content) {
    try {
      const result = await WzRequest.apiReq(
        'PUT',
        `/manager/configuration`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Send ossec.conf content for a cluster node
   * @param {*} node Node name
   * @param {*} content XML raw content for ossec.conf file
   */
  async saveNodeConfiguration(node, content) {
    try {
      const result = await WzRequest.apiReq(
        'PUT',
        `/cluster/${node}/configuration`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async performClusterRestart() {
    try {
      await WzRequest.apiReq('PUT', `/cluster/restart`, { delay: 15000 });
      this.$rootScope.$broadcast('removeRestarting', {});
    } catch (error) {
      this.$rootScope.$broadcast('removeRestarting', {});
      throw new Error('Error restarting cluster');
    }
  }

  /**
   * Restart manager (single-node API call)
   */
  async restartManager() {
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
      return Promise.reject(error);
    }
  }

  /**
   * Restart cluster
   */
  async restartCluster() {
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
      this.performClusterRestart();
      return { data: { data: 'Restarting cluster' } };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Restart a cluster node
   */
  async restartNode(node) {
    try {
      const validationError = await WzRequest.apiReq(
        'GET',
        `/cluster/${node}/configuration/validation`,
        {}
      );

      const data = ((validationError || {}).data || {}).data || {};
      const isOk = data.status === 'OK';
      if (!isOk && Array.isArray(data.details)) {
        const str = data.details.join();
        throw new Error(str);
      }
      const result = await WzRequest.apiReq(
        'PUT',
        `/cluster/${node}/restart`,
        {}
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
