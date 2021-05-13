/*
 * Wazuh app - Check Kibana time filter setting Service
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
import { WAZUH_TIME_FILTER_DEFAULT } from '../../../../common/constants';
import { getDataPlugin } from '../../../kibana-services';

type userValue<T> = { userValue: T };
type kbnSettings = {
  buildNum: userValue<number>;
  timeFilter?: userValue<string[]>;
};

type responseKbnSettings = { settings: kbnSettings };

export function checkKibanaSettingsTimeFilter(changeTimeDefaults: boolean) {
  changeTimeDefaults &&
    getKibanaSettings()
      .then(checkTimeFilter)
      .then(updateTimeFilterSetting)
      .catch((error) => error !== 'Unable to update config' && console.log(error));
}

async function getKibanaSettings(): Promise<responseKbnSettings> {
  const kibanaSettings: AxiosResponse = await GenericRequest.request('GET', '/api/kibana/settings');
  return kibanaSettings.data;
}

async function checkTimeFilter({ settings }: responseKbnSettings) {
  if (!settings['timepicker:timeDefaults']) {
    return false;
  }

  const timeFilter = settings['timepicker:timeDefaults'].userValue;
  const timeFilterObject = JSON.parse(timeFilter);
  return (
    WAZUH_TIME_FILTER_DEFAULT.from == timeFilterObject.from &&
    WAZUH_TIME_FILTER_DEFAULT.to == timeFilterObject.to
  );
}

async function updateTimeFilterSetting(isModified: boolean) {
  return (
    !isModified &&
    (await GenericRequest.request('POST', '/api/kibana/settings', {
      changes: { 'timepicker:timeDefaults': JSON.stringify(WAZUH_TIME_FILTER_DEFAULT) },
    })) &&
    getDataPlugin().query.timefilter.timefilter.setTime(WAZUH_TIME_FILTER_DEFAULT)
  );
}
