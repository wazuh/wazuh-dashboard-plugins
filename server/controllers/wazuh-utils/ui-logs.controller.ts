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
import { read } from 'read-last-lines';
import { WAZUH_UI_LOGS_RAW_PATH } from '../../../common/constants';
import { KibanaRequest, KibanaResponseFactory } from 'src/core/server';
import uiLogger from '../../lib/ui-logger';

export class UiLogsCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor() {}

  /**
   * Returns Wazuh ui logs
   * @param {Object} response
   * @returns {Array<String>} app logs or ErrorResponse
   */
  async getUiLogs(response: KibanaResponseFactory) {
    try {
      return uiLogger.initDirectory().then(async () => {
        if (!uiLogger.checkFileExist(WAZUH_UI_LOGS_RAW_PATH)) {
          return response.ok({
            body: {
              error: 0,
              rawLogs: [],
            },
          });
        } else {
          let arrayLog = await this.getUiFileLogs(WAZUH_UI_LOGS_RAW_PATH);
          return response.ok({
            body: {
              error: 0,
              rawLogs: arrayLog.filter((item) => typeof item === 'string' && item.length),
            },
          });
        }
      });
    } catch (error) {
      return ErrorResponse(error.message || error, 3036, 500, response);
    }
  }

  /**
   * Add new UI Log entry in ui logs file
   * @param request
   * @param response
   * @returns success message or ErrorResponse
   */
  async createUiLogs(request: KibanaRequest, response: KibanaResponseFactory) {
    try {
      const { location, message, level } = request.body;
      await uiLogger.log(location, message, level);
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

  /**
   * Get UI logs from specific log file
   * @param filepath
   * @returns Array
   */
  async getUiFileLogs(filepath) {
    try {
      const lastLogs = await read(filepath, 50);
      return lastLogs.split('\n');
    } catch (err) {
      throw err;
    }
  }
}
