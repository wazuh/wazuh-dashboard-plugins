import { getCapabilities } from '../kibana-services';

export function isSecurityAnalyticsSettingDisabled(settingId: string): boolean {
  const caps = getCapabilities();

  if (settingId === 'index-raw-events') {
    return caps?.wazuh?.showIndexRawEvents === false;
  }

  return false;
}
