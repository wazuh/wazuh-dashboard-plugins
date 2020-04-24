/*
 * Wazuh app - Definitions of configuration sections.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { shouldShowComponent } from './utils/wz-utils';

export default [
  {
    title: 'Main configurations',
    description: '',
    settings: [
      {
        name: 'Global Configuration',
        description: 'Global and remote settings',
        goto: 'global-configuration',
        when: 'manager'
      },
      {
        name: 'Cluster',
        description: 'Master node configuration',
        goto: 'cluster',
        when: 'manager'
      },
      {
        name: 'Registration Service',
        description: 'Automatic agent registration service',
        goto: 'registration-service',
        when: 'manager'
      },
      {
        name: 'Global Configuration',
        description: 'Logging settings that apply to the agent',
        goto: 'global-configuration-agent',
        when: 'agent'
      },
      {
        name: 'Communication',
        description: 'Settings related to the connection with the manager',
        goto: 'client',
        when: 'agent'
      },
      {
        name: 'Anti-flooding settings',
        description: 'Agent bucket parameters to avoid event flooding',
        goto: 'client-buffer',
        when: 'agent'
      },
      {
        name: 'Labels',
        description:
          'User-defined information about the agent included in alerts',
        goto: 'alerts-agent',
        when: 'agent'
      }
      // ,
      // { //TODO: Uncomment this to activate Log Settings
      //   name: 'Log settings',
      //   description: 'Alerts, archives and internal settings',
      //   goto: 'log-settings'
      // }
    ]
  },
  {
    title: 'Alerts and output management',
    description: '',
    settings: [
      {
        name: 'Alerts',
        description: 'Settings related to the alerts and their format',
        goto: 'alerts',
        when: 'manager'
      },
      {
        name: 'Integrations',
        description:
          'Slack, VirusTotal and PagerDuty integrations with external APIs',
        goto: 'integrations',
        when: 'manager'
      }
    ]
  },
  {
    title: 'Auditing and policy monitoring',
    description: '',
    settings: [
      {
        name: 'Policy monitoring',
        description:
          'Configuration to ensure compliance with security policies, standards and hardening guides',
        goto: 'policy-monitoring'
      },
      {
        name: 'OpenSCAP',
        description:
          'Configuration assessment and automation of compliance monitoring using SCAP checks',
        goto: 'open-scap',
        when: agent => shouldShowComponent('oscap', agent)
      },
      {
        name: 'CIS-CAT',
        description:
          'Configuration assessment using CIS scanner and SCAP checks',
        goto: 'cis-cat'
      }
    ]
  },
  {
    title: 'System threats and incident response',
    description: '',
    settings: [
      {
        name: 'Vulnerabilities',
        description:
          'Discover what applications are affected by well-known vulnerabilities',
        goto: 'vulnerabilities',
        when: 'manager'
      },
      {
        name: 'Osquery',
        description:
          'Expose an operating system as a high-performance relational database',
        goto: 'osquery'
      },
      {
        name: 'Inventory data',
        description:
          'Gather relevant information about system OS, hardware, networking and packages',
        goto: 'inventory'
      },
      {
        name: 'Active Response',
        description: 'Active threat addressing by inmmediate response',
        goto: 'active-response',
        when: 'manager'
      },
      {
        name: 'Active response',
        description: 'Active threat addressing by inmmediate response',
        goto: 'active-response-agent',
        when: 'agent'
      },
      {
        name: 'Commands',
        description: 'Configuration options of the Command wodle',
        goto: 'commands'
      },
      {
        name: 'Docker listener',
        description:
          'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events',
        goto: 'docker-listener',
        when: agent => shouldShowComponent('docker', agent)
      }
    ]
  },
  {
    title: 'Log data analysis',
    description: '',
    settings: [
      {
        name: 'Log collection',
        description:
          'Log analysis from text files, Windows events or syslog outputs',
        goto: 'log-collection'
      },
      {
        name: 'Integrity monitoring',
        description:
          'Identify changes in content, permissions, ownership, and attributes of files',
        goto: 'integrity-monitoring'
      },
      {
        name: 'Agentless',
        description:
          'Run integrity checks on devices such as routers, firewalls and switches',
        goto: 'agentless',
        when: 'manager'
      }
    ]
  },
  {
    title: 'Cloud security monitoring',
    description: '',
    settings: [
      {
        name: 'Amazon S3',
        description:
          'Security events related to Amazon AWS services, collected directly via AWS API',
        goto: 'aws-s3',
        when: 'manager'
      },
      {
        name: 'Azure Logs',
        description: 'Configuration options of the Azure-Logs wodle',
        goto: 'azure-logs',
        when: 'manager'
      }
    ]
  }
];
