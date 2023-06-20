/*
* Wazuh app - System auditing interactive extension guide
* Copyright (C) 2015-2022 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import { webDocumentationLink } from "../../../../common/services/web_documentation";

export default {
  id: 'audit',
  name: 'System auditing',
  xml_tag: 'localfile',
  description: 'Configuration options of the System auditing extension.',
  category: 'Auditing and policy monitoring',
  documentation_link: webDocumentationLink('user-manual/reference/ossec-conf/localfile.html'),
  icon: 'securityApp',
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: 'Settings',
      description: '',
      elements: [
        {
          name: 'log_format',
          description: 'Set the format of the log to be read. field is required',
          type: 'input',
          required: true,
          placeholder: 'audit',
          default_value: 'audit',
          field_read_only: true
        },
        {
          name: 'location',
          description: 'Option to get the location of a log or a group of logs. strftime format strings may be used for log file names.',
          type: 'input',
          required: true,
          placeholder: 'Log or group of logs location',
          default_value: '/var/log/audit/audit.log',
          field_read_only: true
        },
        {
          name: 'command',
          description: 'Given a command output, it will be read as one or more log messages depending on command or full_command is used.',
          type: 'input',
          placeholder: 'Any command line, optionally including arguments'
        },
        {
          name: 'alias',
          description: 'Change a command name in the log message.',
          type: 'input',
          placeholder: 'Alias'
        },
        {
          name: 'frequency',
          description: 'Prevents a command from being executed in less time than the specified time (in seconds). This options can be used with command and full_command.',
          type: 'input-number',
          values: { min: 1 },
          default_value: '',
          placeholder: 'Frequency',
          validate_error_message: 'Any positive number of seconds'
        },
        {
          name: 'only-future-events',
          description: `Set it to no to collect events generated since Wazuh agent was stopped.
          By default, when Wazuh starts it will only read all log content from a given Windows Event Channel since the agent started.
          This feature is only compatible with eventchannel log format.`,
          type: 'switch',
          default_value: true
        },
        // { //Not for log_format audit
        //   name: 'query',
        //   description: 'Filter eventchannel events that Wazuh will process by using an XPATH query following the event schema.',
        //   type: 'input',
        //   placeholder: 'Any XPATH query following the event schema',
        //   validate_error_message: 'Any XPATH query following the event schema'
        // },
        // { //Not for log_format audit
        //   name: 'label',
        //   description: `Used to add custom data in JSON events. Set log_format to json to use it.
        //   Labels can be nested in JSON alerts by separating the “key” terms by a period.
        //   Here is an example of how to identify the source of each log entry when monitoring several files simultaneously:`,
        //   info: 'If a label key already exists in the log data, the configured field value will not be included. It is recommended that a unique label key is defined by using a symbol prior to the key name as in @source.',
        //   type: 'input',
        //   repeatable: true,
        //   placeholder: '',
        //   validate_error_message: ''
        // },
        {
          name: 'target',
          description: 'Target specifies the name of the socket where the output will be redirected. The socket must be defined previously.',
          type: 'input',
          default_value: 'agent',
          placeholder: 'Any defined socket'
        },
        {
          name: 'out_format',
          description: 'This option allows formatting logs from Logcollector using field substitution.',
          info: `log:	Message from the log.
          json_escaped_log:	Message from the log, escaping JSON reserver characters.
          output:	Output from a command. Alias of log.
          location:	Path to the source log file.
          command:	Command line or alias defined for the command. Alias of location.
          timestamp:	Current timestamp (when the log is sent), in RFC3164 format.
          timestamp <format>:	Custom timestamp, in strftime string format.
          hostname:	System’s host name.
          host_ip:	Host’s primary IP address.`,
          type: 'input',
          placeholder: 'Formatting logs from Logcollector using field substitution',
          show_attributes: true,
          attributes: [
            {
              name: 'target',
              description: 'This option selects a defined target to apply the output format',
              type: 'input',
              required: true,
              placeholder: 'Any target defined in the option <target>.'
            }
          ]
        },
        {
          name: 'ignore_binaries',
          description: `This specifies to ignore binary files, testing if the file is UTF8 or ASCII.
          If this is set to yes and the file is, for example, a binary file, it will be discarded.`,
          info: 'On Windows agents, it will also check if the file is encoded with UCS-2 LE BOM or UCS-2 BE BOM.',
          type: 'switch'
        },
        {
          name: 'age',
          description: `This specifies to read-only files that have been modified before the specified age.
          For example, if the age is set to 1 day, all files that have not been modified since 1 day will be ignored.`,
          type: 'input',
          placeholder: 'Time in format <number><time unit suffix>',
          validate_error_message: `A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days).`,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/
        },
        {
          name: 'exclude',
          description: `This indicates the location of a wild-carded group of logs to be excluded.
          For example, we may want to read all the files from a directory, but exclude those files whose name starts with an e.`,
          type: 'input',
          placeholder: 'Any log file or wildcard'
        },
        {
          name: 'exclude',
          description: `This indicates the location of a wild-carded group of logs to be excluded.
          For example, we may want to read all the files from a directory, but exclude those files whose name starts with an e.`,
          type: 'input',
          placeholder: 'Any log file or wildcard'
        }
      ]
    }
  ]
}