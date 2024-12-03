/*
 * Wazuh app - Check PluginPlatform settings service
 *
 * Copyright (C) 2015-2024 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { isEqual } from 'lodash';
import { IUiSettingsClient } from 'src/core/server';
import {
  InitializationTaskContext,
  InitializationTaskRunContext,
} from '../services';

const decoratorCheckIsEnabled =
  callback =>
  async (
    ctx: InitializationTaskRunContext,
    {
      configurationSetting,
      ...ctxTask
    }: { key: string; value: any; configurationSetting: string },
  ) => {
    if (await ctx.configuration.get(configurationSetting)) {
      await callback(ctx, ctxTask);
    } else {
      ctx.logger.info(`Check [${configurationSetting}]: disabled. Skipped.`);
    }
  };

function stringifySetting(setting: any) {
  try {
    return JSON.stringify(setting);
  } catch {
    return setting;
  }
}

async function updateSetting(
  uiSettingsClient: IUiSettingsClient,
  pluginPlatformSettingName: string,
  defaultAppValue: any,
  retries = 3,
): Promise<any> {
  return await uiSettingsClient
    .set(pluginPlatformSettingName, defaultAppValue)
    .catch(async error => {
      if (retries > 0) {
        return await updateSetting(
          uiSettingsClient,
          pluginPlatformSettingName,
          defaultAppValue,
          --retries,
        );
      }

      throw error;
    });
}

export const checkPluginPlatformSettings = decoratorCheckIsEnabled(
  async (
    {
      logger,
      uiSettingsClient,
    }: InitializationTaskRunContext & { uiSettingsClient: IUiSettingsClient },
    {
      key: pluginPlatformSettingName,
      value: defaultAppValue,
    }: { key: string; value: any },
  ) => {
    logger.debug(`Getting setting [${pluginPlatformSettingName}]...`);

    const valuePluginPlatformSetting = await uiSettingsClient.get(
      pluginPlatformSettingName,
    );
    const settingsAreDifferent = !isEqual(
      valuePluginPlatformSetting,
      defaultAppValue,
    );

    logger.debug(
      `Check setting [${pluginPlatformSettingName}]: ${stringifySetting(
        valuePluginPlatformSetting,
      )}`,
    );
    logger.debug(
      `App setting [${pluginPlatformSettingName}]: ${stringifySetting(
        defaultAppValue,
      )}`,
    );
    logger.debug(
      `Setting mismatch [${pluginPlatformSettingName}]: ${
        settingsAreDifferent ? 'yes' : 'no'
      }`,
    );
    logger.debug(
      `Setting is user defined [${pluginPlatformSettingName}]: ${
        valuePluginPlatformSetting ? 'yes' : 'no'
      }`,
    );

    if (!valuePluginPlatformSetting || settingsAreDifferent) {
      logger.debug(`Updating [${pluginPlatformSettingName}] setting...`);
      await updateSetting(
        uiSettingsClient,
        pluginPlatformSettingName,
        defaultAppValue,
      );
      logger.info(
        `Updated [${pluginPlatformSettingName}] setting to: ${stringifySetting(
          defaultAppValue,
        )}`,
      );
    }
  },
);

function getSavedObjectsClient(
  ctx: InitializationTaskRunContext,
  scope: InitializationTaskContext,
) {
  switch (scope) {
    case 'internal': {
      return ctx.core.savedObjects.createInternalRepository();
    }

    case 'user': {
      return ctx.core.savedObjects.savedObjectsStart.getScopedClient(
        ctx.request,
      );
    }

    default: {
      break;
    }
  }
}

function getUiSettingsClient(
  ctx: InitializationTaskRunContext,
  scope: InitializationTaskContext,
  client: any,
) {
  switch (scope) {
    case 'internal': {
      return ctx.core.uiSettings.asScopedToClient(client);
    }

    case 'user': {
      return ctx.core.uiSettings.uiSettingsStart.asScopedToClient(client);
    }

    default: {
      break;
    }
  }
}

export const initializationTaskCreatorSetting = (
  setting: { key: string; value: any; configurationSetting: string },
  taskName: string,
) => {
  return {
    name: taskName,
    async run(ctx: InitializationTaskRunContext) {
      try {
        ctx.logger.debug('Starting setting');

        // Get clients depending on the scope
        const savedObjectsClient = getSavedObjectsClient(ctx, ctx.scope);
        const uiSettingsClient = getUiSettingsClient(
          ctx,
          ctx.scope,
          savedObjectsClient,
        );
        const { key, value, configurationSetting } = setting;

        await checkPluginPlatformSettings(
          {
            logger: ctx.logger,
            uiSettingsClient,
            configuration: ctx.configuration,
          },
          {
            key,
            value,
            configurationSetting,
          },
        );
        ctx.logger.info('Start setting finished');
      } catch (error) {
        const message = `Error initilizating setting [${setting.key}]: ${error.message}`;

        ctx.logger.error(message);
        throw new Error(message);
      }
    },
  };
};
