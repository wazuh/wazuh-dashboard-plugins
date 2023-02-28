/*
 * Wazuh app - Check PluginPlatform settings service
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { CheckLogger } from '../types/check_logger';
import _ from 'lodash';
import { getUiSettings } from '../../../kibana-services';
import { PLUGIN_PLATFORM_NAME } from '../../../../common/constants';

export const checkPluginPlatformSettings = (pluginPlatformSettingName: string, defaultAppValue: any, callback?: (checkLogger: CheckLogger, options: {defaultAppValue: any}) => void) => (appConfig: any) => async (checkLogger: CheckLogger) => {
  checkLogger.info('Getting settings...');
  const valuePluginPlatformSetting = getUiSettings().get(pluginPlatformSettingName);
  const settingsAreDifferent = !_.isEqual(
    typeof defaultAppValue === 'string' ? stringifySetting(valuePluginPlatformSetting) : valuePluginPlatformSetting,
    defaultAppValue
  );
  checkLogger.info(`Check ${PLUGIN_PLATFORM_NAME} setting [${pluginPlatformSettingName}]: ${stringifySetting(valuePluginPlatformSetting)}`);
  checkLogger.info(`App setting [${pluginPlatformSettingName}]: ${stringifySetting(defaultAppValue)}`);
  checkLogger.info(`Settings mismatch [${pluginPlatformSettingName}]: ${settingsAreDifferent ? 'yes' : 'no'}`);
  if ( !valuePluginPlatformSetting || settingsAreDifferent ){
    checkLogger.info(`Updating [${pluginPlatformSettingName}] setting...`);
    await updateSetting(pluginPlatformSettingName, defaultAppValue);
    checkLogger.action(`Updated [${pluginPlatformSettingName}] setting to: ${stringifySetting(defaultAppValue)}`);
    callback && callback(checkLogger,{ defaultAppValue });
  }
}

async function updateSetting(pluginPlatformSettingName, defaultAppValue, retries = 3) {
  return await getUiSettings()
    .set(pluginPlatformSettingName, defaultAppValue)
    .catch(async (error) => {
      if (retries > 0) {
        return await updateSetting(pluginPlatformSettingName, defaultAppValue, --retries);
      }
      throw error;
    });
}

function stringifySetting(setting: any){
  try{
    return JSON.stringify(setting);
  }catch(error){
    return setting;
  };
};
