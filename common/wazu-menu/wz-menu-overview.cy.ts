/*
 * Wazuh app - Wazuh Constants file for Cypress
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export enum WAZUH_MENU_MODULES_SECTIONS_CY_TEST_ID {
  SECURITY_EVENTS = 'menu-modules-general-link',
  INTEGRITY_MONITORING = 'menu-modules-fim-link',
  AMAZON_WEB_SERVICES = 'menu-modules-aws-link',
  GOOGLE_CLOUD_PLATFORM = 'menu-modules-gcp-link',
  POLICY_MONITORING = 'menu-modules-pm-link',
  SECURITY_CONFIGURATION_ASSESSMENT = 'menu-modules-sca-link',
  AUDITING = 'menu-modules-audit-link',
  OPEN_SCAP = 'menu-modules-oscap-link',
  VULNERABILITIES = 'menu-modules-vuls-link',
  OSQUERY = 'menu-modules-osquery-link',
  DOCKER = 'menu-modules-docker-link',
  MITRE_ATTACK = 'menu-modules-mitre-link',
  PCI_DSS = 'menu-modules-pci-link',
  HIPAA = 'menu-modules-hipaa-link',
  NIST_800_53 = 'menu-modules-nist-link',
  TSC = 'menu-modules-tsc-link',
  CIS_CAT = 'menu-modules-ciscat-link',
  VIRUSTOTAL = 'menu-modules-virustotal-link',
  GDPR = 'menu-modules-gdpr-link',
}
