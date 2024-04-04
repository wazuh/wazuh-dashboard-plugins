import { PLUGIN_PLATFORM_NAME } from '../../common/constants';
import { IConfiguration } from '../../common/services/configuration';
import yml from 'js-yaml';

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
    ? configurationService.getSettingValue(settingKey)
    : value;
}

export interface IConfigurationEnhanced extends IConfiguration {
  getCustomizationSetting(
    currentConfiguration: { [key: string]: any },
    settingKey: string,
  ): any;
  importFile(fileContent: string | Buffer): any;
}

function getCustomizationSetting(
  configuration: IConfigurationEnhanced,
  currentConfiguration: { [key: string]: any },
  settingKey: string,
) {
  const isCustomizationEnabled =
    typeof currentConfiguration['customization.enabled'] === 'undefined'
      ? configuration.getSettingValue('customization.enabled')
      : currentConfiguration['customization.enabled'];
  const defaultValue = configuration.getSettingValue(settingKey);

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
  configuration.getCustomizationSetting = async function (settingKey: string) {
    const currentConfiguration = await this.get(
      'customization.enabled',
      settingKey,
    );

    return getCustomizationSetting(this, currentConfiguration, settingKey);
  };
}
