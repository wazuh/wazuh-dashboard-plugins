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
import { WAZUH_DATA_CONFIG_REGISTRY_PATH } from '../../common/constants';
import { Logger } from 'opensearch-dashboards/server';

/**
 * This service updates the registry file
 */
export class UpdateRegistry {
  busy: boolean;
  file: string;
  constructor(private logger: Logger) {
    this.busy = false;
    this.file = WAZUH_DATA_CONFIG_REGISTRY_PATH;
  }

  /**
   * Reads the Wazuh registry content
   */
  async readContent() {
    try {
      this.logger.debug('Reading registry file');
      const content = await fs.readFileSync(this.file, { encoding: 'utf-8' });
      return JSON.parse(content);
    } catch (error) {
      this.logger.error(error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Get the hosts and their cluster info stored in the registry
   */
  async getHosts() {
    try {
      this.logger.debug('Getting hosts from registry', 'debug');
      const content = await this.readContent();
      return content.hosts || {};
    } catch (error) {
      this.logger.error(error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Writes the wazuh-registry.json
   * @param {Object} content
   */
  async writeContent(content) {
    try {
      this.logger.debug('Writing wazuh-registry.json content');
      if (this.busy) {
        throw new Error('Another process is updating the registry file');
      }
      this.busy = true;
      await fs.writeFileSync(this.file, JSON.stringify(content));
      this.busy = false;
    } catch (error) {
      this.logger.error(error.message || error);
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
      this.logger.debug(`API ${id} information was properly updated`);
      return id;
    } catch (error) {
      this.logger.error(error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Remove the given ids from the registry host entries
   * @param {Array} ids
   */
  async removeHostEntries(ids) {
    try {
      this.logger.debug('Removing entry');
      const content = await this.readContent();
      ids.forEach(id => delete content.hosts[id]);
      await this.writeContent(content);
    } catch (error) {
      this.logger.error(error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Compare the hosts from wazuh.yml and the host in the wazuh-registry.json file in order to remove the orphan registry register
   * @param {Array} hosts
   */
  async removeOrphanEntries(hosts) {
    try {
      this.logger.debug('Checking orphan registry entries');
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
      this.logger.error(error.message || error);
      return Promise.reject(error);
    }
  }
}
