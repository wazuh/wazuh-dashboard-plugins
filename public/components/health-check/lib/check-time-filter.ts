import { AxiosResponse } from 'axios';
import { GenericRequest } from '../../../react-services';
import { getServices } from '../../../../../../src/plugins/discover/public/kibana_services';
import { WAZUH_TIME_FILTER_DEFAULT } from '../../../../util/constants'

type userValue<T> = { userValue: T }
type kbnSettings = {
  buildNum: userValue<number>
  timeFilter?: userValue<string[]>,
};


type responseKbnSettings = { settings: kbnSettings };

export function checkKibanaSettingsTimeFilter(changeTimeDefaults: boolean) {
  changeTimeDefaults && getKibanaSettings()
    .then(checktimeFilter)
    .then(updateTimeFilterSetting)
    .catch(error => error !== 'Unable to update config' && console.log(error));
}

async function getKibanaSettings(): Promise<responseKbnSettings> {
  const kibanaSettings: AxiosResponse = await GenericRequest.request('GET', '/api/kibana/settings');
  return kibanaSettings.data;
}

async function checktimeFilter({ settings }: responseKbnSettings) {
  if (!settings["timepicker:timeDefaults"]) {
    return false;
  }

  const timeFilter = settings["timepicker:timeDefaults"].userValue;
  const timeFilterObject = JSON.parse(timeFilter);
  return WAZUH_TIME_FILTER_DEFAULT.from == timeFilterObject.from && WAZUH_TIME_FILTER_DEFAULT.to == timeFilterObject.to;
}

async function updateTimeFilterSetting(isModified: boolean) {
  return !isModified && await GenericRequest.request(
    'POST',
    '/api/kibana/settings',
    { "changes": { "timepicker:timeDefaults": JSON.stringify(WAZUH_TIME_FILTER_DEFAULT) } }
  ) && getServices().timefilter.setTime(WAZUH_TIME_FILTER_DEFAULT);
}