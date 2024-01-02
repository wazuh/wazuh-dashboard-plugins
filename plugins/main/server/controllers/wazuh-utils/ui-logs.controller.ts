/*
 * Wazuh app - Class for UI Logs functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require some libraries
import { ErrorResponse } from '../../lib/error-response';
import {
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
} from 'src/core/server';

export class UiLogsCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor() {}

  /**
   * Add new UI Log entry to the platform logs
   * @param context
   * @param request
   * @param response
   * @returns success message or ErrorResponse
   */
  async createUiLogs(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const { location, message, level } = request.body;
      const loggerUI = context.wazuh.logger.get('ui');
      const loggerByLevel = loggerUI?.[level] || loggerUI.error;
      loggerByLevel(`${location}: ${message}`);
      return response.ok({
        body: {
          statusCode: 200,
          error: 0,
          message: 'Log has been added',
        },
      });
    } catch (error) {
      return ErrorResponse(error.message || error, 3021, 500, response);
    }
  }
}
