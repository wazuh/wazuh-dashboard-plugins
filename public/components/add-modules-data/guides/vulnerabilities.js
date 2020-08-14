/*
* Wazuh app - Vulnerabilites extension guide
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
  id: 'vuls',
  xml_tag: 'vulnerability-detector',
  name: 'Vulnerabilities',
  description: 'Configuration options for vulnerabilities.',
  category: 'Threat detection and response',
  documentation_link: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/vuln-detector.html',
  icon: 'securityApp',
  avaliable_for: {
    manager: true
  },
  api_component: 'wmodules',
  api_configuration: 'wmodules',
  api_module: 'vulnerability-detector',
  steps: [
    {
      title: 'Configure the general settings',
      description: '',
      elements: [
        {
          name: 'enabled',
          display_name: 'Enabled',
          description: 'Enables the module.',
          type: 'switch',
          required: true
        },
        {
          name: 'interval',
          display_name: 'Time between scans',
          description: 'Time between vulnerabilities scans.',
          type: 'input',
          required: true,
          default_value: '5m',
          placeholder: 'Time in format <number><time unit suffix>',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'run_on_start',
          display_name: 'Run on start',
          description: 'Runs updates and vulnerabilities scans immediately when service is started.',
          type: 'switch',
          required: true,
          default_value: true
        },
        {
          name: 'ignore_time',
          display_name: 'Ignore time',
          description: ' Time during which vulnerabilities that have already been alerted will be ignored.',
          type: 'input',
          default_value: '6h',
          placeholder: 'Time in format <number><time unit suffix>',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        }
      ]
    },
    {
      title: 'Add providers',
      description: 'Define providers of vulnerability updates.',
      elements: [
        {
          name: 'provider',
          display_name: 'Provider',
          description: 'Configuration block to specify vulnerability updates.',
          repeatable: true,
          required: true,
          removable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false
          },
          attributes: [
            {
              name: 'name',
              display_name: 'Provider name',
              description: 'Defines a vulnerability information provider.',
              type: 'select',
              required: true,
              values: [
                {value: 'canonical', text: 'canonical'},
                {value: 'debian', text: 'debian'},
                {value: 'redhat', text: 'redhat'},
                {value: 'nvd', text: 'nvd'}
              ],
              default_value: 'canonical'
            } 
          ],
          show_options: true,
          options: [
            {
              name: 'enabled',
              display_name: 'Enable the module',
              description: 'Enables the vulnerability provider update.',
              type: 'switch',
              required: true
            },
            {
              name: 'os',
              display_name: 'Operating system',
              description: 'Feed to update.',
              type: 'select',
              info: `canonical: (trusty, xenial, bionic, focal)
              debian: (wheezy , jessie, stretch, buster)
              redhat and nvd does not use this option
              `,
              repeatable: true,
              removable: true,
              // required: true,
              values: [
                {value: 'precise', text: 'precise'},
                {value: 'trusty', text: 'trusty'},
                {value: 'xenial', text: 'xenial'},
                {value: 'bionic', text: 'bionic'},
                {value: 'focal', text: 'focal'},
                {value: 'wheezy', text: 'wheez'},
                {value: 'jessie', text: 'jessie'},
                {value: 'stretch', text: 'stretch'},
                {value: 'buster', text: 'buster'}
              ],
              default_value: 'precise',
              attributes: [
                {
                  name: 'update_interval',
                  display_name: 'Interval to update database',
                  description: 'How often the vulnerability database is updated. It has priority over the update_interval option of the provider block.',
                  type: 'input',
                  validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
                  validate_regex: /^[1-9]\d*[s|m|h|d]$/
                },
                {
                  name: 'url',
                  display_name: 'Alternative OVAL file URL',
                  description: 'Defines the link to an alternative OVAL files.',
                  type: 'input',
                  placeholder: 'Link to download the OVAL file obtained from Canonical or Debian.'
                },
                {
                  name: 'path',
                  display_name: 'Alternative OVAL file path',
                  description: 'Defines the path to an alternative OVAL file.',
                  type: 'input',
                  placeholder: ''
                },
                {
                  name: 'port',
                  display_name: 'Connection port',
                  description: 'Defines the connection port when using the url attribute.',
                  type: 'input-number',
                  values: { min: 0 },
                  default_value: '',
                  validate_error_message: 'A valid port.'
                },
                {
                  name: 'allow',
                  display_name: 'Allow unsupported systems',
                  description: 'Defines compatibility with unsupported systems.',
                  info: 'You can find a guide on how to set it up https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/allow_os.html',
                  info_link: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/allow_os.html',
                  type: 'input',
                  validate_error_message: 'A valid operating system not supported by default.'
                }
              ]
            },
            {
              name: 'update_interval',
              display_name: 'Interval to update provider',
              description: 'How often the vulnerabilities of the provider are updated. It can be overwritten by the attribute with the same name of <os>.',
              type: 'input',
              default_value: '1h',
              placeholder: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
              validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
              validate_regex: /^[1-9]\d*[s|m|h|d]$/
            },
            {
              name: 'update_from_year',
              display_name: 'Update provider from year',
              description: 'Year from which the provider will be updated.',
              default_value: 2010,
              values: { min: 1900 },
              type: 'input-number',
              placeholder: 'Year from which the provider will be updated.',
              // validate_regex: /^([1-9]\d{3})$/,
              // validate_error_message: 'Year from which the provider will be updated.'
            },
            {
              name: 'allow',
              display_name: 'Allow unsupported systems',
              description: 'Defines compatibility with unsupported systems.',
              info: 'You can find a guide on how to set it up https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/allow_os.html',
              info_link: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/allow_os.html',
              type: 'input',
              validate_error_message: 'A valid operating system not supported by default.',
              attributes: [
                {
                  name: 'replaced_os',
                  description: 'Defines the version of Red Hat that will replace the unsupported system.',
                  type: 'input',
                  placeholder: 'A numeric value that in substitution with the tag forms a valid link.',
                  validate_error_message: 'A numeric value that in substitution with the tag forms a valid link.'
                }
              ]
            },
            {
              name: 'url',
              display_name: 'Alternative feed files URL',
              description: 'Defines the link to an alternative feed files.',
              type: 'input',
              placeholder:'Defines the link to an alternative feed files.',
              attributes: [
                {
                  name: 'start',
                  display_name: 'Start',
                  description: 'Defines the first value which the tag will be substituted.',
                  type: 'input-number',
                  values: { min: 0 },
                  default_value: '',
                  placeholder: 'A numeric value that in substitution with the tag forms a valid link.',
                  validate_error_message: 'A numeric value that in substitution with the tag forms a valid link.',
                },
                {
                  name: 'end',
                  display_name: 'End',
                  description: 'Defines the last value which the tag will be substituted.',
                  type: 'input-number',
                  values: { min: 0 },
                  default_value: '',
                  placeholder: 'A numeric value that in substitution with the tag forms a valid link.',
                  validate_error_message: 'A numeric value that in substitution with the tag forms a valid link.',
                },
                {
                  name: 'port',
                  display_name: 'Connection port',
                  description: 'Defines the connection port.',
                  type: 'input-number',
                  values: { min: 0 },
                  placeholder: 'A valid port.',
                  validate_error_message: 'A valid port.',
                }
              ]
            },
            {
              name: 'path',
              display_name: 'Alternative feed files path',
              description: 'Defines the path to an alternative feed files.',
              type: 'input',
              placeholder: 'A valid path'
            }
          ]
        }
      ]
    }
  ],
  mapAgentConfigurationAPIResponse(config){
    const mapped = {
      ...config,
      ...(typeof config.interval !== 'undefined' ? {interval: `${config.interval}s`} : {}),
      ...(typeof config.ignore_time !== 'undefined' ? {ignore_time: `${config.ignore_time}s`} : {}),
      ...(config.providers ? {provider : config.providers.map(provider => ({
        ...provider,
        enabled: 'yes',
        ...(provider.name ? { '@' : { name: provider.name} } : {}),
        ...(typeof provider.update_interval !== 'undefined' ? {update_interval: `${provider.update_interval}s`} : {}),
        ...(provider.version ? { os: [{ '#': provider.version.toLowerCase()}] } : {}),
        ...(provider.allow ? { allow: provider.allow.map(allow => allow.src && allow.src[0]).filter(allow => allow).join(',')} : { })
      }))} : {})
    }
    return mapped;
  }
}
