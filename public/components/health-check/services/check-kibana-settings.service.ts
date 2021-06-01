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

import { AxiosResponse } from 'axios';
import { GenericRequest } from '../../../react-services';
import { CheckLogger } from '../types/check_logger';
import _ from 'lodash';

type userValue<T> = { userValue: T };

type kbnSettings = {
  buildNum: userValue<number>;
  maxBuckets?: userValue<number>;
  metaFields?: userValue<string[]>;
  timeFilter?: userValue<string[]>;
};

type responseKbnSettings = { settings: kbnSettings };

export const checkKibanaSettings = (kibanaSettingName: string, defaultAppValue: any, callback?: (checkLogger: CheckLogger, options: {defaultAppValue: any}) => void) => (appConfig: any) => async (checkLogger: CheckLogger) => {
  checkLogger.info('Getting settings...');
  const kibanaSettingsResponse: AxiosResponse<responseKbnSettings> = await GenericRequest.request('GET', '/api/kibana/settings');
  checkLogger.info('Got Kibana settings');
  const valueKibanaSetting = kibanaSettingsResponse.data?.settings?.[kibanaSettingName]?.userValue;
  const settingsAreDifferent = !_.isEqual(valueKibanaSetting, defaultAppValue);
  checkLogger.info(`Check Kibana setting [${kibanaSettingName}]: ${stringifySetting(valueKibanaSetting)}`);
  checkLogger.info(`App setting [${kibanaSettingName}]: ${stringifySetting(defaultAppValue)}`);
  checkLogger.info(`Settings mismatch [${kibanaSettingName}]: ${settingsAreDifferent ? 'yes' : 'no'}`);
  if ( !valueKibanaSetting && settingsAreDifferent ){
    checkLogger.info(`Updating [${kibanaSettingName}] setting...`);
    await GenericRequest.request('POST', '/api/kibana/settings', { changes: { [kibanaSettingName]: defaultAppValue } });
    checkLogger.action(`Updated [${kibanaSettingName}] setting to: ${stringifySetting(defaultAppValue)}`);
    callback && callback(checkLogger,{ defaultAppValue });
  }
}

function stringifySetting(setting: any){
  try{
    return JSON.stringify(setting);
  }catch(error){
    return setting;
  };
};