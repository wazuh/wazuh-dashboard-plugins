/*
 * Wazuh app - Module to parse the configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import yml from 'js-yaml';
import { WAZUH_DATA_CONFIG_APP_PATH, WAZUH_CONFIGURATION_CACHE_TIME, PLUGIN_SETTINGS, EpluginSettingType } from '../../common/constants';

let cachedConfiguration: any = null;
let lastAssign: number = new Date().getTime();

/**
 * Get the plugin configuration and cache it.
 * @param options.force Force to read the configuration and no use the cache .
 * @returns plugin configuration in JSON
 */
export function getConfiguration(options: {force?: boolean} = {}) {
  try {
    const now = new Date().getTime();
    const dateDiffer = now - lastAssign;
    if (!cachedConfiguration || dateDiffer >= WAZUH_CONFIGURATION_CACHE_TIME || options?.force) {
      cachedConfiguration = obfuscateHostsConfiguration(
        readPluginConfigurationFile(WAZUH_DATA_CONFIG_APP_PATH),
        ['password']
      );

      lastAssign = now;
    }
    return cachedConfiguration;
  } catch (error) {
    return false;
  };
};

/**
 * Read the configuration file and transform to JSON.
 * @param path File path of the plugin configuration file.
 * @returns Configuration as JSON.
 */
 function readPluginConfigurationFile(filepath: string) {
  const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
  return yml.load(content);
};

/**
 * Obfuscate fields of the hosts configuration.
 * @param configuration Plugin configuration as JSON.
 * @param obfuscateHostConfigurationKeys Keys to obfuscate its value in the hosts configuration.
 * @returns 
 */
function obfuscateHostsConfiguration(configuration: any, obfuscateHostConfigurationKeys: string[]){
  if(configuration.hosts){
    configuration.hosts = configuration.hosts
      .map((host) => {
        const hostID = Object.keys(host)[0];
        return {
          [hostID]: {
            ...host[hostID],
            ...(obfuscateHostConfigurationKeys
              .reduce((accumObfuscateHostConfigurationKeys, obfuscateHostConfigurationKey) => 
                ({...accumObfuscateHostConfigurationKeys, [obfuscateHostConfigurationKey]: '*****'}), {})
            )
          }
        }
      });
  };
  return configuration;
};
