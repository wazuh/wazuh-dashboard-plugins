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

type UiLogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Log levels the UI is allowed to write with. Any other value falls back to
 * `error` so the logger is never indexed with an arbitrary key.
 */
const ALLOWED_LOG_LEVELS: ReadonlySet<string> = new Set<UiLogLevel>([
  'error',
  'warn',
  'info',
  'debug',
]);

/**
 * Replace every C0 control character (0x00-0x1F) and DEL (0x7F) with a single
 * space so user-supplied text cannot forge or break log lines (CWE-117).
 * @param text text to sanitize
 * @returns sanitized text
 */
export const sanitizeLogText = (text: string): string =>
  // eslint-disable-next-line no-control-regex
  text.replace(/[\x00-\x1F\x7F]/g, ' ');

const resolveLogLevel = (level: unknown): UiLogLevel =>
  typeof level === 'string' && ALLOWED_LOG_LEVELS.has(level)
    ? (level as UiLogLevel)
    : 'error';

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
  createUiLogs(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const { location, message, level } = request.body;
      const loggerUI = context.wazuh.logger.get('ui');
      // The route schema already allow-lists `level`; this is defense in depth.
      const loggerLevel = resolveLogLevel(level);
      loggerUI[loggerLevel](
        `${sanitizeLogText(location)}: ${sanitizeLogText(message)}`,
      );
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
