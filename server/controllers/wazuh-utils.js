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

// Require some libraries
import { ErrorResponse } from './error-response';
import { getConfiguration } from '../lib/get-configuration';
import simpleTail from 'simple-tail';
import path from 'path';
import { UpdateConfigurationFile } from '../lib/update-configuration';
const updateConfigurationFile = new UpdateConfigurationFile();

export class WazuhUtilsCtrl {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Returns the wazuh.yml file parsed
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} Configuration File or ErrorResponse
   */
  getConfigurationFile(req, reply) {
    try {
      const configFile = getConfiguration();

      return {
        statusCode: 200,
        error: 0,
        data: configFile || {}
      };
    } catch (error) {
      return ErrorResponse(error.message || error, 3019, 500, reply);
    }
  }

  /**
   * Returns the wazuh.yml file in raw
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} Configuration File or ErrorResponse
   */
  async updateConfigurationFile(req, reply) {
    try {
      const result = updateConfigurationFile.updateConfiguration(req);
      return {
        statusCode: 200,
        error: 0,
        data: { needRestart: result.needRestart, needWait: result.needWait }
      };
    } catch (error) {
      return ErrorResponse(error.message || error, 3021, 500, reply);
    }
  }

  /**
   * Returns Wazuh app logs
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<String>} app logs or ErrorResponse
   */
  async getAppLogs(req, reply) {
    try {
      const lastLogs = await simpleTail(
        path.join(__dirname, '../../../../optimize/wazuh/logs/wazuhapp.log'),
        50
      );
      return lastLogs && Array.isArray(lastLogs)
        ? {
            error: 0,
            lastLogs: lastLogs.filter(
              item => typeof item === 'string' && item.length
            )
          }
        : { error: 0, lastLogs: [] };
    } catch (error) {
      return ErrorResponse(error.message || error, 3036, 500, reply);
    }
  }
}
