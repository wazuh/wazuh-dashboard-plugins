/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const TabDescription = {
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
  virustotal: {
    title: 'VirusTotal',
    description:
      'Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.'
  },
  syscollector: {
    title: 'Inventory data',
    description:
      'Applications, network configuration, open ports and processes running on your monitored systems.'
  },
  configuration: {
    title: 'Configuration',
    description:
      'Check the current agent configuration remotely applied by its group.'
  }
};
