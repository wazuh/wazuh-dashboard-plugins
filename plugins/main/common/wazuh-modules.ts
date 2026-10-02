/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WAZUH_MODULES_ID } from './constants';
import { i18n } from '@osd/i18n';

export const WAZUH_MODULES = {
  general: {
    title: i18n.translate('wazuh.common.modules.general.title', {
      defaultMessage: 'Threat hunting',
    }),
    appId: 'threat-hunting',
    description: i18n.translate('wazuh.common.modules.general.description', {
      defaultMessage:
        'Browse through your security alerts, identifying issues and threats in your environment.',
    }),
  },
  fim: {
    title: i18n.translate('wazuh.common.modules.fim.title', {
      defaultMessage: 'File integrity monitoring',
    }),
    appId: 'file-integrity-monitoring',
    description: i18n.translate('wazuh.common.modules.fim.description', {
      defaultMessage:
        'Alerts related to file changes, including permissions, content, ownership and attributes.',
    }),
  },
  pm: {
    title: i18n.translate('wazuh.common.modules.pm.title', {
      defaultMessage: 'Malware detection',
    }),
    appId: 'malware-detection',
    description: i18n.translate('wazuh.common.modules.pm.description', {
      defaultMessage:
        'Check indicators of compromise triggered by malware infections or cyberattacks.',
    }),
  },
  vuls: {
    title: i18n.translate('wazuh.common.modules.vuls.title', {
      defaultMessage: 'Vulnerability detection',
    }),
    appId: 'vulnerability-detection',
    description: i18n.translate('wazuh.common.modules.vuls.description', {
      defaultMessage:
        'Discover what applications in your environment are affected by well-known vulnerabilities.',
    }),
  },
  audit: {
    title: i18n.translate('wazuh.common.modules.audit.title', {
      defaultMessage: 'System auditing',
    }),
    appId: 'system-auditing',
    description: i18n.translate('wazuh.common.modules.audit.description', {
      defaultMessage:
        'Audit users behavior, monitoring command execution and alerting on access to critical files.',
    }),
  },
  'regulatory-compliance': {
    title: i18n.translate('wazuh.common.modules.regulatoryCompliance.title', {
      defaultMessage: 'Regulatory Compliance',
    }),
    appId: 'regulatory-compliance',
    description: i18n.translate(
      'wazuh.common.modules.regulatoryCompliance.description',
      {
        defaultMessage:
          'Assess compliance with regulatory frameworks including PCI DSS, GDPR, HIPAA, NIST 800-53, TSC, CMMC, FedRAMP, ISO 27001, NIS2, and NIST 800-171.',
      },
    ),
  },
  [WAZUH_MODULES_ID.PCI_DSS]: {
    title: i18n.translate('wazuh.common.modules.pciDss.title', {
      defaultMessage: 'PCI DSS',
    }),
    appId: 'pci-dss',
    description: i18n.translate('wazuh.common.modules.pciDss.description', {
      defaultMessage:
        'Global security standard for entities that process, store or transmit payment cardholder data.',
    }),
  },
  [WAZUH_MODULES_ID.GDPR]: {
    title: i18n.translate('wazuh.common.modules.gdpr.title', {
      defaultMessage: 'GDPR',
    }),
    appId: 'gdpr',
    description: i18n.translate('wazuh.common.modules.gdpr.description', {
      defaultMessage:
        'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.',
    }),
  },
  [WAZUH_MODULES_ID.HIPAA]: {
    title: i18n.translate('wazuh.common.modules.hipaa.title', {
      defaultMessage: 'HIPAA',
    }),
    appId: 'hipaa',
    description: i18n.translate('wazuh.common.modules.hipaa.description', {
      defaultMessage:
        'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.',
    }),
  },
  [WAZUH_MODULES_ID.NIST_800_53]: {
    title: i18n.translate('wazuh.common.modules.nist80053.title', {
      defaultMessage: 'NIST 800-53',
    }),
    appId: 'nist-800-53',
    description: i18n.translate('wazuh.common.modules.nist80053.description', {
      defaultMessage:
        'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.',
    }),
  },
  [WAZUH_MODULES_ID.NIST_800_171]: {
    title: i18n.translate('wazuh.common.modules.nist800171.title', {
      defaultMessage: 'NIST 800-171',
    }),
    appId: 'nist-800-171',
    description: i18n.translate('wazuh.common.modules.nist800171.description', {
      defaultMessage:
        'National Institute of Standards and Technology Special Publication 800-171 (NIST 800-171) protects Controlled Unclassified Information in non-federal systems.',
    }),
  },
  [WAZUH_MODULES_ID.CMMC]: {
    title: i18n.translate('wazuh.common.modules.cmmc.title', {
      defaultMessage: 'CMMC',
    }),
    appId: 'cmmc',
    description: i18n.translate('wazuh.common.modules.cmmc.description', {
      defaultMessage:
        'Cybersecurity Maturity Model Certification (CMMC) is a framework to assess the cybersecurity maturity of organizations.',
    }),
  },
  [WAZUH_MODULES_ID.TSC]: {
    title: i18n.translate('wazuh.common.modules.tsc.title', {
      defaultMessage: 'TSC',
    }),
    appId: 'tsc',
    description: i18n.translate('wazuh.common.modules.tsc.description', {
      defaultMessage:
        'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy',
    }),
  },
  [WAZUH_MODULES_ID.FEDRAMP]: {
    title: i18n.translate('wazuh.common.modules.fedramp.title', {
      defaultMessage: 'FedRAMP',
    }),
    appId: 'fedramp',
    description: i18n.translate('wazuh.common.modules.fedramp.description', {
      defaultMessage:
        'Federal Risk and Authorization Management Program (FedRAMP) provides a standardized approach to security assessment, authorization, and continuous monitoring for cloud products and services.',
    }),
  },
  [WAZUH_MODULES_ID.ISO_27001]: {
    title: i18n.translate('wazuh.common.modules.iso27001.title', {
      defaultMessage: 'ISO 27001',
    }),
    appId: 'iso-27001',
    description: i18n.translate('wazuh.common.modules.iso27001.description', {
      defaultMessage:
        'International standard for information security management systems (ISMS), providing a systematic approach to managing sensitive company information.',
    }),
  },
  [WAZUH_MODULES_ID.NIS2]: {
    title: i18n.translate('wazuh.common.modules.nis2.title', {
      defaultMessage: 'NIS2',
    }),
    appId: 'nis2',
    description: i18n.translate('wazuh.common.modules.nis2.description', {
      defaultMessage:
        'EU directive on measures for high common level of cybersecurity across the Union.',
    }),
  },
  microsoftGraphAPI: {
    title: i18n.translate('wazuh.common.modules.microsoftGraphApi.title', {
      defaultMessage: 'Microsoft Graph API',
    }),
    appId: 'microsoft-graph-api',
    description: i18n.translate(
      'wazuh.common.modules.microsoftGraphApi.description',
      {
        defaultMessage:
          'Security events related to your Microsoft Graph services, collected directly via Microsoft Graph API.',
      },
    ),
  },
  aws: {
    title: i18n.translate('wazuh.common.modules.aws.title', {
      defaultMessage: 'AWS',
    }),
    appId: 'amazon-web-services',
    description: i18n.translate('wazuh.common.modules.aws.description', {
      defaultMessage:
        'Security events related to your Amazon AWS services, collected directly via AWS API.',
    }),
  },
  office: {
    title: i18n.translate('wazuh.common.modules.office.title', {
      defaultMessage: 'Office 365',
    }),
    appId: 'office365',
    description: i18n.translate('wazuh.common.modules.office.description', {
      defaultMessage: 'Security events related to your Office 365 services.',
    }),
  },
  gcp: {
    title: i18n.translate('wazuh.common.modules.gcp.title', {
      defaultMessage: 'Google Cloud',
    }),
    appId: 'google-cloud',
    description: i18n.translate('wazuh.common.modules.gcp.description', {
      defaultMessage:
        'Security events related to your Google Cloud Platform services, collected directly via GCP API.',
    }), // TODO GCP
  },
  mitre: {
    title: i18n.translate('wazuh.common.modules.mitre.title', {
      defaultMessage: 'MITRE ATT&CK',
    }),
    appId: 'mitre-attack',
    description: i18n.translate('wazuh.common.modules.mitre.description', {
      defaultMessage:
        'Explore security alerts mapped to adversary tactics and techniques for better threat understanding.',
    }),
  },
  'system-inventory': {
    title: i18n.translate('wazuh.common.modules.systemInventory.title', {
      defaultMessage: 'System inventory',
    }),
    // This appId is not used, for consistency was added.
    appId: 'system-inventory',
    description: i18n.translate(
      'wazuh.common.modules.systemInventory.description',
      {
        defaultMessage:
          'Networks, interfaces, protocols, processes, ports, packages, hotfixes, system and hardware information of your monitored endpoints.',
      },
    ),
  },
  stats: {
    title: i18n.translate('wazuh.common.modules.stats.title', {
      defaultMessage: 'Stats',
    }),
    // This appId is not used, for consistency was added.
    appId: 'endpoint-summary',
    description: i18n.translate('wazuh.common.modules.stats.description', {
      defaultMessage: 'Stats for agent and logcollector',
    }),
  },
  configuration: {
    title: i18n.translate('wazuh.common.modules.configuration.title', {
      defaultMessage: 'Configuration',
    }),
    // This appId is not used, for consistency was added.
    appId: 'endpoint-summary',
    description: i18n.translate(
      'wazuh.common.modules.configuration.description',
      {
        defaultMessage:
          'Check the current agent configuration remotely applied by its group.',
      },
    ),
  },
  sca: {
    title: i18n.translate('wazuh.common.modules.sca.title', {
      defaultMessage: 'Configuration assessment',
    }),
    appId: 'configuration-assessment',
    description: i18n.translate('wazuh.common.modules.sca.description', {
      defaultMessage:
        'Scan your assets as part of a configuration assessment audit.',
    }),
  },
  docker: {
    title: i18n.translate('wazuh.common.modules.docker.title', {
      defaultMessage: 'Docker',
    }),
    appId: 'docker',
    description: i18n.translate('wazuh.common.modules.docker.description', {
      defaultMessage:
        'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.',
    }),
  },
  github: {
    title: i18n.translate('wazuh.common.modules.github.title', {
      defaultMessage: 'GitHub',
    }),
    appId: 'github',
    description: i18n.translate('wazuh.common.modules.github.description', {
      defaultMessage:
        'Monitoring events from audit logs of your GitHub organizations.',
    }),
  },
  'it-hygiene': {
    title: i18n.translate('wazuh.common.modules.itHygiene.title', {
      defaultMessage: 'IT Hygiene',
    }),
    appId: 'it-hygiene',
    description: i18n.translate('wazuh.common.modules.itHygiene.description', {
      defaultMessage: 'Collect data about the system inventory.',
    }),
  },
  devTools: {
    title: i18n.translate('wazuh.common.modules.devTools.title', {
      defaultMessage: 'API console',
    }),
    appId: 'api-console',
    description: i18n.translate('wazuh.common.modules.devTools.description', {
      defaultMessage: 'Test the API endpoints.',
    }),
  },

  // TODO - Research the uses of this code.
  testConfiguration: {
    title: i18n.translate('wazuh.common.modules.testConfiguration.title', {
      defaultMessage: 'Test your configurations',
    }),
    appId: '',
    description: i18n.translate(
      'wazuh.common.modules.testConfiguration.description',
      { defaultMessage: 'Check configurations before applying them' },
    ),
  },
};
