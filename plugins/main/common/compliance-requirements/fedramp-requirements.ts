/*
 * Wazuh app - Module for FedRAMP requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const fedrampRequirementsFile = {
  'CA-7':
    'Continuous Monitoring: Develop a strategy and implement a program to monitor control effectiveness. Requires automated tools to report on the security posture in real-time or at defined intervals to ensure the "Authorization to Operate" (ATO) remains valid.',
  'RA-5':
    'Vulnerability Monitoring and Scanning: Scan for vulnerabilities in the system and applications at least monthly (for Moderate). FedRAMP specifically requires "authenticated" scans and the use of the CISA Known Exploited Vulnerabilities (KEV) catalog to prioritize remediation.',
  'SI-2':
    'Flaw Remediation: Centrally manage the identification, reporting, and correction of software flaws. You must install security-relevant updates within 30 days for Moderate systems (or faster for High-risk flaws). Wazuh findings here usually indicate missing patches.',
  'SI-4':
    'System Monitoring: Monitor the system to detect attacks and unauthorized connections. Includes setting up Intrusion Detection Systems (IDS), analyzing traffic patterns, and identifying "indicators of compromise" (IoCs).',
  'SI-7':
    'Software, Firmware, and Information Integrity: Implement File Integrity Monitoring (FIM) to detect unauthorized changes to core system files and configuration files. This is a core Wazuh capability often flagged during audits.',
  'CM-6':
    'Configuration Settings: Establish and enforce security configuration settings (benchmarks like CIS or STIGs). Wazuh’s SCA (Security Configuration Assessment) module directly maps to this requirement.',
  'AU-6':
    'Audit Record Review, Analysis, and Reporting: Regularly review and analyze system audit records for indications of inappropriate or unusual activity. FedRAMP requires this to be automated and correlated across the environment.',
  'AU-12':
    'Audit Record Generation: Ensure the system generates audit records for all security-relevant events. Findings here usually mean your logs aren’t capturing enough detail (e.g., missing who, what, when, where).',
  'IA-5.1':
    'Authenticator Management: Enforce specific password complexity and rotation rules if MFA is not used for a specific legacy component. Wazuh often flags "weak password" policies under this NIST control.',
};