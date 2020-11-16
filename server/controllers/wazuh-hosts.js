/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ManageHosts } from '../lib/manage-hosts';
import { UpdateRegistry } from '../lib/update-registry';
import { ApiInterceptor } from '../lib/api-interceptor';
import { log } from '../../server/logger';
import { ErrorResponse } from './error-response';
import { APIUserAllowRunAs } from '../lib/cache-api-user-has-run-as';

export class WazuhHostsCtrl {
  constructor() {
    this.manageHosts = new ManageHosts();
    this.updateRegistry = new UpdateRegistry();
    this.apiInterceptor = new ApiInterceptor();
  }

  /**
   * This get all hosts entries in the wazuh.yml and the related info in the wazuh-registry.json
   * @param {Object} req
   * @param {Object} reply
   * API entries or ErrorResponse
   */
  async getHostsEntries(req, reply, removePassword = true) {
    try {
      const hosts = await this.manageHosts.getHosts(removePassword);
      const registry = await this.updateRegistry.getHosts();
      const result = await this.joinHostRegistry(hosts, registry, removePassword);
      return result;
    } catch (error) {
      log('wazuh-hosts:getHostsEntries', error.message || error);
      const errorResponse = reply
        ? ErrorResponse(error.message || error, 2001, 500, reply)
        : error;
      return errorResponse;
    }
  }

  /**
   * Joins the hosts with the related information in the registry
   * @param {Object} hosts
   * @param {Object} registry
   */
  async joinHostRegistry(hosts, registry, removePassword = true) {
    try {
      if (!Array.isArray(hosts)) {
        throw new Error('Hosts configuration error in wazuh.yml');
      }

      return await Promise.all(hosts.map(async h => {
        const id = Object.keys(h)[0];
        const api = Object.assign(h[id], { id: id });
        const host = Object.assign(api, registry[id]);
        // Add to run_as from API user. Use the cached value or get it doing a request
        host.allow_run_as = await APIUserAllowRunAs.check(id);
        if (removePassword) {
          delete host.password;
          delete host.token;
        };
        return host;
      }));
    } catch (error) {
      throw new Error(error);
    }
  }
  /**
   * This update an API hostname
   * @param {Object} req
   * @param {Object} reply
   * Status response or ErrorResponse
   */
  async updateClusterInfo(req, reply) {
    try {
      const id = req.params.id;
      await this.updateRegistry.updateClusterInfo(id, req.payload.cluster_info);
      log(
        'wazuh-hosts:updateClusterInfo',
        `API entry ${req.params.id} hostname updated`,
        'debug'
      );
      return { statusCode: 200, message: 'ok' };
    } catch (error) {
      log('wazuh-hosts:updateClusterInfo', error.message || error);
      return ErrorResponse(
        `Could not update data in wazuh-registry.json due to ${error.message ||
          error}`,
        2012,
        500,
        reply
      );
    }
  }

  /**
   * Remove the orphan host entries in the registry
   * @param {Object} req
   * @param {Object} reply
   */
  async removeOrphanEntries(req, reply) {
    try {
      log('wazuh-hosts:cleanRegistry', 'Cleaning registry', 'debug');
      if (!req.payload && !req.payload.entries)
        throw new Error('No entries given to check');
      await this.updateRegistry.removeOrphanEntries(req.payload.entries);
      return { statusCode: 200, message: 'ok' };
    } catch (error) {
      log('wazuh-hosts:cleanRegistry', error.message || error);
      return ErrorResponse(
        `Could not clean entries in the wazuh-registry.json due to ${error.message ||
          error}`,
        2013,
        500,
        reply
      );
    }
  }
}
