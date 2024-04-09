import { IConfiguration } from '../../common/services/configuration';
/**
 * Returns the default value if not set when the setting is an empty string
 * @param settingKey plugin setting
 * @param value value of the plugin setting
 * @returns
 */
function resolveEmptySetting(
  configurationService: IConfiguration,
  settingKey: string,
  value: unknown,
) {
  return typeof value === 'string' &&
    value.length === 0 &&
    configurationService._settings.get(settingKey).defaultValueIfNotSet
    ? configurationService.getSettingValueIfNotSet(settingKey)
    : value;
}

export interface IConfigurationEnhanced extends IConfiguration {
  getCustomizationSetting(...settingKeys: string[]): { [key: string]: any };
}

function getCustomizationSetting(
  configuration: IConfigurationEnhanced,
  currentConfiguration: { [key: string]: any },
  settingKey: string,
) {
  const isCustomizationEnabled = currentConfiguration['customization.enabled'];
  const defaultValue = configuration.getSettingValueIfNotSet(settingKey);

  if (
    isCustomizationEnabled &&
    settingKey.startsWith('customization') &&
    settingKey !== 'customization.enabled'
  ) {
    return typeof currentConfiguration[settingKey] !== 'undefined'
      ? resolveEmptySetting(
          configuration,
          settingKey,
          currentConfiguration[settingKey],
        )
      : defaultValue;
  } else {
    return defaultValue;
  }
}

export function enhanceConfiguration(configuration: IConfiguration) {
  /**
   * Get the customiztion settings taking into account if this is enabled
   * @param settingKeys
   * @returns
   */
  configuration.getCustomizationSetting = async function (
    ...settingKeys: string[]
  ) {
    if (!settingKeys.length) {
      throw new Error('No settings defined');
    }
    const currentConfiguration = await this.get(
      'customization.enabled',
      ...settingKeys,
    );

    return Object.fromEntries(
      settingKeys.map(settingKey => [
        settingKey,
        getCustomizationSetting(this, currentConfiguration, settingKey),
      ]),
    );
  };
}
