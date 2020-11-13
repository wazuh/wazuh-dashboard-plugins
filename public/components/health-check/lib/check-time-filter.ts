import { AxiosResponse } from 'axios';
import { GenericRequest } from '../../../react-services';

type userValue<T> = { userValue: T }
type kbnSettings = {
  buildNum: userValue<number>
  timeFilter?: userValue<string[]>,
};

type responseKbnSettings = { settings: kbnSettings };
const timeFilterSetting = JSON.stringify({
  from: "now-24h",
  to: 'now'
});
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
  const { timeFilter } = settings;
  return !!timeFilter && !!timeFilter.userValue.length;
}
async function updateTimeFilterSetting(isModified: boolean) {
  return !isModified && await GenericRequest.request(
    'POST',
    '/api/kibana/settings',
    { "changes": { "timepicker:timeDefaults": timeFilterSetting } }
  );
}