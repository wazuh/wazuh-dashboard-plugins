/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import {
  PLUGIN_PLATFORM_INSTALLATION_USER,
  PLUGIN_PLATFORM_INSTALLATION_USER_GROUP,
  PLUGIN_PLATFORM_NAME,
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH,
} from '../../common/constants';
import { APIUserAllowRunAs } from '../services/cache-api-user-has-run-as';
import { log } from '../services/logger';
import { ManageHosts } from '../services/manage-hosts';
import { UpdateRegistry } from '../services/update-registry';

export class WazuhHostsCtrl {
  manageHosts: ManageHosts;
  updateRegistry: UpdateRegistry;
  constructor() {
    this.manageHosts = new ManageHosts();
    this.updateRegistry = new UpdateRegistry();
  }

  /**
   * This get all hosts entries in the wazuh.yml and the related info in the wazuh-registry.json
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * API entries
   */
  async getHostsEntries() {
    try {
      const removePassword = true;
      const hosts = await this.manageHosts.getHosts();
      const registry = await this.updateRegistry.getHosts();
      const result = await this.joinHostRegistry(
        hosts,
        registry,
        removePassword,
      );
      return result;
    } catch (error) {
      if (
        error &&
        error.message &&
        [
          'ENOENT: no such file or directory',
          WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH,
        ].every(text => error.message.includes(text))
      ) {
        throw new Error(`Error getting the hosts entries: The \'${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH}\' directory could not exist in your ${PLUGIN_PLATFORM_NAME} installation.
            If this doesn't exist, create it and give the permissions 'sudo mkdir ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH};sudo chown -R ${PLUGIN_PLATFORM_INSTALLATION_USER}:${PLUGIN_PLATFORM_INSTALLATION_USER_GROUP} ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH}'. After, restart the ${PLUGIN_PLATFORM_NAME} service.`);
      }
      log('wazuh-hosts:getHostsEntries', error.message || error);
      throw new Error(error);
    }
  }

  /**
   * Joins the hosts with the related information in the registry
   * @param {Object} hosts
   * @param {Object} registry
   * @param {Boolean} removePassword
   */
  async joinHostRegistry(
    hosts: any,
    registry: any,
    removePassword: boolean = true,
  ) {
    try {
      if (!Array.isArray(hosts)) {
        throw new Error('Hosts configuration error in wazuh.yml');
      }

      return await Promise.all(
        hosts.map(async h => {
          const id = Object.keys(h)[0];
          const api = Object.assign(h[id], { id: id });
          const host = Object.assign(api, registry[id]);
          // Add to run_as from API user. Use the cached value or get it doing a request
          host.allow_run_as = await APIUserAllowRunAs.check(id);
          if (removePassword) {
            delete host.password;
            delete host.token;
          }
          return host;
        }),
      );
    } catch (error) {
      throw new Error(error);
    }
  }
}
