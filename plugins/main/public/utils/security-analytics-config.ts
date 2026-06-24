import { WAZUH_DISABLED_SETTING_INDEX_RAW_EVENTS } from '../../common/constants';
import { getCapabilities } from '../kibana-services';

export function isSecurityAnalyticsSettingDisabled(settingId: string): boolean {
  const caps = getCapabilities();

  if (settingId === WAZUH_DISABLED_SETTING_INDEX_RAW_EVENTS) {
    return caps?.wazuh?.showIndexRawEvents === false;
  }

  return false;
}
