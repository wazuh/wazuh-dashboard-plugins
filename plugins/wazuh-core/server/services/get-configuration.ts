import fs from 'fs';
import yml from 'js-yaml';
import { WAZUH_DATA_CONFIG_APP_PATH, WAZUH_CONFIGURATION_CACHE_TIME } from '../../common/constants';
import { getSettingsDefault } from '../../common/services/settings';

let cachedConfiguration: any = null;
let lastAssign: number = new Date().getTime();

/**
 * Get the plugin configuration and cache it.
 * @param options.force Force to read the configuration and no use the cache .
 * @returns plugin configuration in JSON
 */
export function getConfiguration(options: { force?: boolean } = {}) {
  try {
    const now = new Date().getTime();
    const dateDiffer = now - lastAssign;
    const defaultConfiguration = getSettingsDefault();
    if (!cachedConfiguration || dateDiffer >= WAZUH_CONFIGURATION_CACHE_TIME || options?.force) {
      cachedConfiguration = obfuscateHostsConfiguration(
        readPluginConfigurationFile(WAZUH_DATA_CONFIG_APP_PATH),
        ['password']
      );

      lastAssign = now;
    }
    return { ...defaultConfiguration, ...cachedConfiguration };
  } catch (error) {
    return false;
  }
}

/**
 * Read the configuration file and transform to JSON.
 * @param path File path of the plugin configuration file.
 * @returns Configuration as JSON.
 */
function readPluginConfigurationFile(filepath: string) {
  const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
  return yml.load(content);
}

/**
 * Obfuscate fields of the hosts configuration.
 * @param configuration Plugin configuration as JSON.
 * @param obfuscateHostConfigurationKeys Keys to obfuscate its value in the hosts configuration.
 * @returns
 */
function obfuscateHostsConfiguration(configuration: any, obfuscateHostConfigurationKeys: string[]) {
  if (configuration.hosts) {
    configuration.hosts = configuration.hosts.map((host: { [hostID: string]: any }) => {
      const hostID = Object.keys(host)[0];
      return {
        [hostID]: {
          ...host[hostID],
          ...obfuscateHostConfigurationKeys.reduce(
            (accumObfuscateHostConfigurationKeys, obfuscateHostConfigurationKey) => ({
              ...accumObfuscateHostConfigurationKeys,
              [obfuscateHostConfigurationKey]: '*****',
            }),
            {}
          ),
        },
      };
    });
  }
  return configuration;
}
