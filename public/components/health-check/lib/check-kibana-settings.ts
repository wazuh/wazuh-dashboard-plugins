import { AxiosResponse } from 'axios';
import { GenericRequest } from '../../../react-services';

type userValue<T> = {userValue: T}

type kbnSettings = {
  buildNum: userValue<number>
  metaFields?: userValue<string[]>,
};

type responseKbnSettings = {settings: kbnSettings};

export function checkKibanaSettings (removeMetaFields: boolean) {
  removeMetaFields && getKibanaSettings()
  .then(checkMetafieldSetting)
  .then(updateMetaFieldsSetting)
  .catch(console.log);
}

async function getKibanaSettings(): Promise<responseKbnSettings> {
  const kibanaSettings:AxiosResponse = await GenericRequest.request('GET', '/api/kibana/settings');
  return kibanaSettings.data;
}

async function checkMetafieldSetting({settings}: responseKbnSettings) {
  const { metaFields } = settings;
  return !!metaFields && !!metaFields.userValue.length;
}

async function updateMetaFieldsSetting(isModified:boolean) {
  return !isModified && await GenericRequest.request(
    'POST',
    '/api/kibana/settings',
    {"changes":{"metaFields":["_source",""]}}
  );
}
