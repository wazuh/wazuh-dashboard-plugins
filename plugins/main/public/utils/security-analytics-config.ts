let saConfig: { disabledSettings?: string[] } = {};

export function setSecurityAnalyticsConfig(config: {
  disabledSettings?: string[];
}) {
  saConfig = config;
}

export function isSecurityAnalyticsSettingDisabled(
  settingId: string,
): boolean {
  return (saConfig.disabledSettings ?? []).includes(settingId);
}
