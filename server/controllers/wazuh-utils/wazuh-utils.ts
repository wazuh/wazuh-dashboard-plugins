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

// Require some libraries
import { ErrorResponse } from '../../lib/error-response';
import { getConfiguration } from '../../lib/get-configuration';
import { read } from 'read-last-lines';
import { UpdateConfigurationFile } from '../../lib/update-configuration';
import jwtDecode from 'jwt-decode';
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_DATA_LOGS_RAW_PATH, WAZUH_UI_LOGS_RAW_PATH } from '../../../common/constants';
import { ManageHosts } from '../../lib/manage-hosts';
import { KibanaRequest, RequestHandlerContext, KibanaResponseFactory } from 'src/core/server';
import { getCookieValueByName } from '../../lib/cookie';

const updateConfigurationFile = new UpdateConfigurationFile();

export class WazuhUtilsCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor() {
    this.manageHosts = new ManageHosts();
  }

  /**
   * Returns the wazuh.yml file parsed
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
  getConfigurationFile(context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) {
    try {
      const configFile = getConfiguration();

      return response.ok({
        body: {
          statusCode: 200,
          error: 0,
          data: configFile || {}
        }
      });
    } catch (error) {
      return ErrorResponse(error.message || error, 3019, 500, response);
    }
  }

  /**
   * Returns the wazuh.yml file in raw
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
  async updateConfigurationFile(context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) {
    try {
      // Check if user has administrator role in token
      const token = getCookieValueByName(request.headers.cookie,'wz-token');
      if(!token){
        return ErrorResponse('No token provided', 401, 401, response);
      };
      const decodedToken = jwtDecode(token);
      if(!decodedToken){
        return ErrorResponse('No permissions in token', 401, 401, response);
      };
      if(!decodedToken.rbac_roles || !decodedToken.rbac_roles.includes(WAZUH_ROLE_ADMINISTRATOR_ID)){
        return ErrorResponse('No administrator role', 401, 401, response);
      };response
      // Check the provided token is valid
      const apiHostID = getCookieValueByName(request.headers.cookie,'wz-api');
      if( !apiHostID ){
        return ErrorResponse('No API id provided', 401, 401, response);
      };
      const responseTokenIsWorking = await context.wazuh.api.client.asCurrentUser.request('GET', '/', {}, {apiHostID});
      if(responseTokenIsWorking.status !== 200){
        return ErrorResponse('Token is not valid', 401, 401, response);
      };
      const result = await updateConfigurationFile.updateConfiguration(request);
      return response.ok({
        body: {
          statusCode: 200,
          error: 0,
          data: result
        }
      });
    } catch (error) {
      return ErrorResponse(error.message || error, 3021, 500, response);
    }
  }

  /**
   * Returns Wazuh app logs
   * @param {Object} context 
   * @param {Object} request
   * @param {Object} response
   * @returns {Array<String>} app logs or ErrorResponse
   */
  async getAppLogs(context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) {
    try {
      const lastLogs = await read(
        WAZUH_DATA_LOGS_RAW_PATH,
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


}
