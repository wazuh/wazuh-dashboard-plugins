/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import { log } from './logger';
import { WAZUH_DATA_CONFIG_REGISTRY_PATH } from '../../common/constants';

export class UpdateRegistry {
  busy: boolean;
  file: string;
  constructor() {
    this.busy = false;
    this.file = WAZUH_DATA_CONFIG_REGISTRY_PATH;
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
      return Promise.reject(error);
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
   * Migrates the cluster information and extensions associated to an API id
   * @param {String} id
   * @param {Object} clusterInfo
   * @param {Object} clusterExtensions
   */
  async migrateToRegistry(id, clusterInfo, clusterExtensions) {
    try {
      const content = await this.readContent();
      if (!Object.keys(content).includes('hosts')) Object.assign(content, { hosts: {} });
      const info = { cluster_info: clusterInfo, extensions: clusterExtensions };
      content.hosts[id] = info;
      await this.writeContent(content);
      log('update-registry:migrateToRegistry', `API ${id} was properly migrated`, 'debug');
      return info;
    } catch (error) {
      log('update-registry:migrateToRegistry', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates the cluster-information or manager-information in the registry
   * @param {String} id
   * @param {Object} clusterInfo
   */
  async updateClusterInfo(id, clusterInfo) {
    try {
      const content = await this.readContent();
      // Checks if not exists in order to create
      if (!content.hosts[id]) content.hosts[id] = {};
      content.hosts[id].cluster_info = clusterInfo;
      await this.writeContent(content);
      log(
        'update-registry:updateClusterInfo',
        `API ${id} information was properly updated`,
        'debug'
      );
      return id;
    } catch (error) {
      log('update-registry:updateClusterInfo', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates the cluster-information or manager-information in the registry
   * @param {String} id
   * @param {Object} clusterInfo
   */
  async updateAPIExtensions(id, extensions) {
    try {
      const content = await this.readContent();
      if(content.hosts[id]) content.hosts[id].extensions = extensions;
      await this.writeContent(content);
      log(
        'update-registry:updateAPIExtensions',
        `API ${id} extensions were properly updated`,
        'debug'
      );
      return id;
    } catch (error) {
      log('update-registry:updateAPIHostname', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Remove the given ids from the registry host entries
   * @param {Array} ids
   */
  async removeHostEntries(ids) {
    try {
      log('update-registry:removeHostEntry', 'Removing entry', 'debug');
      const content = await this.readContent();
      ids.forEach(id => delete content.hosts[id]);
      await this.writeContent(content);
    } catch (error) {
      log('update-registry:removeHostEntry', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Compare the hosts from wazuh.yml and the host in the wazuh-registry.json file in order to remove the orphan registry register
   * @param {Array} hosts
   */
  async removeOrphanEntries(hosts) {
    try {
      log('update-registry:removeOrphanEntries', 'Checking orphan registry entries', 'debug');
      const entries = await this.getHosts();
      const hostsKeys = hosts.map(h => {
        return h.id;
      });
      const entriesKeys = Object.keys(entries);
      const diff = entriesKeys.filter(e => {
        return !hostsKeys.includes(e);
      });
      await this.removeHostEntries(diff);
    } catch (error) {
      log('update-registry:removeOrphanEntries', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Returns the token information associated to an API id
   * @param {String} id
   */
  async getTokenById(id) {
    try {
      if (!id) throw new Error('API id is missing');
      const hosts = await this.getHosts();
      return hosts[id] ? hosts[id].token || null : null;
    } catch (error) {
      log('update-registry:getTokenById', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Updates the token in the registry
   * @param {String} id
   * @param {String} token
   */
  async updateTokenByHost(id, token) {
    try {
      const content = await this.readContent();
      // Checks if not exists in order to create
      if (!content.hosts[id]) content.hosts[id] = {};
      content.hosts[id].token = token;
      await this.writeContent(content);
      log('update-registry:updateToken', `API ${id} information was properly updated`, 'debug');
      return id;
    } catch (error) {
      log('update-registry:updateToken', error.message || error);
      return Promise.reject(error);
    }
  }
}
