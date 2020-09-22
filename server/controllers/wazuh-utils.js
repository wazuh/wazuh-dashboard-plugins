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
import { read } from 'read-last-lines';
import path from 'path';
import { UpdateConfigurationFile } from '../lib/update-configuration';
import jwtDecode from 'jwt-decode';
import { WAZUH_ROLE_ADMINISTRATOR_ID } from '../../util/constants';
import { ManageHosts } from '../lib/manage-hosts';
import { ApiInterceptor } from '../lib/api-interceptor';
const updateConfigurationFile = new UpdateConfigurationFile();

export class WazuhUtilsCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor(server) {
    this.manageHosts = new ManageHosts();
    this.apiInterceptor = new ApiInterceptor();
  }

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
      // Check if user has administrator role in token
      const token = req.state['wz-token'];
      if(!token){
        return ErrorResponse('No token provided', 401, 401, reply);
      };
      const decodedToken = jwtDecode(token);
      if(!decodedToken){
        return ErrorResponse('No permissions in token', 401, 401, reply);
      };
      if(!decodedToken.rbac_roles || !decodedToken.rbac_roles.includes(WAZUH_ROLE_ADMINISTRATOR_ID)){
        return ErrorResponse('No administrator role', 401, 401, reply);
      };
      // Check the provided token is valid
      const idHost = req.state['wz-api'];
      if( !idHost ){
        return ErrorResponse('No API id provided', 401, 401, reply);
      };
      const api = await this.manageHosts.getHostById(idHost);
      const responseTokenIsWorking = await this.apiInterceptor.requestToken('GET', `${api.url}:${api.port}//`, {}, {idHost}, token);
      if(responseTokenIsWorking.status !== 200){
        return ErrorResponse('Token is not valid', 500, 500, reply);
      };
      const result = updateConfigurationFile.updateConfiguration(req);
      return {
        statusCode: 200,
        error: 0,
        data: result
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
      const lastLogs = await read(
        path.join(__dirname, '../../../../optimize/wazuh/logs/wazuhapp.log'),
        50
      );
      const spliterLog = lastLogs.split('\n');
      return spliterLog && Array.isArray(spliterLog)
        ? {
            error: 0,
            lastLogs: spliterLog.filter(
              item => typeof item === 'string' && item.length
            )
          }
        : { error: 0, lastLogs: [] };
    } catch (error) {
      return ErrorResponse(error.message || error, 3036, 500, reply);
    }
  }
}
