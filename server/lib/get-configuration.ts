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
import glob from 'glob';
import path from 'path';
import yml from 'js-yaml';
import { WAZUH_DATA_CONFIG_APP_PATH, WAZUH_CONFIGURATION_CACHE_TIME, PLUGIN_SETTINGS, EpluginSettingType, ASSETS_CUSTOM_BY_TYPE } from '../../common/constants';

let cachedConfiguration: any = null;
let lastAssign: number = new Date().getTime();

/**
 * Get the plugin configuration and cache it.
 * @param options.force Force to read the configuration and no use the cache .
 * @returns plugin configuration in JSON
 */
export function getConfiguration(options: {force?: boolean}) {
  try {
    const now = new Date().getTime();
    const dateDiffer = now - lastAssign;
    if (!cachedConfiguration || dateDiffer >= WAZUH_CONFIGURATION_CACHE_TIME || options.force) {
      const fileConfiguration = obfuscateHostsConfiguration(readPluginConfigurationFile(WAZUH_DATA_CONFIG_APP_PATH), ['password']);
      const assetsConfiguration = getPluginConfigurationCustomAssets(path.join(__dirname, '../../public/assets/custom'));

      // Combine the configuration to the cache store
      cachedConfiguration = {
        ...fileConfiguration,
        ...assetsConfiguration
      };

      lastAssign = now;
    }
    return cachedConfiguration;
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
};

/**
 * Obfuscate fields of the hosts configuration.
 * @param configuration Plugin configuration as JSON.
 * @param obfuscateHostConfigurationKeys Keys to obfuscate its value in the hosts configuration.
 * @returns 
 */
function obfuscateHostsConfiguration(configuration: any, obfuscateHostConfigurationKeys: string[]){
  configuration.hosts = Object.entries(configuration.hosts)
    .reduce((accum, [hostID, hostConfiguration]) => {
      return {...accum, [hostID]: {
        ...hostConfiguration,
        ...(obfuscateHostConfigurationKeys
            .reduce((accumObfuscateHostConfigurationKeys, obfuscateHostConfigurationKey) => 
              ({...accumObfuscateHostConfigurationKeys, [obfuscateHostConfigurationKey]: '*****'}), {})
          )
      }}
    }, {})
  return configuration;
};

function getPluginConfigurationCustomAssets(filepath: string){
  try{
    const pluginSettingsTypeFilepicker = Object.entries(PLUGIN_SETTINGS)
      .filter(([_, {type, configurableUI, configurableFile}]) => type === EpluginSettingType.filepicker && !configurableFile && configurableUI);

    return pluginSettingsTypeFilepicker.reduce((accum, [pluginSettingKey, pluginSettingConfiguration]) => {
      const globFilepath = path.join(
        filepath,
        ASSETS_CUSTOM_BY_TYPE[pluginSettingConfiguration.options.file.type],
        // Search files with the allowed extensions for the plugin setting.
        `${pluginSettingKey}@(${pluginSettingConfiguration.options.file.extensions.join('|')})`
        );

      const files = glob.sync(globFilepath);
      files[0] && (accum[pluginSettingKey] = path.join(
        // 'plugins/wazuh/assets/custom', //TODO: see the route where the file is exposed.
        'custom', //TODO: see the route where the file is exposed.
        ASSETS_CUSTOM_BY_TYPE[pluginSettingConfiguration.options.file.type],
        files[0].split('/').pop()
      )); // Set the first file found.

      return accum;
    }, {});

  }catch{
    return {};
  };
};
