/*
* Wazuh app - Osquery interactive extension guide
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
export default {
  id: 'osquery',
  name: 'Osquery',
  wodle_name: 'osquery',
  description: 'Configuration options of the osquery wodle.',
  category: 'Threat detection and response',
  documentation_link: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-osquery.html',
  icon: 'securityApp',
  callout_warning: 'Osquery is not installed by default. It is an open source software that you have to obtain for using this module.',
  avaliable_for: {
    manager: true,
    agent: true,
    centralized: true
  },
  api_component: 'wmodules',
  api_configuration: 'wmodules',
  api_module: 'osquery',
  steps: [
    {
      title: 'Settings',
      description: '',
      elements: [
        {
          name: 'disabled',
          display_name: 'Disable the module',
          description: 'Disable the osquery wodle.',
          type: 'switch',
          required: true
        },
        {
          name: 'run_daemon',
          display_name: 'Run daemon',
          description: 'Makes the module run osqueryd as a subprocess or lets the module monitor the results log without running Osquery.',
          type: 'switch',
          required: true,
          default_value: true
        },
        {
          name: 'bin_path',
          display_name: 'Executable path',
          description: 'Full path to the folder that contains the osqueryd executable.',
          type: 'input',
          // required: true,
          placeholder: 'Any valid path.',
          default_value_linux: '',
          default_value_windows: 'C:\\Program Files\\osquery\\osqueryd'
        },
        {
          name: 'log_path',
          display_name: 'Log path',
          description: 'Full path to the results log written by Osquery.',
          type: 'input',
          required: true,
          placeholder: 'Any valid path.',
          default_value_linux: '/var/log/osquery/osqueryd.results.log',
          default_value_windows: 'C:\\Program Files\\osquery\\log\\osqueryd.results.log',
          validate_error_message: 'Any valid path.'
        },
        {
          name: 'config_path',
          display_name: 'Configuration path',
          description: 'Path to the Osquery configuration file. This path can be relative to the folder where the Wazuh agent is running.',
          type: 'input',
          required: true,
          placeholder: 'Path to the Osquery configuration file',
          default_value_linux: '/etc/osquery/osquery.conf',
          default_value_windows: 'C:\\Program Files\\osquery\\osquery.conf'
        },
        {
          name: 'add_labels',
          display_name: 'Add labels',
          description: 'Add the agent labels defined as decorators.',
          type: 'switch',
          required: true,
          default_value: true
        }
      ]
    },
    {
      title: 'Packs',
      description: 'Add a query pack to the configuration. This option can be defined multiple times.',
      elements: [
        {
          name: 'pack',
          display_name: 'Query pack',
          description: 'Add a query pack to the configuration.',
          type: 'input',
          placeholder: 'Path to pack configuration file',
          default_value: '',
          removable: true,
          repeatable: true,
          required: true,
          validate_error_message: 'Path to pack configuration file',
          show_attributes: true,
          attributes: [
            {
              name: 'name',
              display_name: 'Pack name',
              // description: 'Name for this pack',
              type: 'input',
              required: true,
              placeholder: 'Name for this pack',
              default_value: '',
              validate_error_message: 'Name for this pack'
            }
          ]
        }
      ]
    }
  ],
  mapAgentConfigurationAPIResponse(config){
    return {
      ...config,
      ...(config.packs ? {pack: config.packs.map(pack => ({
        '#': pack.path,
        '@': {
          ...(pack.name ? {name: pack.name} : {})
        }
      }))} : {})
    }
  },
  // mapCentralizedConfigurationAPIResponse(config){
    
  // }
}