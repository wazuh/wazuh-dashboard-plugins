/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2015-2021 Wazuh, Inc.
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
import { read } from 'read-last-lines';
import {  WAZUH_UI_LOGS_RAW_PATH } from '../../../common/constants';
import { KibanaRequest, RequestHandlerContext, KibanaResponseFactory } from 'src/core/server';
import { addUiLog } from '../../lib/ui-logger';

export class UiLogsCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor() {}

    /**
   * Returns Wazuh frontend logs
   * @param {Object} context 
   * @param {Object} request
   * @param {Object} response
   * @returns {Array<String>} app logs or ErrorResponse
   */
    async getUiLogs(context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) {
      try {
        const lastLogs = await read(
            WAZUH_UI_LOGS_RAW_PATH,
          50
        );
        const spliterLog = lastLogs.split('\n');
        return spliterLog && Array.isArray(spliterLog)
          ? response.ok({
            body: {
              error: 0,
              lastLogs: spliterLog.filter(
                item => typeof item === 'string' && item.length
              )
            }
          })
          : response.ok({ error: 0, lastLogs: [] });
      } catch (error) {
        return ErrorResponse(error.message || error, 3036, 500, response);
      }
    }

    async updateUiLogs(context: RequestHandlerContext,request: KibanaRequest,response: KibanaResponseFactory) {
      try {
        await addUiLog(request.body.location, request.body.message, request.body.level);
        return response.ok({
          body: {
            message: 'Log has been added',
          },
        });
      } catch (error) {
        return ErrorResponse(error.message || error, 3021, 500, response);
      }
    }
}
