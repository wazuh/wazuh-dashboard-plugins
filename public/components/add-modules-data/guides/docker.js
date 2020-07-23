/*
* Wazuh app - Docker listener interactive extension guide
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
  id: 'docker',
  name: 'Docker listener',
  wodle_name: 'docker-listener',
  description: 'Configuration options of the Docker wodle.',
  category: 'Threat detection and response',
  documentation_link: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-docker.html',
  icon: 'logoDocker',
  avaliable_for: {
    manager: true,
    agent: ['windows']
  },
  api_component: 'wmodules',
  api_configuration: 'wmodules',
  api_module: 'docker-listener',
  steps: [
    {
      title: 'Settings',
      description: '',
      elements: [
        {
          name: 'disabled',
          display_name: 'Disables the module',
          description: 'Disables the Docker wodle.',
          type: 'switch',
          required: true
        },
        {
          name: 'interval',
          display_name: 'Interval time',
          description: 'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days)',
          type: 'input',
          required: true,
          placeholder: 'Time in format <number><time unit suffix>',
          default_value: '1m',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit. e.g.: 1m',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'attempts',
          display_name: 'Number of attempts',
          description: 'Number of attempts to execute the wodle.',
          type: 'input-number',
          required: true,
          placeholder: 'Number of attempts',
          values: { min: 1 },
          default_value: 5,
          validate_error_message: 'Number of attempts to execute the wodle.'
        },
        {
          name: 'run_on_start',
          display_name: 'Run on start',
          description: `Run command immediately when service is started.`,
          type: 'switch',
          required: true,
          default_value: true
        }
      ]
    }
  ],
  mapAgentConfigurationAPIResponse(config){
    return {
      ...config,
      ...(config.interval ? {interval: `${config.interval}s`} : {})
    }
  }
}