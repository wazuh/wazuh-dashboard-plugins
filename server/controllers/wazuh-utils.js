/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2018 Wazuh, Inc.
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
import { totalmem } from 'os';
import simpleTail from 'simple-tail';
import path from 'path';

export class WazuhUtilsCtrl {
  constructor() {
  }

  getConfigurationFile(req, reply) {
    try {
      const configFile = getConfiguration();

      return reply({
        statusCode: 200,
        error: 0,
        data: configFile || {}
      });
    } catch (error) {
      return ErrorResponse(error.message || error, 3019, 500, reply);
    }
  }

  async totalRam(req, reply) {
    try {
      // RAM in MB
      const ram = Math.ceil(totalmem() / 1024 / 1024);
      return reply({ statusCode: 200, error: 0, ram });
    } catch (error) {
      return ErrorResponse(error.message || error, 3033, 500, reply);
    }
  }

  async getAppLogs(req, reply) {
    try {
      const lastLogs = await simpleTail(
        path.join(__dirname, '../../../../optimize/wazuh-logs/wazuhapp.log'),
        20
      );
      return lastLogs && Array.isArray(lastLogs)
        ? reply({
            error: 0,
            lastLogs: lastLogs.filter(
              item => typeof item === 'string' && item.length
            )
          })
        : reply({ error: 0, lastLogs: [] });
    } catch (error) {
      return ErrorResponse(error.message || error, 3036, 500, reply);
    }
  }
}
