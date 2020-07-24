/*
* Wazuh app - OpenSCAP interactive extension guide
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
  id: 'oscap',
  name: 'OpenSCAP',
  wodle_name: 'open-scap',
  description: 'Configuration options of the OpenSCAP wodle.',
  category: 'Auditing and policy monitoring',
  documentation_link: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-openscap.html',
  icon: 'securityApp',
  avaliable_for: {
    manager: true,
    agent: true,
    centralized: true
  },
  api_component: 'wmodules',
  api_configuration: 'wmodules',
  api_module: 'open-scap',
  steps: [
    {
      title: 'Settings',
      description: '',
      elements: [
        {
          name: 'disabled',
          display_name: 'Disable the module',
          description: `Disables the OpenSCAP wodle.`,
          type: 'switch',
          required: true
        },
        {
          name: 'timeout',
          display_name: 'Evaluation timeout',
          description: 'Timeout for each evaluation in seconds',
          type: 'input-number',
          required: true,
          placeholder: 'Time in seconds',
          values: { min: 1 },
          default_value: 1800,
          validate_error_message: 'A positive number (seconds)'
        },
        {
          name: 'interval',
          display_name: 'Interval between executions',
          // description: 'Interval between OpenSCAP executions.',
          type: 'input',
          required: true,
          placeholder: 'Time in format <number><time unit suffix>, e.g.: 1d',
          default_value: '1d',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days).',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'scan-on-start',
          display_name: 'Scan on start',
          description: 'Run evaluation immediately when service is started.',
          type: 'switch',
          required: true,
          default_value: true
        }
      ]
    },
    {
      title: 'Content',
      description: 'Define evaluations.',
      elements: [
        {
          name: 'content',
          display_name: 'Content',
          description: `Define an evaluation.`,
          removable: true,
          required: true,
          repeatable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false
          },
          validate_error_message: 'Any directory or file name.',
          show_attributes: true,
          attributes: [
            {
              name: 'type',
              display_name: 'Profile type',
              description: 'Select content type: xccdf or oval.',
              type: 'select',
              required: true,
              values: [
                {value: 'xccdf', text: 'xccdf '},
                {value: 'oval', text: 'oval'}
              ],
              default_value: 'xccdf'
            },
            {
              name: 'path',
              display_name: 'Path of policy file',
              description: `Use the specified policy file (DataStream, XCCDF or OVAL).
              Default path: /var/ossec/wodles/oscap/content`,
              type: 'input',
              required: true,
              placeholder: 'Policy file',
              default_value: '/var/ossec/wodles/oscap/content',
              validate_error_message: 'Use the specified policy file'
            },
            {
              name: 'xccdf-id',
              display_name: 'XCCDF id',
              // description: 'XCCDF id.',
              type: 'input',
              placeholder: 'XCCDF id'
            },
            {
              name: 'oval-id',
              display_name: 'OVAL id',
              // description: 'OVAL id.',
              type: 'input',
              placeholder: 'OVAL id'
            },
            {
              name: 'datastream-id',
              display_name: 'Datastream id',
              // description: 'Datastream id.',
              type: 'input',
              placeholder: 'Datastream id'
            },
            {
              name: 'cpe',
              display_name: 'CPE',
              description: `CPE dictionary file.
              Default path: /var/ossec/wodles/oscap/content`,
              type: 'input',
              placeholder: '/var/ossec/wodles/oscap/content',
              default_value: '/var/ossec/wodles/oscap/content',
              validate_error_message: 'CPE dictionary file.'
            }
          ],
          show_options: true,
          options: [
            {
              name: 'timeout',
              display_name: 'Evaluation timeout',
              description: `Timeout for the evaluation (in seconds).
              Use of this attribute overwrites the generic timeout.`,
              type: 'input-number',
              placeholder: 'Time in seconds',
              values: { min: 1 },
              default_value: 1800,
              validate_error_message: 'A positive number'
            },
            {
              name: 'profile',
              display_name: 'Profile',
              description: 'Select profile.',
              type: 'input',
              placeholder: 'Profile',
              repeatable: true,
              removable: true,
              // required: true,
              repeatable_insert_first: true,
              repeatable_insert_first_properties: {
                removable: false
              }
            }
          ]
        }
      ]
    }
  ],
  mapAgentConfigurationAPIResponse(config){
    return {
      ...config,
      ...(typeof config.interval !== 'undefined' ? { interval: `${config.interval}s` } : {}),
      ...(typeof config.content !== 'undefined' ? { content: config.content.map(content => ({
        ...content,
        '@': Object.keys(content).filter(key => ['type', 'path'].includes(key)).reduce((accum, key) => {
          if(key === 'type'){
            if(content[key] === 1){
              accum[key] = 'xccdf'
            }
          }else{
            accum[key] = content[key];
          }
          return accum;
        }, {}),
        ...(typeof content.profile !== 'undefined' ? { profile : config.profile.map(profile => ({
          '@': Object.keys(profile).reduce((accum,key) => {
            accum[key] = content[key];
            return accum;
          }, {})
        }))} : {})
      }))} : {})
    }
  }
}