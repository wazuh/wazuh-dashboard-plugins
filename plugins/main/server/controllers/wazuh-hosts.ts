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
}
