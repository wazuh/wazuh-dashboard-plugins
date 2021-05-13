/*
 * Wazuh app - Check Kibana max buckets setting Service
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
import { WAZUH_MAX_BUCKETS_DEFAULT } from '../../../../common/constants'

type userValue<T> = { userValue: T }
type kbnSettings = {
  buildNum: userValue<number>
  timeFilter?: userValue<string[]>,
  maxBuckets?: userValue<number>
};

type responseKbnSettings = { settings: kbnSettings };

export function checkKibanaSettingsMaxBuckets(changeMaxBucketsDefaults: boolean) {
  checkMaxBuckets && getKibanaSettings()
    .then(checkMaxBuckets)
    .then(updateMaxBucketsSetting)
    .catch(error => error !== 'Unable to update config' && console.log(error));
}

async function getKibanaSettings(): Promise<responseKbnSettings> {
  const kibanaSettings: AxiosResponse = await GenericRequest.request('GET', '/api/kibana/settings');
  return kibanaSettings.data;
}

async function checkMaxBuckets({ settings }: responseKbnSettings) {
  if (!settings["timelion:max_buckets"]) {
    return false;
  }

  const maxBuckets = settings["timelion:max_buckets"].userValue;
  return WAZUH_MAX_BUCKETS_DEFAULT === maxBuckets;
}

async function updateMaxBucketsSetting(isModified: boolean) {
  return !isModified && await GenericRequest.request(
    'POST',
    '/api/kibana/settings',
    { "changes": { "timelion:max_buckets": WAZUH_MAX_BUCKETS_DEFAULT } }
  )
}
