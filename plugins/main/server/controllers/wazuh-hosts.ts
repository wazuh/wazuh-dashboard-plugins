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
import { routeDecoratorProtectedAdministrator } from './decorators';

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
}
