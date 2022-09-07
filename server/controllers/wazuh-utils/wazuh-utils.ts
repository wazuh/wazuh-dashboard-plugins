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
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_DATA_LOGS_RAW_PATH, WAZUH_UI_LOGS_RAW_PATH, ASSETS_CUSTOM_FOLDER_NAME, ASSETS_CUSTOM_BY_TYPE, PLUGIN_SETTINGS } from '../../../common/constants';
import { ManageHosts } from '../../lib/manage-hosts';
import { KibanaRequest, RequestHandlerContext, KibanaResponseFactory } from 'src/core/server';
import { getCookieValueByName } from '../../lib/cookie';
import fs from 'fs';
import path from 'path';
import { createDirectoryIfNotExists } from '../../lib/filesystem';
import glob from 'glob';

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
  updateConfigurationFile = this.routeDecoratorProtectedAdministratorRoleValidToken(
    async (context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) => {

      let requireHealthCheck: boolean = false,
          requireReload: boolean = false,
          requireRestart: boolean = false;


      // Plugin settings configurables in the configuration file.
      const pluginSettingsConfigurableFile = Object.keys(request.body)
        .filter(pluginSettingKey => PLUGIN_SETTINGS[pluginSettingKey].configurableFile)
        .reduce((accum, pluginSettingKey: string) => ({...accum, [pluginSettingKey]: request.body[pluginSettingKey]}), {});

      if(Object.keys(pluginSettingsConfigurableFile).length){
        // Update the configuration file.
        await updateConfigurationFile.updateConfiguration(pluginSettingsConfigurableFile);
        
        requireHealthCheck = Object.keys(pluginSettingsConfigurableFile).some((pluginSettingKey: string) => Boolean(PLUGIN_SETTINGS[pluginSettingKey].requireHealthCheck)) || requireHealthCheck;
        requireReload = Object.keys(pluginSettingsConfigurableFile).some((pluginSettingKey: string) => Boolean(PLUGIN_SETTINGS[pluginSettingKey].requireReload)) || requireReload;
        requireRestart = Object.keys(pluginSettingsConfigurableFile).some((pluginSettingKey: string) => Boolean(PLUGIN_SETTINGS[pluginSettingKey].requireRestart)) || requireRestart;
      };

      return response.ok({
        body: {
          data: { requireHealthCheck, requireReload, requireRestart, updatedConfiguration: request.body }
        }
      });
    },
    3021
  )

  /**
   * Upload a file
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
   uploadFile = this.routeDecoratorProtectedAdministratorRoleValidToken(
    async (context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) => {
      const { key } = request.params;
      const { file: bufferFile, extension } = request.body;
      const pluginSetting = PLUGIN_SETTINGS[key];
      const targetDirectoryCustomTypeName = ASSETS_CUSTOM_BY_TYPE[pluginSetting.options.file.type];

      // Check if the extension is valid for the setting.
      if(!pluginSetting.options.file.extensions.includes(extension)){
        return response.badRequest({
          body: `File extension is not valid for this setting <${key}>. Allowed file extensions: ${pluginSetting.options.file.extensions.join(', ')}`
        });
      };

      const fileNamePath = `${key}${extension}`;
      
      // Generate the path to the target directory and create these don't exist.

      // public/assets
      const publicAssetsPath = path.join(__dirname, '../../../public/assets');
      createDirectoryIfNotExists(publicAssetsPath);
      // public/assets/custom
      const publicAssetsCustomPath = path.join(publicAssetsPath, ASSETS_CUSTOM_FOLDER_NAME);
      createDirectoryIfNotExists(publicAssetsCustomPath);
      // public/assets/custom/<asset_type>
      const publicAssetsCustomTypePath = path.join(publicAssetsCustomPath, targetDirectoryCustomTypeName);
      createDirectoryIfNotExists(publicAssetsCustomTypePath);


      // Get the files related to the setting and remove them
      const files = glob.sync(path.join(publicAssetsCustomTypePath,`${key}.*`));
      files.forEach(fs.unlinkSync);
      
      // Store the file in the target directory.
      fs.writeFileSync(path.join(publicAssetsCustomTypePath, fileNamePath), bufferFile);

      const pluginConfiguration = getConfiguration({force: true});

      return response.ok({
        body: {
          data: {
            requireHealthCheck: Boolean(pluginSetting.requireHealthCheck),
            requireReload: Boolean(pluginSetting.requireReload),
            requireRestart: Boolean(pluginSetting.requireRestart),
            updatedConfiguration: {
              [key]: pluginConfiguration[key]
            }
          }
        }
      });
    },
    3022
  )

  /**
   * Upload a file
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
   deleteFile = this.routeDecoratorProtectedAdministratorRoleValidToken(
    async (context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) => {
      const { key } = request.params;
      const pluginSetting = PLUGIN_SETTINGS[key];
      const targetDirectoryCustomTypeName = ASSETS_CUSTOM_BY_TYPE[pluginSetting.options.file.type];
      
      // Generate the path to the target directory and create these don't exist.

      // public/assets
      const publicAssetsPath = path.join(__dirname, '../../../public/assets');
      createDirectoryIfNotExists(publicAssetsPath);
      // public/assets/custom
      const publicAssetsCustomPath = path.join(publicAssetsPath, ASSETS_CUSTOM_FOLDER_NAME);
      createDirectoryIfNotExists(publicAssetsCustomPath);
      // public/assets/custom/<asset_type>
      const publicAssetsCustomTypePath = path.join(publicAssetsCustomPath, targetDirectoryCustomTypeName);
      createDirectoryIfNotExists(publicAssetsCustomTypePath);

      // Get the files related to the setting and remove them
      const files = glob.sync(path.join(publicAssetsCustomTypePath,`${key}.*`));
      files.forEach(fs.unlinkSync);

      return response.ok({
        body: {
          ok: true,
          message: 'All files were removed.'
        }
      });
    },
    3023
  )

  private routeDecoratorProtectedAdministratorRoleValidToken(routeHandler, errorCode: number){
    return async (context, request, response) => {
      try{
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
        };
        // Check the provided token is valid
        const apiHostID = getCookieValueByName(request.headers.cookie,'wz-api');
        if( !apiHostID ){
          return ErrorResponse('No API id provided', 401, 401, response);
        };
        const responseTokenIsWorking = await context.wazuh.api.client.asCurrentUser.request('GET', '/', {}, {apiHostID});
        if(responseTokenIsWorking.status !== 200){
          return ErrorResponse('Token is not valid', 401, 401, response);
        };
        return await routeHandler(context, request, response)
      }catch(error){
        return ErrorResponse(error.message || error, errorCode, 500, response);
      }
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
