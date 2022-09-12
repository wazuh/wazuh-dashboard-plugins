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
  PLUGIN_SETTINGS
} from '../../common/constants';
import { getPluginSettingDescription } from '../../common/services/settings';
import { webDocumentationLink } from '../../common/services/web_documentation';


const header = `---
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
# ======================== Wazuh app configuration file ========================
#
# Please check the documentation for more information about configuration options:
# ${webDocumentationLink('user-manual/wazuh-dashboard/config-file.html')}
#
# Also, you can check our repository:
# https://github.com/wazuh/wazuh-kibana-app`;


const pluginSettingsConfiguration = Object.entries(PLUGIN_SETTINGS_CATEGORIES).map(([pluginSettingCategoryID, pluginSettingCategoryConfiguration]) => {
  const header = `#------------------------------- ${pluginSettingCategoryConfiguration.title} -------------------------------`;
  const description = pluginSettingCategoryConfiguration.description
    /*
    # category description
    #
    */
    ? splitDescription(pluginSettingCategoryConfiguration.description)
  : '';

  const pluginSettingsCategory = Object.entries(PLUGIN_SETTINGS)
    .filter(([, {category, configurableFile}]) => configurableFile && category.toString() === pluginSettingCategoryID)
    .map(([pluginSettingKey, {description, default: defaultValue, options = {}}] ) => 
      /*
      # setting description
      # settingKey: settingValue
      */
      [splitDescription(getPluginSettingDescription({description, options})), `# ${pluginSettingKey}: ${printSettingValue(defaultValue)}`].join('\n')
    ).join('\n#\n');
  /*
  #------------------- category name --------------
  #
  #  category description
  #
  # setting description
  # settingKey: settingValue
  #
  # setting description
  # settingKey: settingValue
  # ...
  */
  return [header, description, pluginSettingsCategory].join('\n#\n');
}).join('\n#\n');


function printSettingValue(value: any){
  if(typeof value === 'object'){
    return JSON.stringify(value)
  };

  if(typeof value === 'string' && value.length === 0){
    return `''`
  };

  return value;
};

const hostsConfiguration = `#-------------------------------- Wazuh hosts ----------------------------------
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
function splitDescription(text: string = ''): string {
  const lines = text.match(/.{1,80}(?=\s|$)/g) || [];
  return lines.map((z) => '# ' + z.trim()).join('\n');
}

export const initialWazuhConfig: string = [header, pluginSettingsConfiguration, hostsConfiguration].join('\n');