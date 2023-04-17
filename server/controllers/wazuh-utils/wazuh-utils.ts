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
import { WAZUH_ROLE_ADMINISTRATOR_ID, WAZUH_DATA_LOGS_RAW_PATH, PLUGIN_SETTINGS } from '../../../common/constants';
import { ManageHosts } from '../../lib/manage-hosts';
import { KibanaRequest, RequestHandlerContext, KibanaResponseFactory } from 'src/core/server';
import { getCookieValueByName } from '../../lib/cookie';
import fs from 'fs';
import path from 'path';
import { createDirectoryIfNotExists } from '../../lib/filesystem';
import glob from 'glob';
import { getFileExtensionFromBuffer } from '../../../common/services/file-extension';

const updateConfigurationFile = new UpdateConfigurationFile();

// TODO: these controllers have no logs. We should include them.
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
   updateConfigurationFile = this.routeDecoratorProtectedAdministratorRoleValidToken(
    async (context: RequestHandlerContext, request: KibanaRequest, response: KibanaResponseFactory) => {

      let requiresRunningHealthCheck: boolean = false,
          requiresReloadingBrowserTab: boolean = false,
          requiresRestartingPluginPlatform: boolean = false;

      // Plugin settings configurables in the configuration file.
      const pluginSettingsConfigurableFile = Object.keys(request.body)
        .filter(pluginSettingKey => PLUGIN_SETTINGS[pluginSettingKey].isConfigurableFromFile)
        .reduce((accum, pluginSettingKey: string) => ({...accum, [pluginSettingKey]: request.body[pluginSettingKey]}), {});

      if(Object.keys(pluginSettingsConfigurableFile).length){
        // Update the configuration file.
        await updateConfigurationFile.updateConfiguration(pluginSettingsConfigurableFile);

        requiresRunningHealthCheck = Object.keys(pluginSettingsConfigurableFile).some((pluginSettingKey: string) => Boolean(PLUGIN_SETTINGS[pluginSettingKey].requiresRunningHealthCheck)) || requiresRunningHealthCheck;
        requiresReloadingBrowserTab = Object.keys(pluginSettingsConfigurableFile).some((pluginSettingKey: string) => Boolean(PLUGIN_SETTINGS[pluginSettingKey].requiresReloadingBrowserTab)) || requiresReloadingBrowserTab;
        requiresRestartingPluginPlatform = Object.keys(pluginSettingsConfigurableFile).some((pluginSettingKey: string) => Boolean(PLUGIN_SETTINGS[pluginSettingKey].requiresRestartingPluginPlatform)) || requiresRestartingPluginPlatform;
      };

      return response.ok({
        body: {
          data: { requiresRunningHealthCheck, requiresReloadingBrowserTab, requiresRestartingPluginPlatform, updatedConfiguration: pluginSettingsConfigurableFile }
        }
      });
    },
    3021
  )

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
      const { file: bufferFile } = request.body;
      const pluginSetting = PLUGIN_SETTINGS[key];

      // Check file extension
      const fileExtension = getFileExtensionFromBuffer(bufferFile);

      // Check if the extension is valid for the setting.
      if(!pluginSetting.options.file.extensions.includes(`.${fileExtension}`)){
        return response.badRequest({
          body: `File extension is not valid for setting [${key}] setting. Allowed file extensions: ${pluginSetting.options.file.extensions.join(', ')}`
        });
      };

      const fileNamePath = `${key}.${fileExtension}`;

      // Create target directory
      const targetDirectory = path.join(__dirname, '../../..', pluginSetting.options.file.store.relativePathFileSystem);
      createDirectoryIfNotExists(targetDirectory);
      // Get the files related to the setting and remove them
      const files = glob.sync(path.join(targetDirectory, `${key}.*`));
      files.forEach(fs.unlinkSync);

      // Store the file in the target directory.
      fs.writeFileSync(path.join(targetDirectory, fileNamePath), bufferFile);

      // Update the setting in the configuration cache
      const pluginSettingValue = pluginSetting.options.file.store.resolveStaticURL(fileNamePath);
      await updateConfigurationFile.updateConfiguration({[key]: pluginSettingValue});

      return response.ok({
        body: {
          data: {
            requiresRunningHealthCheck: Boolean(pluginSetting.requiresRunningHealthCheck),
            requiresReloadingBrowserTab: Boolean(pluginSetting.requiresReloadingBrowserTab),
            requiresRestartingPluginPlatform: Boolean(pluginSetting.requiresRestartingPluginPlatform),
            updatedConfiguration: {
              [key]: pluginSettingValue
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

      // Get the files related to the setting and remove them
      const targetDirectory = path.join(__dirname, '../../..', pluginSetting.options.file.store.relativePathFileSystem);
      const files = glob.sync(path.join(targetDirectory,`${key}.*`));
      files.forEach(fs.unlinkSync);

      // Update the setting in the configuration cache
      const pluginSettingValue = pluginSetting.defaultValue;
      await updateConfigurationFile.updateConfiguration({[key]: pluginSettingValue});

      return response.ok({
        body: {
          message: 'All files were removed and the configuration file was updated.',
          data: {
            requiresRunningHealthCheck: Boolean(pluginSetting.requiresRunningHealthCheck),
            requiresReloadingBrowserTab: Boolean(pluginSetting.requiresReloadingBrowserTab),
            requiresRestartingPluginPlatform: Boolean(pluginSetting.requiresRestartingPluginPlatform),
            updatedConfiguration: {
              [key]: pluginSettingValue
            }
          }
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
}
