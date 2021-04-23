/*
 * Wazuh app - Check Kibana settings Service
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

type userValue<T> = { userValue: T };

type kbnSettings = {
  buildNum: userValue<number>;
  metaFields?: userValue<string[]>;
};

type responseKbnSettings = { settings: kbnSettings };

export function checkKibanaSettings(removeMetaFields: boolean) {
  removeMetaFields &&
    getKibanaSettings()
      .then(checkMetafieldSetting)
      .then(updateMetaFieldsSetting)
      .catch((error) => error !== 'Unable to update config' && console.log(error));
}

async function getKibanaSettings(): Promise<responseKbnSettings> {
  const kibanaSettings: AxiosResponse = await GenericRequest.request('GET', '/api/kibana/settings');
  return kibanaSettings.data;
}

async function checkMetafieldSetting({ settings }: responseKbnSettings) {
  const { metaFields } = settings;
  return !!metaFields && !!metaFields.userValue.length;
}

async function updateMetaFieldsSetting(isModified: boolean) {
  return (
    !isModified &&
    (await GenericRequest.request('POST', '/api/kibana/settings', { changes: { metaFields: [] } }))
  );
}
