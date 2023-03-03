/*
 * Wazuh app - VirusTotal interactive extension guide
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
const virusName = i18n.translate('wazuh.components.addModule.guide.virusName', {
  defaultMessage: 'VirusTotal',
});
const virusTag = i18n.translate('wazuh.components.addModule.guide.virusTag', {
  defaultMessage: 'integration',
});
const virusDescp = i18n.translate('wazuh.components.addModule.guide.virusDescp', {
  defaultMessage: 'Configuration options of the VirusTotal integration.',
});
const virusCate = i18n.translate('wazuh.components.addModule.guide.virusCate', {
  defaultMessage: 'Threat detection and response',
});

const title = i18n.translate('wazuh.components.addModule.guide.requiredSetting', {
  defaultMessage: 'Required settings',
});
const serviceName = i18n.translate('wazuh.components.addModule.guide.serviceName', {
  defaultMessage: 'name',
});
const serviceDescp = i18n.translate('wazuh.components.addModule.guide.serviceDescp', {
  defaultMessage: 'This indicates the service to integrate with.',
});
const serviceDefault = i18n.translate(
  'wazuh.components.addModule.guide.serviceDefault',
  {
    defaultMessage: 'virustotal',
  },
);
const apiKeyName = i18n.translate('wazuh.components.addModule.guide.apiKeyName', {
  defaultMessage: 'api_key',
});
const apiKeyDescp = i18n.translate('wazuh.components.addModule.guide.apiKeyDescp', {
  defaultMessage:
    'This is the key that you would have retrieved from the VirusTotal API.',
});
const apiKeyPlace = i18n.translate('wazuh.components.addModule.guide.apiKeyPlace', {
  defaultMessage: 'VirusTotal Api key',
});
const title1 = i18n.translate('wazuh.components.addModule.guide.optionalSetting', {
  defaultMessage: 'Optional settings',
});
const levelName = i18n.translate('wazuh.components.addModule.guide.levelName', {
  defaultMessage: 'level',
});
const levelDescp = i18n.translate('wazuh.components.addModule.guide.levelDescp', {
  defaultMessage:
    'This filters alerts by rule level so that only alerts with the specified level or above are pushed.',
});
const levelPlace = i18n.translate('wazuh.components.addModule.guide.levelPlace', {
  defaultMessage: 'Any alert level from 0 to 16',
});
const levelError = i18n.translate('wazuh.components.addModule.guide.levelError', {
  defaultMessage: 'Any alert level from 0 to 16',
});
const ruleIdName = i18n.translate('wazuh.components.addModule.guide.ruleIdName', {
  defaultMessage: 'rule_id',
});
const ruleIdDescp = i18n.translate('wazuh.components.addModule.guide.ruleIdDescp', {
  defaultMessage: 'This filters alerts by rule ID.',
});
const ruleIdPlace = i18n.translate('wazuh.components.addModule.guide.ruleIdPlace', {
  defaultMessage: 'Comma-separated rule IDs',
});
const ruleIdError = i18n.translate('wazuh.components.addModule.guide.ruleIdError', {
  defaultMessage: 'Comma-separated rule IDs',
});
const groupName = i18n.translate('wazuh.components.addModule.guide.groupName', {
  defaultMessage: 'group',
});
const groupDescp = i18n.translate('wazuh.components.addModule.guide.groupDescp', {
  defaultMessage:
    'TThis filters alerts by rule group. For the VirusTotal integration, only rules from the syscheck group are available.',
});
const groupPlace = i18n.translate('wazuh.components.addModule.guide.groupPlace', {
  defaultMessage: 'Any rule group or comma-separated rule groups.',
});
const eventName = i18n.translate('wazuh.components.addModule.guide.eventName', {
  defaultMessage: 'event_location',
});
const eventDescp = i18n.translate('wazuh.components.addModule.guide.eventDescp', {
  defaultMessage:
    "This filters alerts by where the event originated. Follows the OS_Regex Syntax.'",
});
const eventPlace = i18n.translate('wazuh.components.addModule.guide.eventPlace', {
  defaultMessage: 'Any single log file.',
});
const alertName = i18n.translate('wazuh.components.addModule.guide.alertName', {
  defaultMessage: 'alert_format',
});
const alertDescp = i18n.translate('wazuh.components.addModule.guide.alertDescp', {
  defaultMessage:
    'This writes the alert file in the JSON format. The Integrator makes use this file to fetch fields values.',
});
const alertPlace = i18n.translate('wazuh.components.addModule.guide.alertPlace', {
  defaultMessage: 'json',
});
const alertError = i18n.translate('wazuh.components.addModule.guide.alertError', {
  defaultMessage: 'json',
});
const maxLogName = i18n.translate('wazuh.components.addModule.guide.maxLogName', {
  defaultMessage: 'max_log',
});
const maxLogDescp = i18n.translate('wazuh.components.addModule.guide.maxLogDescp', {
  defaultMessage:
    'The maximum length of an alert snippet that will be sent to the Integrator. Longer strings will be truncated with ...',
});
const maxLogPlace = i18n.translate('wazuh.components.addModule.guide.maxLogPlace', {
  defaultMessage: 'Any integer from 165 to 1024 inclusive.',
});
const maxLogError = i18n.translate('wazuh.components.addModule.guide.maxLogError', {
  defaultMessage: 'Any integer from 165 to 1024 inclusive.',
});
export default {
  id: 'virustotal',
  xml_tag: virusTag,
  name: virusName,
  description: virusDescp,
  category: virusCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/integration.html',
  ),
  icon: 'securityApp',
  avaliable_for_manager: true,
  steps: [
    {
      title: title,
      description: '',
      elements: [
        {
          name: serviceName,
          description: serviceDescp,
          type: 'input',
          required: true,
          default_value: serviceDefault,
          field_read_only: true,
        },
        {
          name: apiKeyName,
          description: apiKeyDescp,
          type: 'input',
          required: true,
          placeholder: apiKeyPlace,
        },
      ],
    },
    {
      title: title1,
      description: '',
      elements: [
        {
          name: levelName,
          description: levelDescp,
          type: 'input-number',
          values: { min: 0, max: 16 },
          default_value: 0,
          placeholder: levelPlace,
          validate_error_message: levelError,
        },
        {
          name: ruleIdName,
          description: ruleIdDescp,
          type: 'input',
          default_value: '',
          placeholder: ruleIdPlace,
          validate_error_message: ruleIdError,
        },
        {
          name: groupName,
          description: groupDescp,
          type: 'input',
          placeholder: groupPlace,
        },
        {
          name: eventName,
          description: eventDescp,
          type: 'input',
          placeholder: eventPlace,
        },
        {
          name: alertName,
          description: alertDescp,
          type: 'input',
          placeholder: alertPlace,
          default_value: 'json',
          field_read_only: true,
          validate_error_message: alertError,
        },
        {
          name: maxLogName,
          description: maxLogDescp,
          type: 'input-number',
          values: { min: 165, max: 1024 },
          default_value: 165,
          placeholder: maxLogPlace,
          validate_error_message: maxLogError,
        },
      ],
    },
  ],
};
