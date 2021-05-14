import { AxiosResponse } from 'axios';
import { GenericRequest } from '../../../react-services';
import { WAZUH_METAFIELDS_SETTINGS } from '../../../../common/constants'
import _ from 'lodash';

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
  return !!metaFields && !_.isEqual(WAZUH_METAFIELDS_SETTINGS, metaFields && metaFields.userValue);
}

async function updateMetaFieldsSetting(isModified:boolean) {
  return !isModified && await GenericRequest.request(
    'POST',
    '/api/kibana/settings',
    {"changes":{"metaFields":WAZUH_METAFIELDS_SETTINGS}}
  );
}