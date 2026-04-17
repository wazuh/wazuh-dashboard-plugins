/*
 * Wazuh app - Module for FedRAMP requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Source: https://www.fedramp.gov/resources/documents/rev4/REV_4_FedRAMP_Security_Controls_Baseline.xlsx
 * Source: https://www.fedramp.gov/resources/templates/SSP-Appendix-A-Moderate-FedRAMP-Security-Controls.docx
 *
 * Find more information about this on the LICENSE file.
 */
export const fedrampRequirementsFile = {
  'AC-2':
    'Account Management: Establish and manage system accounts, including automated mechanisms for disabling inactive accounts.',
  'AC-3':
    'Access Enforcement: Enforce approved authorizations for logical access to information and system resources.',
  'AC-4':
    'Information Flow Enforcement: Control the flow of information within the system and between connected systems based on security policies.',
  'AC-12':
    'Session Termination: Automatically terminate user sessions after a defined period of inactivity.',
  'AC-17':
    'Remote Access: Monitor and control remote access sessions; all remote access must be through a single managed access point.',
  'AC-18':
    'Wireless Access: Establish usage restrictions, configuration/connection requirements, and implementation guidance for wireless access.',
  'AC-19':
    'Access Control for Mobile Devices: Establish usage restrictions and implementation guidance for mobile devices.',
  'AU-1':
    'Policy and Procedures: Develop and maintain a formal audit and accountability policy and implementation procedures.',
  'AU-2':
    'Event Logging: Identify the list of events to be logged and ensure the system is capable of auditing those events.',
  'AU-6':
    'Audit Record Review: Review and analyze system audit records for indications of inappropriate or unusual activity.',
  'AU-11':
    'Audit Record Retention: Retain audit records for at least one year to provide support for after-the-fact investigations.',
  'CM-2':
    'Baseline Configuration: Maintain a documented, current baseline configuration of the system.',
  'CM-3':
    'Configuration Change Control: Review and approve proposed changes to the system before implementation.',
  'CM-6':
    'Configuration Settings: Establish and enforce security configuration settings (e.g., CIS Benchmarks) for IT products.',
  'CM-8':
    'System Component Inventory: Maintain an inventory of all system components with enough detail for tracking and control.',
  'IA-2':
    'Identification and Authentication: Implement Multi-Factor Authentication (MFA) for all network and local access.',
  'IA-5':
    'Authenticator Management: Manage system authenticators (passwords, tokens, PKI) according to federal complexity standards.',
  'IA-7':
    'Cryptographic Module Authentication: Authenticate to cryptographic modules based on FIPS-validated standards.',
  'SC-5':
    'Denial of Service Protection: Protect against or limit the effects of denial-of-service attacks.',
  'SC-7':
    'Boundary Protection: Monitor and control communications at the external and internal boundaries of the system.',
  'SC-8':
    'Transmission Confidentiality and Integrity: Protect data in transit using FIPS-validated encryption (TLS 1.2+).',
  'SC-13':
    'Cryptographic Protection: Use FIPS 140-3 validated cryptography to protect the confidentiality and integrity of information.',
  'SC-28':
    'Protection of Information at Rest: Encrypt all sensitive data on storage devices using FIPS-validated modules.',
  'SI-2':
    'Flaw Remediation: Identify, report, and correct software flaws (patching) within 30 days for high-risk vulnerabilities.',
  'SI-3':
    'Malicious Code Protection: Implement anti-virus and anti-malware at system entry and exit points.',
  'SI-4':
    'Information System Monitoring: Monitor the system to detect attacks and unauthorized connections (IDS/IPS).',
  'SI-7':
    'Software, Firmware, and Information Integrity: Implement File Integrity Monitoring (FIM) to detect unauthorized changes.',
  'CP-9':
    'System Backup: Conduct regular backups of user-level and system-level information and protect their integrity.',
  'CP-10':
    'System Recovery and Reconstitution: Restore the system to a known-good state after a failure or compromise.',
  'RA-5':
    'Vulnerability Monitoring: Perform monthly authenticated vulnerability scans on systems, applications, and databases.',
  'AT-2':
    'Security Awareness: Provide basic security awareness training to all users before system access and annually thereafter.',
  'AT-3':
    'Role-based Security Training: Provide specialized security training to personnel with specific roles (admins/developers).',
  'CA-2':
    'Control Assessments: Conduct periodic assessments of security controls to determine effectiveness.',
  'CA-7':
    'Continuous Monitoring: Implement a strategy to monitor control effectiveness and report findings monthly.',
  'IR-4':
    'Incident Handling: Implement incident detection, analysis, and containment capabilities.',
  'IR-6':
    'Incident Reporting: Report security incidents to the FedRAMP PMO and CISA within required timeframes.',
  'IR-7':
    'Incident Response Testing: Test the incident response capability for the system annually.',
  'MA-4':
    'Remote Maintenance: Approve, monitor, and control any remote maintenance activities.',
  'MP-6':
    'Media Sanitization: Sanitize or destroy digital/physical media prior to disposal using NIST 800-88 standards.',
  'PE-3':
    'Physical Access Control: Maintain logs and physical barriers for the facility housing the information system.',
  'PL-2':
    'System Security Plan: Develop and maintain a comprehensive SSP describing all security controls.',
  'PS-3':
    'Personnel Termination: Disable all system access within 24 hours of an employee’s termination or transfer.',
  'PT-3':
    'PII Processing: Document exactly what PII is processed and ensure it is limited to the minimum necessary.',
  'SA-11':
    'Developer Testing: Perform SAST, DAST, and vulnerability testing on all custom code before production.',
  'SR-3':
    'Supply Chain Controls: Vet all 3rd party vendors and maintain a Software Bill of Materials (SBOM).',
  'PM-5':
    'System Inventory: Maintain a high-level organization-wide inventory of all information systems.',
};
