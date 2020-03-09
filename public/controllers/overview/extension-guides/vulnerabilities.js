export default {
  id: 'vuls',
  xml_tag: 'vulnerabilities-detector',
  name: 'Vulnerabilities',
  description: 'Configuration options for vulnerabilities.',
  documentation_link: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/vuln-detector.html',
  icon: 'securityApp',
  avaliable_for_manager: true,
  steps: [
    {
      title: 'Settings',
      description: '',
      elements: [
        {
          name: 'enabled',
          description: `Enables the module.`,
          type: 'switch',
          required: true
        },
        {
          name: 'interval',
          description: `Time between vulnerabilities scans.`,
          type: 'input',
          required: true,
          default_value: '5m',
          placeholder: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'run_on_start',
          description: `Runs updates and vulnerabilities scans immediately when service is started.`,
          type: 'switch',
          required: true,
          default_value: true
        },
        {
          name: 'ignore_time',
          description: `Time during which vulnerabilities that have already been alerted will be ignored.`,
          type: 'input',
          default_value: '6h',
          placeholder: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
          validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'provider',
          description: `Configuration block to specify vulnerability updates.`,
          repeatable: true,
          required: true,
          removable: true,
          attributes: [
            {
              name: 'name',
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
            },
            
          ],
          show_options: true,
          options: [
            {
              name: 'enabled',
              description: 'Enables the vulnerability provider update.',
              type: 'switch',
              required: true
            },
            {
              name: 'os',
              description: 'Feed to update.',
              type: 'select',
              repeatable: true,
              removable: true,
              values: [
                {value: 'canonical', text: 'canonical'},
                {value: 'debian', text: 'debian'},
                {value: 'redhat', text: 'redhat'},
                {value: 'nvd', text: 'nvd'}
              ],
              default_value: 'canonical',
              attributes: [
                {
                  name: 'update_interval',
                  description: 'How often the vulnerability database is updated. It has priority over the update_interval option of the provider block.',
                  type: 'input',
                  validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
                  validate_regex: /^[1-9]\d*[s|m|h|d]$/
                },
                {
                  name: 'url',
                  description: 'Defines the link to an alternative OVAL files.',
                  type: 'input',
                  placeholder: 'Link to download the OVAL file obtained from Canonical or Debian.'
                },
                {
                  name: 'path',
                  description: 'Defines the path to an alternative OVAL file.',
                  type: 'input',
                  placeholder: ''
                },
                {
                  name: 'port',
                  description: 'Defines the connection port when using the url attribute.',
                  type: 'input-number',
                  values: {min: 0},
                  validate_error_message: 'A valid port.'
                },
                {
                  name: 'allow',
                  description: 'Defines compatibility with unsupported systems.',
                  info: 'You can find a guide on how to set it up https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/allow_os.html',
                  type: 'input',
                  validate_error_message: 'A valid operating system not supported by default.'
                }
              ]
            },
            {
              name: 'update_interval',
              description: 'How often the vulnerabilities of the provider are updated. It can be overwritten by the attribute with the same name of <os>.',
              type: 'input',
              default_value: '1h',
              placeholder: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
              validate_error_message: 'A positive number that should contain a suffix character indicating a time unit: s (seconds), m (minutes), h (hours) or d (days).',
              validate_regex: /^[1-9]\d*[s|m|h|d|w|M]$/
            },
            {
              name: 'update_from_year',
              description: 'Year from which the provider will be updated.',
              default_value: '2010',
              type: 'input',
              placeholder: 'Year from which the provider will be updated.'
            },
            {
              name: 'allow',
              description: 'Defines compatibility with unsupported systems.',
              attributes: [
                {
                  name: 'replaced_os',
                  description: 'Defines the version of Red Hat that will replace the unsupported system.',
                  type: 'input',
                  placeholder: 'A numeric value that in substitution with the tag forms a valid link.'
                }
              ]
            },
            {
              name: 'url',
              description: 'Defines the link to an alternative feed files.',
              type: 'input',
              placeholder:'Defines the link to an alternative feed files.',
              attributes: [
                {
                  name: 'start',
                  description: 'Defines the first value which the tag will be substituted.',
                  type: 'input-number',
                  values: {min: 0},
                  placeholder: 'A numeric value that in substitution with the tag forms a valid link.'
                },
                {
                  name: 'end',
                  description: 'Defines the last value which the tag will be substituted.',
                  type: 'input-number',
                  values: {min: 0},
                  placeholder: 'A numeric value that in substitution with the tag forms a valid link.'
                },
                {
                  name: 'port',
                  description: 'Defines the connection port.',
                  type: 'input-number',
                  values: {min: 0},
                  placeholder: 'A valid port.'
                }
              ]
            },
            {
              name: 'path',
              description: 'Defines the path to an alternative feed files.',
              type: 'input',
              placeholder: 'A valid path'
            }
          ]
        }
      ]
    }
  ]
}
