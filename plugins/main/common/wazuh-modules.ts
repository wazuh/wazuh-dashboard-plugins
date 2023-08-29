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
    title: 'Security events',
    appId: 'wz-security-events',
    description:
      'Browse through your security alerts, identifying issues and threats in your environment.',
  },
  fim: {
    title: 'Integrity monitoring',
    appId: 'wz-integrity-monitoring',
    description:
      'Alerts related to file changes, including permissions, content, ownership and attributes.',
  },
  pm: {
    title: 'Policy monitoring',
    appId: 'wz-policy-monitoring',
    description:
      'Verify that your systems are configured according to your security policies baseline.',
  },
  vuls: {
    title: 'Vulnerabilities',
    appId: 'wz-vulnerabilities',
    description:
      'Discover what applications in your environment are affected by well-known vulnerabilities.',
  },
  oscap: {
    title: 'OpenSCAP',
    appId: 'wz-openscap',
    description:
      'Configuration assessment and automation of compliance monitoring using SCAP checks.',
  },
  audit: {
    title: 'System auditing',
    appId: 'wz-system-auditing',
    description:
      'Audit users behavior, monitoring command execution and alerting on access to critical files.',
  },
  pci: {
    title: 'PCI DSS',
    appId: 'wz-pci-dss',
    description:
      'Global security standard for entities that process, store or transmit payment cardholder data.',
  },
  gdpr: {
    title: 'GDPR',
    appId: 'wz-gdpr',
    description:
      'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.',
  },
  hipaa: {
    title: 'HIPAA',
    appId: 'wz-hipaa',
    description:
      'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.',
  },
  nist: {
    title: 'NIST 800-53',
    appId: 'wz-nist-800-53',
    description:
      'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.',
  },
  tsc: {
    title: 'TSC',
    appId: 'wz-tsc',
    description:
      'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy',
  },
  ciscat: {
    title: 'CIS-CAT',
    appId: 'wz-ciscat',
    description:
      'Configuration assessment using Center of Internet Security scanner and SCAP checks.',
  },
  aws: {
    title: 'Amazon AWS',
    appId: 'wz-amazon-web-services',
    description:
      'Security events related to your Amazon AWS services, collected directly via AWS API.',
  },
  office: {
    title: 'Office 365',
    appId: 'wz-office365',
    description: 'Security events related to your Office 365 services.',
  },
  gcp: {
    title: 'Google Cloud Platform',
    appId: 'wz-google-cloud',
    description:
      'Security events related to your Google Cloud Platform services, collected directly via GCP API.', // TODO GCP
  },
  virustotal: {
    title: 'VirusTotal',
    appId: 'wz-virustotal',
    description:
      'Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.',
  },
  mitre: {
    title: 'MITRE ATT&CK',
    appId: 'wz-mitre-attack',
    description:
      'Security events from the knowledge base of adversary tactics and techniques based on real-world observations',
  },
  syscollector: {
    title: 'Inventory data',
    //TODO - It must be fixed.
    appId: 'wz-it-hygiene',
    description:
      'Applications, network configuration, open ports and processes running on your monitored systems.',
  },
  stats: {
    title: 'Stats',
    //TODO - It must be fixed.
    appId: 'wz-it-hygiene',
    description: 'Stats for agent and logcollector',
  },
  configuration: {
    title: 'Configuration',
    //TODO - It must be fixed.
    appId: 'wz-it-hygiene',
    description:
      'Check the current agent configuration remotely applied by its group.',
  },
  osquery: {
    title: 'Osquery',
    appId: 'wz-osquery',
    description:
      'Osquery can be used to expose an operating system as a high-performance relational database.',
  },
  sca: {
    title: 'Security configuration assessment',
    appId: 'wz-security-configuration-assessment',
    description:
      'Scan your assets as part of a configuration assessment audit.',
  },
  docker: {
    title: 'Docker listener',
    appId: 'wz-docker-listener',
    description:
      'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.',
  },
  github: {
    title: 'GitHub',
    appId: 'wz-github',
    description:
      'Monitoring events from audit logs of your GitHub organizations.',
  },
  devTools: {
    title: 'API console',
    appId: 'wz-api-console',
    description: 'Test the Wazuh API endpoints.',
  },
  logtest: {
    title: 'Test your logs',
    appId: 'wz-ruleset-test',
    description: 'Check your ruleset testing logs.',
  },

  //TODO - Research the uses of this code.
  testConfiguration: {
    title: 'Test your configurations',
    appId: 'wz-',
    description: 'Check configurations before applying them',
  },
};
