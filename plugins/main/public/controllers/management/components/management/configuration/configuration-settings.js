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
import { docker as dockerApp } from '../../../../../utils/applications';

export default [
  {
    title: 'Main configurations',
    description: '',
    settings: [
      {
        name: 'Global Configuration',
        description: 'Global and remote settings',
        goto: 'global-configuration',
        when: 'manager',
      },
      /*{ FIXME: Either remove cluster section or edit the endpoint it  
                uses (if there is a valid endpoint with the info)
        name: 'Cluster',
        description: 'Master node configuration',
        goto: 'cluster',
        when: 'manager',
      },*/
      {
        name: 'Registration Service',
        description: 'Automatic agent registration service',
        goto: 'registration-service',
        when: 'manager',
      },
      {
        name: 'Global Configuration',
        description: 'Logging settings that apply to the agent',
        goto: 'global-configuration-agent',
        when: 'agent',
      },
      {
        name: 'Communication',
        description: 'Settings related to the connection with the manager',
        goto: 'client',
        when: 'agent',
      },
      {
        name: 'Anti-flooding settings',
        description: 'Agent bucket parameters to avoid event flooding',
        goto: 'client-buffer',
        when: 'agent',
      },
      // Wazuh: Removed this section for the agent.
      // {
      //   name: 'Labels',
      //   description:
      //     'User-defined information about the agent included in alerts',
      //   goto: 'alerts-agent',
      //   when: 'agent',
      // },
    ],
  },
  {
    // Wazuh: Removed this section for the manager.
    title: 'Auditing and policy monitoring',
    description: '',
    settings: [
      {
        name: 'Policy monitoring',
        description:
          'Configuration to ensure compliance with security policies, standards and hardening guides',
        goto: 'policy-monitoring',
        when: 'agent',
      },
    ],
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
        when: 'manager',
      },
      {
        // Wazuh: Removed this section for the manager.
        name: 'Inventory data',
        description:
          'Gather relevant information about system operating system, hardware, networking and packages',
        goto: 'inventory',
        when: 'agent',
      },
      {
        name: 'Commands',
        description: 'Configuration options of the Command wodle',
        goto: 'commands',
      },
    ],
  },
  {
    // Wazuh: Removed this section for the manager.
    title: 'Log data analysis',
    description: '',
    settings: [
      {
        name: 'Log collection',
        description:
          'Log analysis from text files, Windows events or syslog outputs',
        goto: 'log-collection',
        when: 'agent',
      },
      {
        name: 'Integrity monitoring',
        description:
          'Identify changes in content, permissions, ownership, and attributes of files',
        goto: 'integrity-monitoring',
        when: 'agent',
      },
    ],
  },
];
