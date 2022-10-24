/*
 * Wazuh app - App configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import {
  PLUGIN_SETTINGS_CATEGORIES,
  TPluginSettingWithKey,
} from '../../common/constants';
import { getPluginSettingDescription, getSettingsDefaultList, groupSettingsByCategory } from '../../common/services/settings';
import { webDocumentationLink } from '../../common/services/web_documentation';

export const header: string = `---
#
# Wazuh app - App configuration file
# Copyright (C) 2015-2022 Wazuh, Inc.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# Find more information about this on the LICENSE file.
#
${printSection('Wazuh app configuration file', {prefix: '# ', fill: '='})}
#
# Please check the documentation for more information about configuration options:
# ${webDocumentationLink('user-manual/wazuh-dashboard/config-file.html')}
#
# Also, you can check our repository:
# https://github.com/wazuh/wazuh-kibana-app`;

const pluginSettingsConfigurationFile = getSettingsDefaultList().filter(({isConfigurableFromFile}) => isConfigurableFromFile);

const pluginSettingsConfigurationFileGroupByCategory = groupSettingsByCategory(pluginSettingsConfigurationFile);

const pluginSettingsConfiguration = pluginSettingsConfigurationFileGroupByCategory.map(({category: categoryID, settings}) => {
  const category = printSettingCategory(PLUGIN_SETTINGS_CATEGORIES[categoryID]);

  const pluginSettingsOfCategory = settings
    .map(setting => printSetting(setting)
    ).join('\n#\n');
  /*
  #------------------- {category name} --------------
  #
  #  {category description}
  #
  # {setting description}
  # settingKey: settingDefaultValue
  #
  # {setting description}
  # settingKey: settingDefaultValue
  # ...
  */
  return [category, pluginSettingsOfCategory].join('\n#\n');
}).join('\n#\n');


export function printSettingValue(value: unknown): any{
  if(typeof value === 'object'){
    return JSON.stringify(value)
  };

  if(typeof value === 'string' && value.length === 0){
    return `''`
  };

  return value;
};

export function printSetting(setting: TPluginSettingWithKey): string{
  /*
  # {setting description}
  # {settingKey}: {settingDefaultValue}
  */
  return [
    splitDescription(getPluginSettingDescription(setting)),
    `# ${setting.key}: ${printSettingValue(setting.defaultValue)}`
  ].join('\n')
}

export function printSettingCategory({title, description}){
  /*
  #------------------------------- {category title} -------------------------------
  # {category description}
  #
  */
  return [
    printSection(title, {prefix: '# ', fill: '-'}),
    ...(description ? [splitDescription(description)] : [''])
  ].join('\n#\n')
};

export function printSection(text: string, options?: {maxLength?: number, prefix?: string,  suffix?: string, spaceAround?: number, fill?: string }){
  const maxLength = options?.maxLength ?? 80;
  const prefix = options?.prefix ?? '';
  const sufix = options?.suffix ?? '';
  const spaceAround = options?.spaceAround ?? 1;
  const fill = options?.fill ?? ' ';
  const fillLength = maxLength - prefix.length - sufix.length - (2 * spaceAround) - text.length;

  return [
    prefix,
    fill.repeat(Math.floor(fillLength/2)),
    ` ${text} `,
    fill.repeat(Math.ceil(fillLength/2)),
    sufix
  ].join('');
};

export const hostsConfiguration = `${printSection('Wazuh hosts', {prefix: '# ', fill: '-'})}
#
# The following configuration is the default structure to define a host.
#
# hosts:
#   # Host ID / name,
#   - env-1:
#       # Host URL
#       url: https://env-1.example
#       # Host / API port
#       port: 55000
#       # Host / API username
#       username: wazuh-wui
#       # Host / API password
#       password: wazuh-wui
#       # Use RBAC or not. If set to true, the username must be "wazuh-wui".
#       run_as: true
#   - env-2:
#       url: https://env-2.example
#       port: 55000
#       username: wazuh-wui
#       password: wazuh-wui
#       run_as: true

hosts:
  - default:
      url: https://localhost
      port: 55000
      username: wazuh-wui
      password: wazuh-wui
      run_as: false
`;

/**
 * Given a string, this function builds a multine string, each line about 70
 * characters long, splitted at the closest whitespace character to that lentgh.
 *
 * This function is used to transform the settings description
 * into a multiline string to be used as the setting documentation.
 *
 * The # character is also appended to the beginning of each line.
 *
 * @param text
 * @returns multine string
 */
export function splitDescription(text: string = ''): string {
  const lines = text.match(/.{1,80}(?=\s|$)/g) || [];
  return lines.map((z) => '# ' + z.trim()).join('\n');
}

export const initialWazuhConfig: string = [header, pluginSettingsConfiguration, hostsConfiguration].join('\n#\n');
