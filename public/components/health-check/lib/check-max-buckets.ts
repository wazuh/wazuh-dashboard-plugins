import { AxiosResponse } from 'axios';
import { GenericRequest } from '../../../react-services';
import { WAZUH_MAX_BUCKETS_DEFAULT } from '../../../../common/constants'
import { getDataPlugin } from '../../../kibana-services';

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
  const maxBucketsObject = JSON.parse(maxBuckets);
  return WAZUH_MAX_BUCKETS_DEFAULT === maxBucketsObject;
}

async function updateMaxBucketsSetting(isModified: boolean) {
  console.log("ENTRA AQUI 3")
  return !isModified && await GenericRequest.request(
    'POST',
    '/api/kibana/settings',
    { "changes": { "timelion:max_buckets": JSON.stringify(WAZUH_MAX_BUCKETS_DEFAULT) } }
  )
}
