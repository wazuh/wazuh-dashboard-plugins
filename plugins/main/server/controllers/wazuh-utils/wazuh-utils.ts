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
import jwtDecode from 'jwt-decode';
import { WAZUH_ROLE_ADMINISTRATOR_ID } from '../../../common/constants';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from 'src/core/server';
import { getCookieValueByName } from '../../lib/cookie';
import fs from 'fs';
import path from 'path';
import { createDirectoryIfNotExists } from '../../lib/filesystem';
import glob from 'glob';
import { getFileExtensionFromBuffer } from '../../../common/services/file-extension';

// TODO: these controllers have no logs. We should include them.
export class WazuhUtilsCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor() {}

  /**
   * Returns the wazuh.yml file parsed
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
  async getConfigurationFile(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      context.wazuh.logger.debug('Getting configuration');
      const configuration = await context.wazuh_core.configuration.get();
      context.wazuh.logger.debug(
        `Configuration: ${JSON.stringify(configuration)}`,
      );
      return response.ok({
        body: {
          statusCode: 200,
          error: 0,
          data: configuration,
        },
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
  updateConfigurationFile =
    this.routeDecoratorProtectedAdministratorRoleValidToken(
      async (
        context: RequestHandlerContext,
        request: OpenSearchDashboardsRequest,
        response: OpenSearchDashboardsResponseFactory,
      ) => {
        // TODO: add validation of body
        let requiresRunningHealthCheck = false,
          requiresReloadingBrowserTab = false,
          requiresRestartingPluginPlatform = false;

        context.wazuh.logger.debug(
          `Updating configuration: ${JSON.stringify(request.body)}`,
        );

        const updatedSettings = {
          ...request.body,
        };
        context.wazuh.logger.debug(
          `Updating configuration with ${JSON.stringify(updatedSettings)}`,
        );
        const pluginSettings = await context.wazuh_core.configuration.set(
          updatedSettings,
        );
        context.wazuh.logger.debug('Configuration updated');

        // TODO: this doesn't support the update of hosts
        requiresRunningHealthCheck =
          Object.keys(request.body).some((pluginSettingKey: string) =>
            Boolean(
              context.wazuh_core.configuration._settings.get(pluginSettingKey)
                .requiresRunningHealthCheck,
            ),
          ) || requiresRunningHealthCheck;
        requiresReloadingBrowserTab =
          Object.keys(request.body).some((pluginSettingKey: string) =>
            Boolean(
              context.wazuh_core.configuration._settings.get(pluginSettingKey)
                .requiresReloadingBrowserTab,
            ),
          ) || requiresReloadingBrowserTab;
        requiresRestartingPluginPlatform =
          Object.keys(request.body).some((pluginSettingKey: string) =>
            Boolean(
              context.wazuh_core.configuration._settings.get(pluginSettingKey)
                .requiresRestartingPluginPlatform,
            ),
          ) || requiresRestartingPluginPlatform;

        return response.ok({
          body: {
            data: {
              requiresRunningHealthCheck,
              requiresReloadingBrowserTab,
              requiresRestartingPluginPlatform,
              updatedConfiguration: pluginSettings,
            },
          },
        });
      },
      3021,
    );

  /**
   * Upload a file
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
  uploadFile = this.routeDecoratorProtectedAdministratorRoleValidToken(
    async (
      context: RequestHandlerContext,
      request: KibanaRequest,
      response: KibanaResponseFactory,
    ) => {
      const { key } = request.params;
      const { file: bufferFile } = request.body;

      const pluginSetting = context.wazuh_core.configuration._settings.get(key);

      // Check file extension
      const fileExtension = getFileExtensionFromBuffer(bufferFile);

      // Check if the extension is valid for the setting.
      if (
        !pluginSetting.options.file.extensions.includes(`.${fileExtension}`)
      ) {
        return response.badRequest({
          body: `File extension is not valid for setting [${key}] setting. Allowed file extensions: ${pluginSetting.options.file.extensions.join(
            ', ',
          )}`,
        });
      }

      const fileNamePath = `${key}.${fileExtension}`;

      // Create target directory
      const targetDirectory = path.join(
        __dirname,
        '../../..',
        pluginSetting.options.file.store.relativePathFileSystem,
      );
      context.wazuh.logger.debug(`Directory: ${targetDirectory}`);
      createDirectoryIfNotExists(targetDirectory);
      // Get the files related to the setting and remove them
      const files = glob.sync(path.join(targetDirectory, `${key}.*`));
      context.wazuh.logger.debug(
        `Removing previous files: ${files.join(', ')}`,
      );
      files.forEach(fs.unlinkSync);

      // Store the file in the target directory.
      const storeFilePath = path.join(targetDirectory, fileNamePath);
      context.wazuh.logger.debug(`Storing file on : ${files.join(', ')}`);
      fs.writeFileSync(storeFilePath, bufferFile);

      // Update the setting in the configuration cache
      const pluginSettingValue =
        pluginSetting.options.file.store.resolveStaticURL(fileNamePath);
      const updatedConfiguration = {
        [key]: pluginSettingValue,
      };
      await context.wazuh_core.configuration.set(updatedConfiguration);

      return response.ok({
        body: {
          data: {
            requiresRunningHealthCheck: Boolean(
              pluginSetting.requiresRunningHealthCheck,
            ),
            requiresReloadingBrowserTab: Boolean(
              pluginSetting.requiresReloadingBrowserTab,
            ),
            requiresRestartingPluginPlatform: Boolean(
              pluginSetting.requiresRestartingPluginPlatform,
            ),
            updatedConfiguration,
          },
        },
      });
    },
    3022,
  );

  /**
   * Delete a file
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Configuration File or ErrorResponse
   */
  deleteFile = this.routeDecoratorProtectedAdministratorRoleValidToken(
    async (
      context: RequestHandlerContext,
      request: KibanaRequest,
      response: KibanaResponseFactory,
    ) => {
      const { key } = request.params;
      const pluginSetting = context.wazuh_core.configuration._settings.get(key);

      // Get the files related to the setting and remove them
      const targetDirectory = path.join(
        __dirname,
        '../../..',
        pluginSetting.options.file.store.relativePathFileSystem,
      );
      context.wazuh.logger.debug(`Directory: ${targetDirectory}`);
      const files = glob.sync(path.join(targetDirectory, `${key}.*`));
      context.wazuh.logger.debug(
        `Removing previous files: ${files.join(', ')}`,
      );
      files.forEach(fs.unlinkSync);

      // Update the setting in the configuration cache
      const pluginSettingValue = pluginSetting.defaultValue;
      const updatedConfiguration = {
        [key]: pluginSettingValue,
      };
      await context.wazuh_core.configuration.clean(key);

      return response.ok({
        body: {
          message:
            'All files were removed and the configuration file was updated.',
          data: {
            requiresRunningHealthCheck: Boolean(
              pluginSetting.requiresRunningHealthCheck,
            ),
            requiresReloadingBrowserTab: Boolean(
              pluginSetting.requiresReloadingBrowserTab,
            ),
            requiresRestartingPluginPlatform: Boolean(
              pluginSetting.requiresRestartingPluginPlatform,
            ),
            updatedConfiguration,
          },
        },
      });
    },
    3023,
  );

  private routeDecoratorProtectedAdministratorRoleValidToken(
    routeHandler,
    errorCode: number,
  ) {
    return async (context, request, response) => {
      try {
        // Check if user has administrator role in token
        const token = getCookieValueByName(request.headers.cookie, 'wz-token');
        if (!token) {
          return ErrorResponse('No token provided', 401, 401, response);
        }
        const decodedToken = jwtDecode(token);
        if (!decodedToken) {
          return ErrorResponse('No permissions in token', 401, 401, response);
        }
        if (
          !decodedToken.rbac_roles ||
          !decodedToken.rbac_roles.includes(WAZUH_ROLE_ADMINISTRATOR_ID)
        ) {
          return ErrorResponse('No administrator role', 401, 401, response);
        }
        // Check the provided token is valid
        const apiHostID = getCookieValueByName(
          request.headers.cookie,
          'wz-api',
        );
        if (!apiHostID) {
          return ErrorResponse('No API id provided', 401, 401, response);
        }
        const responseTokenIsWorking =
          await context.wazuh.api.client.asCurrentUser.request(
            'GET',
            '/',
            {},
            { apiHostID },
          );
        if (responseTokenIsWorking.status !== 200) {
          return ErrorResponse('Token is not valid', 401, 401, response);
        }
        return await routeHandler(context, request, response);
      } catch (error) {
        return ErrorResponse(error.message || error, errorCode, 500, response);
      }
    };
  }
}
