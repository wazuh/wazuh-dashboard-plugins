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
import { i18n } from '@kbn/i18n';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

const auditName = i18n.translate('wazuh.components.addModule.guide.auditName', {
  defaultMessage: 'System auditing',
});
const auditTag = i18n.translate('wazuh.components.addModule.guide.auditTag', {
  defaultMessage: 'localfile',
});
const auditDescp = i18n.translate('wazuh.components.addModule.guide.auditDescp', {
  defaultMessage: 'Configuration options of the System auditing extension.',
});
const auditCate = i18n.translate('wazuh.components.addModule.guide.auditCate', {
  defaultMessage: 'Auditing and policy monitoring',
});
const auditIcon = i18n.translate('wazuh.components.addModule.guide.auditIcon', {
  defaultMessage: 'securityApp',
});
const titleSet = i18n.translate('wazuh.components.addModule.guide.titleSet', {
  defaultMessage: 'Settings',
});
const formatName = i18n.translate('wazuh.components.addModule.guide.formatName', {
  defaultMessage: 'log_format',
});
const formatDescp = i18n.translate('wazuh.components.addModule.guide.formatDescp', {
  defaultMessage: 'Set the format of the log to be read. field is required',
});
const formatPlace = i18n.translate('wazuh.components.addModule.guide.formatPlace', {
  defaultMessage: 'audit',
});
const locName = i18n.translate('wazuh.components.addModule.guide.locName', {
  defaultMessage: 'location',
});
const locDescp = i18n.translate('wazuh.components.addModule.guide.locDescp', {
  defaultMessage:
    'Option to get the location of a log or a group of logs. strftime format strings may be used for log file names.',
});
const locPlace = i18n.translate('wazuh.components.addModule.guide.locPlace', {
  defaultMessage: 'Log or group of logs location',
});
const locDefault = i18n.translate('wazuh.components.addModule.guide.locDefault', {
  defaultMessage: '/var/log/audit/audit.log',
});
const commandName = i18n.translate('wazuh.components.addModule.guide.commandName', {
  defaultMessage: 'command',
});
const commandDescp = i18n.translate('wazuh.components.addModule.guide.commandDescp', {
  defaultMessage:
    'Given a command output, it will be read as one or more log messages depending on command or full_command is used.',
});
const commandPlace = i18n.translate('wazuh.components.addModule.guide.commandPlace', {
  defaultMessage: 'Any command line, optionally including arguments',
});
const aliasName = i18n.translate('wazuh.components.addModule.guide.aliasName', {
  defaultMessage: 'alias',
});
const aliasDescp = i18n.translate('wazuh.components.addModule.guide.aliasDescp', {
  defaultMessage: 'Change a command name in the log message.',
});
const aliasPlace = i18n.translate('wazuh.components.addModule.guide.aliasPlace', {
  defaultMessage: 'Alias',
});
const freName = i18n.translate('wazuh.components.addModule.guide.freName', {
  defaultMessage: 'frequency',
});
const freDescp = i18n.translate('wazuh.components.addModule.guide.freDescp', {
  defaultMessage:
    'Prevents a command from being executed in less time than the specified time (in seconds). This options can be used with command and full_command.',
});
const frePlace = i18n.translate('wazuh.components.addModule.guide.frePlace', {
  defaultMessage: 'Frequency',
});
const freError = i18n.translate('wazuh.components.addModule.guide.freError', {
  defaultMessage: 'Any positive number of seconds',
});
const eveName = i18n.translate('wazuh.components.addModule.guide.eveName', {
  defaultMessage: 'only-future-events',
});
const eveDescp = i18n.translate('wazuh.components.addModule.guide.eveDescp', {
  defaultMessage:
    'Set it to no to collect events generated since Wazuh agent was stopped.By default, when Wazuh starts it will only read all log content from a given Windows Event Channel since the agent started. This feature is only compatible with eventchannel log format.',
});
const tarName = i18n.translate('wazuh.components.addModule.guide.tarName', {
  defaultMessage: 'target',
});
const tarDescp = i18n.translate('wazuh.components.addModule.guide.tarDescp', {
  defaultMessage:
    'Target specifies the name of the socket where the output will be redirected. The socket must be defined previously.',
});
const tarDefault = i18n.translate('wazuh.components.addModule.guide.tarDefault', {
  defaultMessage: 'agent',
});
const tarPlace = i18n.translate('wazuh.components.addModule.guide.tarPlace', {
  defaultMessage: 'Any defined socket',
});
const outName = i18n.translate('wazuh.components.addModule.guide.outName', {
  defaultMessage: 'out_format',
});
const outDescp = i18n.translate('wazuh.components.addModule.guide.outDescp', {
  defaultMessage:
    'This option allows formatting logs from Logcollector using field substitution.',
});
const outInfo = i18n.translate('wazuh.components.addModule.guide.outinfo', {
  defaultMessage:
    'log:	Message from the log.json_escaped_log:	Message from the log, escaping JSON reserver characters.output:	Output from a command. Alias of log location:	Path to the source log file.command:	Command line or alias defined for the command. Alias of location.timestamp:	Current timestamp (when the log is sent), in RFC3164 format.timestamp <format>:	Custom timestamp, in strftime string format.hostname:	System’s host name. host_ip:	Host’s primary IP address.',
});
const outPlace = i18n.translate('wazuh.components.addModule.guide.outPlace', {
  defaultMessage: 'Formatting logs from Logcollector using field substitution',
});
const tar2Descp = i18n.translate('wazuh.components.addModule.guide.tar2Descp', {
  defaultMessage:
    'This option selects a defined target to apply the output format',
});
const tar2Place = i18n.translate('wazuh.components.addModule.guide.tar2Place', {
  defaultMessage: 'Any target defined in the option <target>.',
});
const ignName = i18n.translate('wazuh.components.addModule.guide.ignName', {
  defaultMessage: 'ignore_binaries',
});
const ignDescp = i18n.translate('wazuh.components.addModule.guide.ignDescp', {
  defaultMessage:
    'This specifies to ignore binary files, testing if the file is UTF8 or ASCII.If this is set to yes and the file is, for example, a binary file, it will be discarded.',
});
const ignInfo = i18n.translate('wazuh.components.addModule.guide.igninfo', {
  defaultMessage:
    'On Windows agents, it will also check if the file is encoded with UCS-2 LE BOM or UCS-2 BE BOM.',
});
const ageName = i18n.translate('wazuh.components.addModule.guide.ageName', {
  defaultMessage: 'age',
});
const ageDescp = i18n.translate('wazuh.components.addModule.guide.ageDescp', {
  defaultMessage:
    'This specifies to read-only files that have been modified before the specified age.For example, if the age is set to 1 day, all files that have not been modified since 1 day will be ignored.',
});
const agePlace = i18n.translate('wazuh.components.addModule.guide.agePlace', {
  defaultMessage: 'Time in format <number><time unit suffix>',
});
const ageError = i18n.translate('wazuh.components.addModule.guide.ageError', {
  defaultMessage:
    'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days).',
});
const excName = i18n.translate('wazuh.components.addModule.guide.excName', {
  defaultMessage: 'exclude',
});
const excDescp = i18n.translate('wazuh.components.addModule.guide.excDescp', {
  defaultMessage:
    'This indicates the location of a wild-carded group of logs to be excluded.For example, we may want to read all the files from a directory, but exclude those files whose name starts with an e.',
});
const excPlace = i18n.translate('wazuh.components.addModule.guide.excPlace', {
  defaultMessage: 'Any log file or wildcard',
});
export default {
  id: 'audit',
  name: auditName,
  xml_tag: auditTag,
  description: auditDescp,
  category: auditCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/localfile.html',
  ),
  icon: auditIcon,
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: titleSet,
      description: '',
      elements: [
        {
          name: formatName,
          description: formatDescp,
          type: 'input',
          required: true,
          placeholder: formatPlace,
          default_value: formatPlace,
          field_read_only: true,
        },
        {
          name: locName,
          description: locDescp,
          type: 'input',
          required: true,
          placeholder: locPlace,
          default_value: locDefault,
          field_read_only: true,
        },
        {
          name: commandName,
          description: commandDescp,
          type: 'input',
          placeholder: commandPlace,
        },
        {
          name: aliasName,
          description: aliasDescp,
          type: 'input',
          placeholder: aliasPlace,
        },
        {
          name: freName,
          description: freDescp,
          type: 'input-number',
          values: { min: 1 },
          default_value: '',
          placeholder: frePlace,
          validate_error_message: freError,
        },
        {
          name: eveName,
          description: eveDescp,
          type: 'switch',
          default_value: true,
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
          name: tarName,
          description: tarDescp,
          type: 'input',
          default_value: tarDefault,
          placeholder: tarPlace,
        },
        {
          name: outName,
          description: outDescp,
          info: outInfo,
          type: 'input',
          placeholder: outPlace,
          show_attributes: true,
          attributes: [
            {
              name: tarName,
              description: tar2Descp,
              type: 'input',
              required: true,
              placeholder: tar2Place,
            },
          ],
        },
        {
          name: ignName,
          description: ignDescp,
          info: ignInfo,
          type: 'switch',
        },
        {
          name: ageName,
          description: ageDescp,
          type: 'input',
          placeholder: agePlace,
          validate_error_message: ageError,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/,
        },
        {
          name: excName,
          description: excDescp,
          type: 'input',
          placeholder: excPlace,
        },
        {
          name: excName,
          description: excDescp,
          type: 'input',
          placeholder: excPlace,
        },
      ],
    },
  ],
};
