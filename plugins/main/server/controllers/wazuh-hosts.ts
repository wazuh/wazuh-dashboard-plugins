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
   * Create or update the API host data stored in the configuration.
   * Allow partial updates.
   * @param context
   * @param request
   * @param response
   * @returns
   */
  createAPIHost = routeDecoratorProtectedAdministrator(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      try {
        const { id } = request.params;
        context.wazuh.logger.debug(`Creating API host with ID [${id}]`);

        const responseSetHost = await context.wazuh_core.manageHosts.create(
          id,
          request.body,
        );

        context.wazuh.logger.info(`Created API host with ID [${id}]`);

        return response.ok({
          body: {
            message: `API host with ID [${id}] was created`,
            data: responseSetHost,
          },
        });
      } catch (error) {
        context.wazuh.logger.error(error.message || error);
        return ErrorResponse(
          `Could not create the API host: ${error.message || error}`,
          2014,
          500,
          response,
        );
      }
    },
    2014,
  );

  /**
   * Create or update the API host data stored in the configuration.
   * Allow partial updates.
   * @param context
   * @param request
   * @param response
   * @returns
   */
  updateAPIHost = routeDecoratorProtectedAdministrator(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      try {
        const { id: originalID } = request.params;
        context.wazuh.logger.debug(`Updating API host with ID [${originalID}]`);

        const responseSetHost = await context.wazuh_core.manageHosts.update(
          originalID,
          request.body,
        );

        context.wazuh.logger.info(`Updated API host with ID [${originalID}]`);

        return response.ok({
          body: {
            message: `API host with ID [${originalID}] was updated`,
            data: responseSetHost,
          },
        });
      } catch (error) {
        context.wazuh.logger.error(error.message || error);
        return ErrorResponse(
          `Could not update the API host: ${error.message || error}`,
          2015,
          500,
          response,
        );
      }
    },
    2015,
  );

  /**
   * Delete an API host from the configuration
   * @param context
   * @param request
   * @param response
   * @returns
   */
  deleteAPIHost = routeDecoratorProtectedAdministrator(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
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
          `Could not remove the API host: ${error.message || error}`,
          2015,
          500,
          response,
        );
      }
    },
    2016,
  );
}
