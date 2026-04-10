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
  'RA-5':
    'Vulnerability Monitoring and Scanning: Perform authenticated scans of all operating systems, web apps, and databases. 2026 CR26 Update: High-risk vulnerabilities must be remediated within 30 days (or sooner if on the CISA KEV list).',
  'SI-2':
    'Flaw Remediation: Centrally manage and patch software flaws. Must evaluate all vulnerabilities within 5 days of detection for Class C systems.',
  'SI-4':
    'System Monitoring: Deploy tools (IDS/IPS) to monitor traffic and system behavior for indicators of compromise (IoC) and unauthorized connections.',
  'CA-7':
    'Continuous Monitoring: Maintain a "near real-time" security posture view. Findings here usually mean your Wazuh agent or log forwarding has gaps in coverage.',
  'AC-2':
    'Account Management: Automate account creation, modification, and deletion. Privileged accounts must be reviewed every 90 days.',
  'IA-2':
    'Identification and Authentication: Mandatory Multi-Factor Authentication (MFA) for all users. All crypto-modules must be FIPS 140-3 validated.',
  'AC-17':
    'Remote Access: Monitor and control all remote sessions. All remote access must be through a single, managed access point (e.g., VPN or Zero-Trust gateway).',
  'CM-6':
    'Configuration Settings: Establish and enforce security configuration settings (e.g., CIS Benchmarks). Wazuh uses the SCA module to check this.',
  'SI-7':
    'Software and Information Integrity: Implement File Integrity Monitoring (FIM) to detect unauthorized modifications to system binaries and configuration files.',
  'CM-11':
    'User-Installed Software: Strictly prohibit or restrict user-installed software through whitelisting or technical blocking.',
  'AU-12':
    'Audit Record Generation: Log files must contain the date, time, source IP, user ID, and type of event. Gaps in logging detail are a common "finding."',
  'AU-6':
    'Audit Record Review: Automated tools must review logs for anomalies and alert security teams to suspicious activity.',
  'IR-4':
    'Incident Handling: Evidence of incident containment and root-cause analysis. Must report incidents to CISA/FedRAMP within 1 hour of "Confirmed" status.',
  'SC-8':
    'Transmission Confidentiality: All data in transit must be encrypted using TLS 1.2+ with FIPS-validated certificates.',
  'SC-28':
    'Protection of Information at Rest: All data on disks, backups, and databases must be encrypted with keys managed via a Hardware Security Module (HSM) or equivalent.',
  'MP-6':
    'Media Sanitization: Ensure data is unrecoverable before hardware is decommissioned or released (NIST 800-88 standard).',
};
