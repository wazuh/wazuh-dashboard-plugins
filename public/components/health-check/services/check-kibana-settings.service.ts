/*
 * Wazuh app - Check Kibana settings service
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
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

export const checkKibanaSettings = (kibanaSettingName: string, defaultAppValue: any, callback?: (checkLogger: CheckLogger, options: {defaultAppValue: any}) => void) => (appConfig: any) => async (checkLogger: CheckLogger) => {
  checkLogger.info('Getting settings...');
  const valueKibanaSetting = getUiSettings().get(kibanaSettingName);
  const settingsAreDifferent = !_.isEqual(
    typeof defaultAppValue === 'string' ? stringifySetting(valueKibanaSetting) : valueKibanaSetting,
    defaultAppValue
  );
  checkLogger.info(`Check Kibana setting [${kibanaSettingName}]: ${stringifySetting(valueKibanaSetting)}`);
  checkLogger.info(`App setting [${kibanaSettingName}]: ${stringifySetting(defaultAppValue)}`);
  checkLogger.info(`Settings mismatch [${kibanaSettingName}]: ${settingsAreDifferent ? 'yes' : 'no'}`);
  if ( !valueKibanaSetting || settingsAreDifferent ){
    checkLogger.info(`Updating [${kibanaSettingName}] setting...`);
    await updateSetting(kibanaSettingName, defaultAppValue);
    checkLogger.action(`Updated [${kibanaSettingName}] setting to: ${stringifySetting(defaultAppValue)}`);
    callback && callback(checkLogger,{ defaultAppValue });
  }
}

async function updateSetting(kibanaSettingName, defaultAppValue, retries = 3) {
  return await getUiSettings()
    .set(kibanaSettingName, null)
    .catch(async (error) => {
      if (retries > 0) {
        return await updateSetting(kibanaSettingName, defaultAppValue, --retries);
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
