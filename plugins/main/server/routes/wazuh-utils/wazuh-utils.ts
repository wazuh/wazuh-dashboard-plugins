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
  PLUGIN_SETTINGS,
} from '../../../common/constants';

export function WazuhUtilsRoutes(router: IRouter, services) {
  const ctrl = new WazuhUtilsCtrl();

  // Returns the wazuh.yml file parsed
  router.get(
    {
      path: '/utils/configuration',
      validate: false,
    },
    async (context, request, response) =>
      ctrl.getConfiguration(context, request, response),
  );

  // Returns the wazuh.yml file in raw
  router.put(
    {
      path: '/utils/configuration',
      validate: {
        // body: schema.any(),
        body: (value, response) => {
          const validationSchema = Array.from(
            services.configuration._settings.entries(),
          )
            .filter(([, { isConfigurableFromFile }]) => isConfigurableFromFile)
            .reduce(
              (accum, [pluginSettingKey, pluginSettingConfiguration]) => ({
                ...accum,
                [pluginSettingKey]: schema.maybe(
                  pluginSettingConfiguration.validateBackend
                    ? pluginSettingConfiguration.validateBackend(schema)
                    : schema.any(),
                ),
              }),
              {},
            );
          try {
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

  // TODO: remove the usage of static plugin settings
  const pluginSettingsTypeFilepicker = Object.entries(PLUGIN_SETTINGS).filter(
    ([_, { type, isConfigurableFromFile }]) =>
      type === EpluginSettingType.filepicker && isConfigurableFromFile,
  );

  const schemaPluginSettingsTypeFilepicker = schema.oneOf(
    pluginSettingsTypeFilepicker.map(([pluginSettingKey]) =>
      schema.literal(pluginSettingKey),
    ),
  );

  // Upload an asset
  router.put(
    {
      path: '/utils/configuration/files/{key}',
      validate: {
        // params: schema.object({
        //   // key parameter should be a plugin setting of `filepicker` type
        //   key: schemaPluginSettingsTypeFilepicker,
        // }),
        params: (value, response) => {
          const validationSchema = Array.from(
            services.configuration._settings.entries(),
          )
            // key parameter should be a plugin setting of `filepicker` type
            .filter(
              ([, { isConfigurableFromFile, type }]) =>
                type === EpluginSettingType.filepicker &&
                isConfigurableFromFile,
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
        // params: schema.object({
        //   // key parameter should be a plugin setting of `filepicker` type
        //   key: schemaPluginSettingsTypeFilepicker,
        // }),
        params: (value, response) => {
          const validationSchema = Array.from(
            services.configuration._settings.entries(),
          )
            // key parameter should be a plugin setting of `filepicker` type
            .filter(
              ([, { isConfigurableFromFile, type }]) =>
                type === EpluginSettingType.filepicker &&
                isConfigurableFromFile,
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
}
