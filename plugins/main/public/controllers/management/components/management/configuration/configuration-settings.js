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

import { i18n } from '@osd/i18n';
import { hasAgentSupportModule } from '../../../../../react-services/wz-agents';
import { WAZUH_MODULES_ID } from '../../../../../../common/constants';
import { docker as dockerApp } from '../../../../../utils/applications';

export default [
  {
    title: i18n.translate(
      'wazuh.configuration.settingsGroups.mainConfigurationsTitle',
      {
        defaultMessage: 'Main configurations',
      },
    ),
    description: '',
    settings: [
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.globalConfigurationName',
          {
            defaultMessage: 'Global Configuration',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.globalConfigurationDescription',
          {
            defaultMessage: 'Global and remote settings',
          },
        ),
        goto: 'global-configuration',
        when: 'manager',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.clusterName',
          {
            defaultMessage: 'Cluster',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.clusterDescription',
          {
            defaultMessage: 'Master node configuration',
          },
        ),
        goto: 'cluster',
        when: 'manager',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.indexerName',
          {
            defaultMessage: 'Indexer',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.indexerDescription',
          {
            defaultMessage: 'Indexer connection and SSL settings',
          },
        ),
        goto: 'indexer',
        when: 'manager',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.registrationServiceName',
          {
            defaultMessage: 'Registration Service',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.registrationServiceDescription',
          {
            defaultMessage: 'Automatic agent registration service',
          },
        ),
        goto: 'registration-service',
        when: 'manager',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.globalConfigurationAgentName',
          {
            defaultMessage: 'Global Configuration',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.globalConfigurationAgentDescription',
          {
            defaultMessage: 'Logging settings that apply to the agent',
          },
        ),
        goto: 'global-configuration-agent',
        when: 'agent',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.clientName',
          {
            defaultMessage: 'Communication',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.clientDescription',
          {
            defaultMessage:
              'Settings related to the connection with the manager',
          },
        ),
        goto: 'client',
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
    title: i18n.translate(
      'wazuh.configuration.settingsGroups.auditingAndPolicyMonitoringTitle',
      {
        defaultMessage: 'Auditing and policy monitoring',
      },
    ),
    description: '',
    settings: [
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.policyMonitoringName',
          {
            defaultMessage: 'Policy monitoring',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.policyMonitoringDescription',
          {
            defaultMessage:
              'Configuration to ensure compliance with security policies, standards, and hardening guides',
          },
        ),
        goto: 'policy-monitoring',
        when: 'agent',
      },
    ],
  },
  {
    title: i18n.translate(
      'wazuh.configuration.settingsGroups.systemThreatsAndIncidentResponseTitle',
      {
        defaultMessage: 'System threats and incident response',
      },
    ),
    description: '',
    settings: [
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.vulnerabilitiesName',
          {
            defaultMessage: 'Vulnerabilities',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.vulnerabilitiesDescription',
          {
            defaultMessage:
              'Discover what applications are affected by well-known vulnerabilities',
          },
        ),
        goto: 'vulnerabilities',
        when: 'manager',
      },
      {
        // Wazuh: Removed this section for the manager.
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.inventoryName',
          {
            defaultMessage: 'Inventory data',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.inventoryDescription',
          {
            defaultMessage:
              'Gather relevant information about system operating system, hardware, networking, and packages',
          },
        ),
        goto: 'inventory',
        when: 'agent',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.commandsName',
          {
            defaultMessage: 'Commands',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.commandsDescription',
          {
            defaultMessage: 'Configuration options of the Command wodle',
          },
        ),
        goto: 'commands',
        when: 'agent',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.activeResponseAgentName',
          {
            defaultMessage: 'Active response',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.activeResponseAgentDescription',
          {
            defaultMessage: 'Active response settings for this agent',
          },
        ),
        goto: 'active-response-agent',
        when: 'agent',
      },
    ],
  },
  {
    // Wazuh: Removed this section for the manager.
    title: i18n.translate(
      'wazuh.configuration.settingsGroups.logDataAnalysisTitle',
      {
        defaultMessage: 'Log data analysis',
      },
    ),
    description: '',
    settings: [
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.logCollectionName',
          {
            defaultMessage: 'Log collection',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.logCollectionDescription',
          {
            defaultMessage:
              'Log analysis from text files, Windows events or syslog outputs',
          },
        ),
        goto: 'log-collection',
        when: 'agent',
      },
      {
        name: i18n.translate(
          'wazuh.configuration.settingsCategories.integrityMonitoringName',
          {
            defaultMessage: 'Integrity monitoring',
          },
        ),
        description: i18n.translate(
          'wazuh.configuration.settingsCategories.integrityMonitoringDescription',
          {
            defaultMessage:
              'Identify changes in content, permissions, ownership, and attributes of files',
          },
        ),
        goto: 'integrity-monitoring',
        when: 'agent',
      },
    ],
  },
];
