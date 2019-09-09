/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import path from 'path';
import { log } from '../logger';

export class UpdateRegistry {
  constructor() {
    this.busy = false;
    this.file = path.join(__dirname, '../../server/wazuh-registry.json');
  }


  /**
   * Reads the Wazuh registry content
   */
  async readContent() {
    try {
      log('update-registry:readContent', 'Reading wazuh-registry.json content', 'debug');
      const content = await fs.readFileSync(this.file, { encoding: 'utf-8' });
      return JSON.parse(content);
    } catch (error) {
      log('update-registry:readContent', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Get the hosts and their cluster info stored in the registry
   */
  async getHosts() {
    try {
      log('update-registry:getHosts', 'Getting hosts from registry', 'debug');
      const content = await this.readContent();
      return content.hosts || {};
    } catch (error) {
      log('update-registry:getHosts', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
 * Returns the cluster information associated to an API id
 * @param {String} id 
 */
  async getHostById(id) {
    try {
      if (!id) throw new Error('API id is missing');
      const hosts = await this.getHosts();
      return hosts.id || {};
    } catch (error) {
      log('update-registry:getClusterInfoByAPI', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Writes the wazuh-registry.json
   * @param {Object} content 
   */
  async writeContent(content) {
    try {
      log('update-registry:writeContent', 'Writting wazuh-registry.json content', 'debug');
      if (this.busy) {
        throw new Error('Another process is updating the registry file');
      }
      this.busy = true;
      await fs.writeFileSync(this.file, JSON.stringify(content));
      this.busy = false;
    } catch (error) {
      log('update-registry:writeContent', error.message || error);
      return Promise.reject(error)
    }
  }

  /**
   * Checks if the host exist in order to update the data, otherwise creates it
   * @param {String} id 
   * @param {Object} hosts 
   */
  checkHost(id, hosts) {
    try {
      return Object.keys(hosts).includes(id);
    } catch (error) {
      log('update-registry:checkHost', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Uptades the cluster information and extensions associated with an API id
   * @param {String} id 
   * @param {Object} clusterInfo 
   * @param {Object} clusterExtensions 
   */
  async updateWazuhClusterInfo(id, clusterInfo, clusterExtensions) {
    try {
      const content = await this.readContent();
      if (!Object.keys(content).includes('hosts')) Object.assign(content, {hosts: {}});
      const info = { cluster_info: clusterInfo, extensions: clusterExtensions};
      content.hosts[`${id}`] = info;
      this.writeContent(content);
      log('update-registry:updateWazuhClusterInfo', `API ${id} was properly updated`, 'debug');
      return info;
    } catch (error) {
      log('update-registry:updateWazuhClusterInfo', error.message || error);
      return Promise.reject(error);
    }
  }
}