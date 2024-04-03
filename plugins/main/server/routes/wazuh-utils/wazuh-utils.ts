/*
 * Wazuh app - Module for Wazuh utils routes
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhUtilsCtrl } from '../../controllers';
import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';
import {
  CUSTOMIZATION_ENDPOINT_PAYLOAD_UPLOAD_CUSTOM_FILE_MAXIMUM_BYTES,
  EpluginSettingType,
} from '../../../common/constants';

export function WazuhUtilsRoutes(router: IRouter, services) {
  const ctrl = new WazuhUtilsCtrl();

  // Returns the plugins configuration
  router.get(
    {
      path: '/utils/configuration',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.getConfiguration(context, request, response),
  );

  // Update the plugins configuration
  router.put(
    {
      path: '/utils/configuration',
      validate: {
        // body: schema.any(),
        body: (value, response) => {
          try {
            const validationSchema = Array.from(
              services.configuration._settings.entries(),
            )
              .filter(
                ([, { isConfigurableFromSettings }]) =>
                  isConfigurableFromSettings,
              )
              .reduce(
                (accum, [pluginSettingKey, pluginSettingConfiguration]) => ({
                  ...accum,
                  [pluginSettingKey]: schema.maybe(
                    schema.any({
                      validate: pluginSettingConfiguration.validate
                        ? pluginSettingConfiguration.validate.bind(
                            pluginSettingConfiguration,
                          )
                        : () => {},
                    }),
                  ),
                }),
                {},
              );
            const validation = schema.object(validationSchema).validate(value);
            return response.ok(validation);
          } catch (error) {
            return response.badRequest(error.message);
          }
        },
      },
    },
    async (context, request, response) =>
      ctrl.updateConfiguration(context, request, response),
  );

  // Upload an asset
  router.put(
    {
      path: '/utils/configuration/files/{key}',
      validate: {
        params: (value, response) => {
          const validationSchema = Array.from(
            services.configuration._settings.entries(),
          )
            // key parameter should be a plugin setting of `filepicker` type
            .filter(
              ([, { isConfigurableFromSettings, type }]) =>
                type === EpluginSettingType.filepicker &&
                isConfigurableFromSettings,
            )
            .map(([pluginSettingKey]) => schema.literal(pluginSettingKey));
          try {
            const validation = schema
              .object({ key: schema.oneOf(validationSchema) })
              .validate(value);
            return response.ok(validation);
          } catch (error) {
            return response.badRequest(error.message);
          }
        },
        body: schema.object({
          // file: buffer
          file: schema.buffer(),
        }),
      },
      options: {
        body: {
          maxBytes:
            CUSTOMIZATION_ENDPOINT_PAYLOAD_UPLOAD_CUSTOM_FILE_MAXIMUM_BYTES,
        },
      },
    },
    async (context, request, response) =>
      ctrl.uploadFile(context, request, response),
  );

  // Remove an asset
  router.delete(
    {
      path: '/utils/configuration/files/{key}',
      validate: {
        params: (value, response) => {
          const validationSchema = Array.from(
            services.configuration._settings.entries(),
          )
            // key parameter should be a plugin setting of `filepicker` type
            .filter(
              ([, { isConfigurableFromSettings, type }]) =>
                type === EpluginSettingType.filepicker &&
                isConfigurableFromSettings,
            )
            .map(([pluginSettingKey]) => schema.literal(pluginSettingKey));
          try {
            const validation = schema
              .object({ key: schema.oneOf(validationSchema) })
              .validate(value);
            return response.ok(validation);
          } catch (error) {
            return response.badRequest(error.message);
          }
        },
      },
    },
    async (context, request, response) =>
      ctrl.deleteFile(context, request, response),
  );

  // Clear the configuration
  router.post(
    {
      path: '/utils/configuration/clear',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.clearConfiguration(context, request, response),
  );

  // Get if the current user is an administrator
  router.get(
    {
      path: '/utils/account',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.getPluginScopedAccount(context, request, response),
  );
}
