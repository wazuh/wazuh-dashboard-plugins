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
export const WAZUH_MODULES = {
  general: {
    title: 'Threat hunting',
    appId: 'threat-hunting',
    description:
      'Browse through your security alerts, identifying issues and threats in your environment.',
  },
  fim: {
    title: 'File integrity monitoring',
    appId: 'file-integrity-monitoring',
    description:
      'Alerts related to file changes, including permissions, content, ownership and attributes.',
  },
  pm: {
    title: 'Malware detection',
    appId: 'malware-detection',
    description:
      'Check indicators of compromise triggered by malware infections or cyberattacks.',
  },
  vuls: {
    title: 'Vulnerability detection',
    appId: 'vulnerability-detection',
    description:
      'Discover what applications in your environment are affected by well-known vulnerabilities.',
  },
  oscap: {
    title: 'OpenSCAP',
    appId: 'openscap',
    description:
      'Configuration assessment and automation of compliance monitoring using SCAP checks.',
  },
  audit: {
    title: 'System auditing',
    appId: 'system-auditing',
    description:
      'Audit users behavior, monitoring command execution and alerting on access to critical files.',
  },
  pci: {
    title: 'PCI DSS',
    appId: 'pci-dss',
    description:
      'Global security standard for entities that process, store or transmit payment cardholder data.',
  },
  gdpr: {
    title: 'GDPR',
    appId: 'gdpr',
    description:
      'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.',
  },
  hipaa: {
    title: 'HIPAA',
    appId: 'hipaa',
    description:
      'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.',
  },
  nist: {
    title: 'NIST 800-53',
    appId: 'nist-800-53',
    description:
      'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.',
  },
  tsc: {
    title: 'TSC',
    appId: 'tsc',
    description:
      'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy',
  },
  ciscat: {
    title: 'CIS-CAT',
    appId: 'ciscat',
    description:
      'Configuration assessment using Center of Internet Security scanner and SCAP checks.',
  },
  aws: {
    title: 'AWS',
    appId: 'amazon-web-services',
    description:
      'Security events related to your Amazon AWS services, collected directly via AWS API.',
  },
  office: {
    title: 'Office 365',
    appId: 'office365',
    description: 'Security events related to your Office 365 services.',
  },
  gcp: {
    title: 'Google Cloud',
    appId: 'google-cloud',
    description:
      'Security events related to your Google Cloud Platform services, collected directly via GCP API.', // TODO GCP
  },
  mitre: {
    title: 'MITRE ATT&CK',
    appId: 'mitre-attack',
    description:
      'Explore security alerts mapped to adversary tactics and techniques for better threat understanding.',
  },
  syscollector: {
    title: 'Inventory data',
    // This appId is not used, for consistency was added.
    appId: 'endpoint-summary',
    description:
      'Applications, network configuration, open ports and processes running on your monitored systems.',
  },
  stats: {
    title: 'Stats',
    // This appId is not used, for consistency was added.
    appId: 'endpoint-summary',
    description: 'Stats for agent and logcollector',
  },
  configuration: {
    title: 'Configuration',
    // This appId is not used, for consistency was added.
    appId: 'endpoint-summary',
    description:
      'Check the current agent configuration remotely applied by its group.',
  },
  osquery: {
    title: 'Osquery',
    appId: 'osquery',
    description:
      'Osquery can be used to expose an operating system as a high-performance relational database.',
  },
  sca: {
    title: 'Configuration assessment',
    appId: 'configuration-assessment',
    description:
      'Scan your assets as part of a configuration assessment audit.',
  },
  docker: {
    title: 'Docker',
    appId: 'docker',
    description:
      'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.',
  },
  github: {
    title: 'GitHub',
    appId: 'github',
    description:
      'Monitoring events from audit logs of your GitHub organizations.',
  },
  devTools: {
    title: 'API console',
    appId: 'api-console',
    description: 'Test the API endpoints.',
  },
  logtest: {
    title: 'Test your logs',
    appId: 'ruleset-test',
    description: 'Check your ruleset testing logs.',
  },

  // TODO - Research the uses of this code.
  testConfiguration: {
    title: 'Test your configurations',
    appId: '',
    description: 'Check configurations before applying them',
  },
};
