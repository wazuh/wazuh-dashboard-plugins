/*
 * Wazuh app - Docker listener interactive extension guide
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';
const dockerName = i18n.translate('wazuh.components.addModule.guide.dockerName', {
  defaultMessage: 'Docker Listener',
});
const dockerWodleName = i18n.translate(
  'wazuh.components.addModule.guide.dockerWodleName',
  {
    defaultMessage: 'docker-listener',
  },
);
const dockerDescp = i18n.translate('wazuh.components.addModule.guide.dockerDescp', {
  defaultMessage: 'Configuration options of the Docker wodle.',
});
const dockerCate = i18n.translate('wazuh.components.addModule.guide.dockerCate', {
  defaultMessage: 'Threat detection and response',
});
const callOutWar = i18n.translate('wazuh.components.addModule.guide.docker.callOutWar', {
  defaultMessage:
    'CIS-CAT is not installed by default. It is a proprietary software that you have to obtain for using this module.',
});
const title = i18n.translate('wazuh.components.addModule.guide.titleSetting', {
  defaultMessage: 'Settings',
});
const disName = i18n.translate('wazuh.components.addModule.guide.disName', {
  defaultMessage: 'disabled',
});
const disDescp = i18n.translate('wazuh.components.addModule.guide.disableDocker', {
  defaultMessage: 'Disables the Docker wodle.',
});
const intervalName = i18n.translate('wazuh.components.addModule.guide.intervalName', {
  defaultMessage: 'interval',
});
const intervalDescp = i18n.translate(
  'wazuh.components.addModule.guide.intervalDescp.docker',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit, such as, s (seconds), m (minutes), h (hours), d (days)',
  },
);
const intervalPlace = i18n.translate(
  'wazuh.components.addModule.guide.intervalPlace',
  {
    defaultMessage: 'Time in format <number><time unit suffix>',
  },
);
const intervalError = i18n.translate(
  'wazuh.components.addModule.guide.docker.intervalError',
  {
    defaultMessage:
      'A positive number that should contain a suffix character indicating a time unit. e.g.: 1m',
  },
);
const intervalDefault = i18n.translate(
  'wazuh.components.addModule.guide.intervalDefault1',
  {
    defaultMessage: '1m',
  },
);

const attemptsName = i18n.translate('wazuh.components.addModule.guide.attemptsName', {
  defaultMessage: 'attempts',
});
const attemptsDescp = i18n.translate(
  'wazuh.components.addModule.guide.attemptsDescp',
  {
    defaultMessage: 'Number of attempts to execute the wodle.',
  },
);
const attemptsPlace = i18n.translate(
  'wazuh.components.addModule.guide.attemptsPlace',
  {
    defaultMessage: 'Number of attempts',
  },
);
const attemptsError = i18n.translate(
  'wazuh.components.addModule.guide.attemptsError',
  {
    defaultMessage: 'Number of attempts to execute the wodle.',
  },
);
const runCommandName = i18n.translate(
  'wazuh.components.addModule.guide.runCommandName',
  {
    defaultMessage: 'run_on_start',
  },
);
const runCommandDescp = i18n.translate(
  'wazuh.components.addModule.guide.runCommandDescp',
  {
    defaultMessage: 'Run command immediately when service is started.',
  },
);
export default {
  id: 'docker',
  name: dockerName,
  wodle_name: dockerWodleName,
  description: dockerDescp,
  category: dockerCate,
  documentation_link: webDocumentationLink(
    'user-manual/reference/ossec-conf/wodle-docker.html',
  ),
  icon: 'logoDocker',
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: title,
      description: '',
      elements: [
        {
          name: disName,
          description: disDescp,
          type: 'switch',
          required: true,
        },
        {
          name: intervalName,
          description: intervalDescp,
          type: 'input',
          required: true,
          placeholder: intervalPlace,
          default_value: intervalDefault,
          validate_error_message: intervalError,
          validate_regex: /^[1-9]\d*[s|m|h|d]$/,
        },
        {
          name: attemptsName,
          description: attemptsDescp,
          type: 'input-number',
          required: true,
          placeholder: attemptsPlace,
          values: { min: 1 },
          default_value: 5,
          validate_error_message: attemptsError,
        },
        {
          name: runCommandName,
          description: runCommandDescp,
          type: 'switch',
          required: true,
          default_value: true,
        },
      ],
    },
  ],
};
