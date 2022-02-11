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
    description:
      'Browse through your security alerts, identifying issues and threats in your environment.'
  },
  fim: {
    title: 'Integrity monitoring',
    description:
      'Alerts related to file changes, including permissions, content, ownership and attributes.'
  },
  pm: {
    title: 'Policy monitoring',
    description:
      'Verify that your systems are configured according to your security policies baseline.'
  },
  vuls: {
    title: 'Vulnerabilities',
    description:
      'Discover what applications in your environment are affected by well-known vulnerabilities.'
  },
  oscap: {
    title: 'OpenSCAP',
    description:
      'Configuration assessment and automation of compliance monitoring using SCAP checks.'
  },
  audit: {
    title: 'System auditing',
    description:
      'Audit users behavior, monitoring command execution and alerting on access to critical files.'
  },
  pci: {
    title: 'PCI DSS',
    description:
      'Global security standard for entities that process, store or transmit payment cardholder data.'
  },
  gdpr: {
    title: 'GDPR',
    description:
      'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.'
  },
  hipaa: {
    title: 'HIPAA',
    description:
      'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.'
  },
  nist: {
    title: 'NIST 800-53',
    description:
      'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.'
  },
  tsc: {
    title: 'TSC',
    description:
      'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy'
  },
  ciscat: {
    title: 'CIS-CAT',
    description:
      'Configuration assessment using Center of Internet Security scanner and SCAP checks.'
  },
  aws: {
    title: 'Amazon AWS',
    description:
      'Security events related to your Amazon AWS services, collected directly via AWS API.'
  },
  office: {
    title: 'Office 365',
    description:
      'Security events related to your Office 365 services.'
  },
  gcp: {
    title: 'Google Cloud Platform',
    description:
      'Security events related to your Google Cloud Platform services, collected directly via GCP API.' // TODO GCP
  },
  virustotal: {
    title: 'VirusTotal',
    description:
      'Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.'
  },
  mitre: {
    title: 'MITRE ATT&CK',
    description:
      'Security events from the knowledge base of adversary tactics and techniques based on real-world observations'
  },
  syscollector: {
    title: 'Inventory data',
    description:
      'Applications, network configuration, open ports and processes running on your monitored systems.'
  },
  stats: {
    title: 'Stats',
    description: 'Stats for agent and logcollector'
  },
  configuration: {
    title: 'Configuration',
    description:
      'Check the current agent configuration remotely applied by its group.'
  },
  osquery: {
    title: 'Osquery',
    description:
      'Osquery can be used to expose an operating system as a high-performance relational database.'
  },
  sca: {
    title: 'Security configuration assessment',
    description: 'Scan your assets as part of a configuration assessment audit.'
  },
  docker: {
    title: 'Docker listener',
    description:
      'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.'
  },
  github: {
    title: 'GitHub',
    description:
      'Monitoring events from audit logs of your GitHub organizations.'
  },
  devTools: {
    title: 'API console',
    description: 'Test the Wazuh API endpoints.'
  },
  logtest: {
    title: 'Test your logs',
    description: 'Check your ruleset testing logs.'
  },
  testConfiguration: {
    title: 'Test your configurations',
    description: 'Check configurations before applying them'
  }
};
