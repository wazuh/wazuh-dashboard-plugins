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
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from 'src/core/server';
import { ErrorResponse } from '../lib/error-response';

export class WazuhHostsCtrl {
  constructor() {}

  /**
   * This get all hosts entries in the plugins configuration and the related info in the wazuh-registry.json
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * API entries or ErrorResponse
   */
  async getHostsEntries(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const result = await context.wazuh_core.manageHosts.getEntries({
        excludePassword: true,
      });
      return response.ok({
        body: result,
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 2001, 500, response);
    }
  }

  /**
   * This update an API hostname
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * Status response or ErrorResponse
   */
  async updateClusterInfo(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const { id } = request.params;
      const { cluster_info } = request.body;
      await context.wazuh_core.updateRegistry.updateClusterInfo(
        id,
        cluster_info,
      );
      context.wazuh.logger.info(`Server API host entry ${id} updated`);
      return response.ok({
        body: { statusCode: 200, message: 'ok' },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(
        `Could not update data in wazuh-registry.json due to ${
          error.message || error
        }`,
        2012,
        500,
        response,
      );
    }
  }

  /**
   * Remove the orphan host entries in the registry
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   */
  async removeOrphanEntries(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const { entries } = request.body;
      context.wazuh.logger.debug('Cleaning registry file');
      await context.wazuh_core.updateRegistry.removeOrphanEntries(entries);
      return response.ok({
        body: { statusCode: 200, message: 'ok' },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(
        `Could not clean entries in the wazuh-registry.json due to ${
          error.message || error
        }`,
        2013,
        500,
        response,
      );
    }
  }

  /**
   * Create or update the API host data stored in the configuration.
   * Allow partial updates.
   * @param context
   * @param request
   * @param response
   * @returns
   */
  async updateAPIHost(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      // TODO: refactor to use manageHost service
      const { id: originalID } = request.params;
      context.wazuh.logger.debug('Getting the API hosts');
      const hosts = await context.wazuh_core.configuration.get('hosts');
      context.wazuh.logger.debug(`API hosts data: ${JSON.stringify(hosts)}`);

      let newHosts = [...hosts];

      const hostExistIndex = newHosts.findIndex(({ id }) => id === originalID);
      if (hostExistIndex !== -1) {
        context.wazuh.logger.debug(`API host with ID [${originalID}] found`);
        context.wazuh.logger.debug(`Replacing API host ID [${originalID}]`);
        // Exist
        // Update the API host info
        newHosts = newHosts.map((item, index) =>
          index === hostExistIndex ? { ...item, ...request.body } : item,
        );
      } else {
        context.wazuh.logger.debug(
          `API host with ID [${originalID}] not found`,
        );
        // Not exist
        // Add new host
        context.wazuh.logger.debug(
          `Adding new API host with ID [${request.body.id}]`,
        );
        newHosts.push(request.body);
      }
      context.wazuh.logger.debug(
        `API hosts to save ${JSON.stringify(newHosts)}`,
      );
      await context.wazuh_core.configuration.set({
        hosts: newHosts,
      });
      context.wazuh.logger.info('API hosts saved');
      return response.ok({
        body: {
          message: `API host with ID [${originalID}] was ${
            hostExistIndex ? 'updated' : 'created'
          }`,
          data: request.body,
        },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(
        `Could not update the API host entry ${error.message || error}`,
        2014,
        500,
        response,
      );
    }
  }

  /**
   * Delete an API host from the configuration
   * @param context
   * @param request
   * @param response
   * @returns
   */
  async deleteAPIHost(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const { id: originalID } = request.params;
      context.wazuh.logger.debug(`Removing API host with ID [${originalID}]`);

      await context.wazuh_core.manageHosts.delete(originalID);

      context.wazuh.logger.info(`Removed API host with ID [${originalID}]`);
      return response.ok({
        body: {
          message: `API host with ID [${originalID}] was removed`,
        },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(
        `Could not remove the API host entry ${error.message || error}`,
        2015,
        500,
        response,
      );
    }
  }
}
