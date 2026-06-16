import { getCore } from '../kibana-services';

const SECURITY_ANALYTICS_PLUGIN_ID = 'securityAnalyticsDashboards';

export function isSecurityAnalyticsSettingDisabled(
  settingId: string,
): boolean {
  const config = getCore().injectedMetadata.getInjectedVar<{
    disabledSettings?: string[];
  }>(SECURITY_ANALYTICS_PLUGIN_ID, {});
  return (config.disabledSettings ?? []).includes(settingId);
}
