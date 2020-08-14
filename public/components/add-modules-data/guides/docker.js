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
      title: 'Configure the module',
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
        },
        {
          name: 'day',
          display_name: 'Day of the month',
          description: 'Day of the month to run the scan.',
          info: 'When the day option is set, the interval value must be a multiple of months. By default, the interval is set to a month.',
          type: 'select',
          values: [
            { value: '1', text: '1' },
            { value: '2', text: '2' },
            { value: '3', text: '3' },
            { value: '4', text: '4' },
            { value: '5', text: '5' },
            { value: '6', text: '6' },
            { value: '7', text: '7' },
            { value: '8', text: '8' },
            { value: '9', text: '9' },
            { value: '10', text: '10' },
            { value: '11', text: '11' },
            { value: '12', text: '12' },
            { value: '13', text: '13' },
            { value: '14', text: '14' },
            { value: '15', text: '15' },
            { value: '16', text: '16' },
            { value: '17', text: '17' },
            { value: '18', text: '18' },
            { value: '19', text: '19' },
            { value: '20', text: '20' },
            { value: '21', text: '21' },
            { value: '22', text: '22' },
            { value: '23', text: '23' },
            { value: '24', text: '24' },
            { value: '25', text: '25' },
            { value: '26', text: '26' },
            { value: '27', text: '27' },
            { value: '28', text: '28' },
            { value: '29', text: '29' },
            { value: '30', text: '30' },
            { value: '31', text: '31' }
          ],
          default_value: '1'
        },
        {
          name: 'wday',
          display_name: 'Day of the week',
          description: 'Day of the week to run the CIS-CAT scan. This option is not compatible with the day option.',
          info: 'When the wday option is set, the interval value must be a multiple of weeks. By default, the interval is set to a week.',
          type: 'select',
          values: [
            { value: 'sunday', text: 'sunday' },
            { value: 'monday', text: 'monday' },
            { value: 'tuesday', text: 'tuesday' },
            { value: 'wednesday', text: 'wednesday' },
            { value: 'thursday', text: 'thursday' },
            { value: 'friday', text: 'friday' },
            { value: 'saturday', text: 'saturday' }
          ],
          default_value: 'sunday',
          placeholder: 'Day of the month [1..31]',
          validate_error_message: 'Day of the month [1..31]'
        },
        {
          name: 'time',
          display_name: 'Time of the day',
          description: 'Time of the day to run the scan. It has to be represented in the format hh:mm.',
          type: 'input',
          placeholder: 'Time of day',
          validate_error_message: 'Time of day in hh:mm format',
          validate_regex: /^(((0[0-9])|(1[0-9])|(2[0-4])):[0-5][0-9])$/
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