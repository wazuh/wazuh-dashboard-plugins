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

  configuration.importFile = async function (file: string | Buffer) {
    const fileContent = typeof file === 'string' ? file : file.toString();
    this.logger.debug('Loading imported file content as JSON');
    const configAsJSON = yml.load(fileContent);
    this.logger.debug('Loaded imported file content as JSON');

    const { hosts: configFileHosts, ...otherSettings } = configAsJSON;

    // Transform hosts
    const hosts = configFileHosts
      ? Object.values(configFileHosts).map(item => {
          const id = Object.keys(item)[0];
          return {
            ...item[id],
            id: id,
          };
        })
      : [];

    const settingsFromFile = {
      ...otherSettings,
      ...(hosts.length ? { hosts } : {}),
    };

    const warnings: string[] = [];
    // Filter the settings by the supported
    const validSettings = Object.fromEntries(
      Object.entries(settingsFromFile).filter(([key]) => {
        if (this._settings.has(key)) {
          return true;
        } else {
          warnings.push(`[${key}] is not supported. This is ignored.`);
          return false;
        }
      }),
    );

    const thereIsOtherSettings = Object.keys(validSettings).length;

    if (!thereIsOtherSettings) {
      const message =
        'There are no valid settings defined in the configuration file';
      this.logger.debug(message);
      return response.badRequest({
        body: {
          message,
          ...(warnings.length ? { warnings } : {}),
        },
      });
    }

    this.logger.debug('Clearing configuration before importing the file');
    await this.clear();
    this.logger.info('Cleared configuration before importing the file');

    this.logger.debug('Storing configuration from imported file');
    const responseSetConfig = await this.set(validSettings);
    this.logger.info('Stored configuration from imported file');

    Object.entries(responseSetConfig?.requirements ?? {})
      .filter(([_, value]) => value)
      .forEach(([key]) => {
        messagesRequirements?.[key] &&
          warnings.push(
            `The imported configuration requires: ${messagesRequirements[key]}`,
          );
      });

    return {
      message: 'Configuration file was imported',
      data: responseSetConfig,
      ...(warnings.length ? { warnings } : {}),
    };
  };
}

// TODO: try to move to common because these messages are displayed on the UI too
const messagesRequirements = {
  requiresReloadingBrowserTab: 'Reload the page to apply the changes',
  requiresRunningHealthCheck: 'Run a health check to apply the changes.',
  requiresRestartingPluginPlatform: `Restart ${PLUGIN_PLATFORM_NAME} to apply the changes`,
};
