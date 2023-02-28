/*
 * Wazuh app - Module for NIST 800-53 requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const nistRequirementsFile = {
  'AC.2':
    'ACCOUNT MANAGEMENT - Identifies and selects the following types of information system accounts to support organizational missions/business functions.',
  'AC.6':
    'LEAST PRIVILEGE - The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
  'AC.7':
    'UNSUCCESSFUL LOGON ATTEMPTS - Enforces a limit of consecutive invalid logon attempts by a user during a time period.',
  'AC.12':
    'SESSION TERMINATION - The information system automatically terminates a user session.',
  'AU.5':
    'RESPONSE TO AUDIT PROCESSING FAILURES - The information system alerts organization-defined personnel or roles in the event of an audit processing failure and takes organization-defined actions to be taken (e.g., shut down information system, overwrite oldest audit records, stop generating audit records).',
  'AU.6':
    'AUDIT REVIEW, ANALYSIS, AND REPORTING - Reviews and analyzes information system audit records.',
  'AU.8':
    'TIME STAMPS - Uses internal system clocks to generate time stamps for audit records and records time stamps for audit records.',
  'AU.9':
    'PROTECTION OF AUDIT INFORMATION - The information system protects audit information and audit tools from unauthorized access, modification, and deletion.',
  'AU.12':
    'AUDIT GENERATION - The information system provides audit record generation capability for the auditable events at organization-defined information system components, allows organization-defined personnel or roles to select which auditable events are to be audited by specific components of the information system and generates audit records.',
  'CA.3':
    'SYSTEM INTERCONNECTIONS - Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements, Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated and Reviews and updates Interconnection Security Agreements ',
  'CM.1':
    'CONFIGURATION MANAGEMENT POLICY AND PROCEDURES - Develops, documents, and disseminates to a configuration management policy. Revies and updates the current configuration management policy and procedures.',
  'CM.3':
    'CONFIGURATION CHANGE CONTROL - The organization determines the types of changes to the information system that are configuration-controlled. ',
  'CM.5':
    'ACCESS RESTRICTIONS FOR CHANGE - The organization defines, documents, approves, and enforces physical and logical access restrictions associated with changes to the information system.',
  'IA.4':
    'IDENTIFIER MANAGEMENT - The organization manages information system identifiers by: Receiving authorization from organization-defined personnel or roles to assign an individual, group, role, or device identifier. Selecting an identifier that identifies an individual, group, role, or device. Assigning the identifier to the intended individual, group, role, or device. Preventing reuse of identifiers for a organization-defined time period. Disabling the identifier after organization-defined time period of inactivity.',
  'IA.5':
    'AUTHENTICATOR MANAGEMENT - The organization manages information system authenticators by verifying, as part of the initial authenticator distribution, the identity of the individual, group role, or device receiving the authenticator.',
  'IA.10':
    'ADAPTIVE IDENTIFICATION AND AUTHENTICATION - The organization requires that individuals accessing the information system employ organization-defined supplemental authentication techniques or mechanisms under specific organization-defined circumstances or situations. ',
  'SA.11':
    'DEVELOPER SECURITY TESTING AND EVALUATION - The organization requires the developer of the information system, system component, or information system service to create and implement a security assessment plan.',
  'SC.2':
    'APPLICATION PARTITIONING - The information system separates user functionality (including user interface services) from information system management functionality.',
  'SC.7':
    'BOUNDARY PROTECTION - The information system monitors and controls communications at the external boundary of the system and at key internal boundaries within the system.',
  'SC.8':
    'TRANSMISSION CONFIDENTIALITY AND INTEGRITY - The information system protects the confidentiality and integrity of transmitted information.',
  'SI.2':
    'FLAW REMEDIATION - The organization identifies, reports, and corrects information system flaws; tests software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation; installs security-relevant software and firmware updates within organizationdefined time period of the release of the updates and  incorporates flaw remediation into the organizational configuration management process.',
  'SI.3':
    'MALICIOUS CODE PROTECTION - The organization employs malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code, updates malicious code protection mechanisms whenever new releases are available in accordance with organizational configuration management policy and procedures, configures malicious code protection mechanisms and addresses the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the information system.',
  'SI.7':
    'SOFTWARE, FIRMWARE, AND INFORMATION INTEGRITY - The organization employs integrity verification tools to detect unauthorized changes to organization-defined software, firmware, and information.'
};
