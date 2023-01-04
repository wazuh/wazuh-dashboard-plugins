/*
 * Wazuh app - Definitions of configuration sections.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { hasAgentSupportModule } from '../../../../../react-services/wz-agents';
import { WAZUH_MODULES_ID } from '../../../../../../common/constants';
import { i18n } from '@kbn/i18n';
const descp1 = i18n.translate('controller.manage.comp.confi.setting.descp1', {
  defaultMessage: 'Global and remote settings',
});
const descp2 = i18n.translate('controller.manage.comp.confi.setting.descp2', {
  defaultMessage: 'Master node configuration',
});
const descp3 = i18n.translate('controller.manage.comp.confi.setting.descp3', {
  defaultMessage: 'Automatic agent registration service',
});
const descp4 = i18n.translate('controller.manage.comp.confi.setting.descp4', {
  defaultMessage: 'Logging settings that apply to the agent',
});
const descp5 = i18n.translate('controller.manage.comp.confi.setting.descp5', {
  defaultMessage: 'Settings related to the connection with the manager',
});
const descp6 = i18n.translate('controller.manage.comp.confi.setting.descp6', {
  defaultMessage: 'Agent bucket parameters to avoid event flooding',
});
const descp7 = i18n.translate('controller.manage.comp.confi.setting.descp7', {
  defaultMessage: 'User-defined information about the agent included in alerts',
});
const descp8 = i18n.translate('controller.manage.comp.confi.setting.descp8', {
  defaultMessage: 'Settings related to the alerts and their format',
});
const descp9 = i18n.translate('controller.manage.comp.confi.setting.descp9', {
  defaultMessage:
    'Slack, VirusTotal and PagerDuty integrations with external APIs',
});
const descp10 = i18n.translate('controller.manage.comp.confi.setting.descp', {
  defaultMessage:
    'Configuration to ensure compliance with security policies, standards and hardening guides',
});
const descp11 = i18n.translate('controller.manage.comp.confi.setting.descp11', {
  defaultMessage:
    'Configuration assessment and automation of compliance monitoring using SCAP checks',
});
const descp12 = i18n.translate('controller.manage.comp.confi.setting.descp12', {
  defaultMessage: 'Configuration assessment using CIS scanner and SCAP checks',
});
const descp13 = i18n.translate('controller.manage.comp.confi.setting.descp13', {
  defaultMessage:
    'Discover what applications are affected by well-known vulnerabilities',
});
const descp14 = i18n.translate('controller.manage.comp.confi.setting.descp14', {
  defaultMessage:
    'Expose an operating system as a high-performance relational database',
});
const descp15 = i18n.translate('controller.manage.comp.confi.setting.descp15', {
  defaultMessage:
    'Gather relevant information about system OS, hardware, networking and packages',
});
const descp16 = i18n.translate('controller.manage.comp.confi.setting.descp16', {
  defaultMessage: 'Active threat addressing by immediate response',
});
const descp17 = i18n.translate('controller.manage.comp.confi.setting.descp17', {
  defaultMessage: 'Active threat addressing by immediate response',
});
const descp18 = i18n.translate('controller.manage.comp.confi.setting.descp18', {
  defaultMessage:
    'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events',
});
const descp19 = i18n.translate('controller.manage.comp.confi.setting.descp19', {
  defaultMessage:
    "Log analysis from text files, Windows events or syslog outputs'",
});
const descp20 = i18n.translate('controller.manage.comp.confi.setting.descp20', {
  defaultMessage:
    'Identify changes in content, permissions, ownership, and attributes of files',
});
const descp21 = i18n.translate('controller.manage.comp.confi.setting.descp21', {
  defaultMessage:
    'Run integrity checks on devices such as routers, firewalls and switches',
});
const descp22 = i18n.translate('controller.manage.comp.confi.setting.descp22', {
  defaultMessage:
    'Security events related to Amazon AWS services, collected directly via AWS API',
});
const descp23 = i18n.translate('controller.manage.comp.confi.setting.descp23', {
  defaultMessage: 'Configuration options of the Azure Logs wodle',
});
const descp24 = i18n.translate('controller.manage.comp.confi.setting.descp24', {
  defaultMessage: 'Configuration options of the Google Cloud Pub/Sub module',
});
const descp25 = i18n.translate('controller.manage.comp.confi.setting.descp25', {
  defaultMessage: 'Detect threats targeting GitHub organizations',
});
const descp26 = i18n.translate('controller.manage.comp.confi.setting.descp26', {
  defaultMessage: 'Configuration options of the Office 365 module',
});
const descp27 = i18n.translate('controller.manage.comp.confi.setting.descp27', {
  defaultMessage: 'Configuration options of the Command wodle',
});

const Title1 = i18n.translate('controller.manage.comp.confi.setting.Title1', {
  defaultMessage: 'Main configurations',
});
const Title2 = i18n.translate('controller.manage.comp.confi.setting.Title2', {
  defaultMessage: 'Alerts and output management',
});
const Title3 = i18n.translate('controller.manage.comp.confi.setting.Title3', {
  defaultMessage: 'Auditing and policy monitoring',
});
const Title4 = i18n.translate('controller.manage.comp.confi.setting.title4', {
  defaultMessage: 'System threats and incident response',
});
const Title5 = i18n.translate('controller.manage.comp.confi.setting.title5', {
  defaultMessage: 'Log data analysis',
});
const Title6 = i18n.translate('controller.manage.comp.confi.setting.title6', {
  defaultMessage: 'Cloud security monitoring',
});

export default [
  {
    title: Title1,
    description: '',
    settings: [
      {
        name: 'Global Configuration',
        description: descp1,
        goto: 'global-configuration',
        when: 'manager',
      },
      {
        name: 'Cluster',
        description: descp2,
        goto: 'cluster',
        when: 'manager',
      },
      {
        name: 'Registration Service',
        description: descp3,
        goto: 'registration-service',
        when: 'manager',
      },
      {
        name: 'Global Configuration',
        description: descp4,
        goto: 'global-configuration-agent',
        when: 'agent',
      },
      {
        name: 'Communication',
        description: descp5,
        goto: 'client',
        when: 'agent',
      },
      {
        name: 'Anti-flooding settings',
        description: descp6,
        goto: 'client-buffer',
        when: 'agent',
      },
      {
        name: 'Labels',
        description: descp7,
        goto: 'alerts-agent',
        when: 'agent',
      },
      // ,
      // { //TODO: Uncomment this to activate Log Settings
      //   name: 'Log settings',
      //   description: 'Alerts, archives and internal settings',
      //   goto: 'log-settings'
      // }
    ],
  },
  {
    title: Title2,
    description: '',
    settings: [
      {
        name: 'Alerts',
        description: descp8,
        goto: 'alerts',
        when: 'manager',
      },
      {
        name: 'Integrations',
        description: descp9,
        goto: 'integrations',
        when: 'manager',
      },
    ],
  },
  {
    title: Title3,
    description: '',
    settings: [
      {
        name: 'Policy monitoring',
        description: descp10,
        goto: 'policy-monitoring',
      },
      {
        name: 'OpenSCAP',
        description: descp11,
        goto: 'open-scap',
        when: agent => hasAgentSupportModule(agent, WAZUH_MODULES_ID.OPEN_SCAP),
      },
      {
        name: 'CIS-CAT',
        description: descp12,
        goto: 'cis-cat',
      },
    ],
  },
  {
    title: Title4,
    description: '',
    settings: [
      {
        name: 'Vulnerabilities',
        description: descp13,
        goto: 'vulnerabilities',
        when: 'manager',
      },
      {
        name: 'Osquery',
        description: descp14,
        goto: 'osquery',
      },
      {
        name: 'Inventory data',
        description: descp15,
        goto: 'inventory',
      },
      {
        name: 'Active Response',
        description: descp16,
        goto: 'active-response',
        when: 'manager',
      },
      {
        name: 'Active response',
        description: descp17,
        goto: 'active-response-agent',
        when: 'agent',
      },
      {
        name: 'Commands',
        description: descp27,
        goto: 'commands',
      },
      {
        name: 'Docker listener',
        description: descp18,
        goto: 'docker-listener',
        when: agent => hasAgentSupportModule(agent, WAZUH_MODULES_ID.DOCKER),
      },
    ],
  },
  {
    title: Title5,
    description: '',
    settings: [
      {
        name: 'Log collection',
        description: descp19,
        goto: 'log-collection',
      },
      {
        name: 'Integrity monitoring',
        description: descp20,
        goto: 'integrity-monitoring',
      },
      {
        name: 'Agentless',
        description: descp21,
        goto: 'agentless',
        when: 'manager',
      },
    ],
  },
  {
    title: Title6,
    description: '',
    settings: [
      {
        name: 'Amazon S3',
        description: descp22,
        goto: 'aws-s3',
      },
      {
        name: 'Azure Logs',
        description: descp23,
        goto: 'azure-logs',
        when: 'manager',
      },
      {
        name: 'Google Cloud Pub/Sub',
        description: descp24,
        goto: 'gcp-pubsub',
      },
      {
        name: 'GitHub',
        description: descp25,
        goto: 'github',
      },
      {
        name: 'Office 365',
        description: descp27,
        goto: 'office365',
        when: 'manager',
      },
    ],
  },
];
