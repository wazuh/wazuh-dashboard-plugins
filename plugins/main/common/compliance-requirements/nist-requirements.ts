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
  'AC-2':
    'ACCOUNT MANAGEMENT - Identifies and selects the following types of information system accounts to support organizational missions/business functions.',
  'AC-3':
    'ACCESS ENFORCEMENT - The information system enforces approved authorizations for logical access to information and system resources in accordance with applicable access control policies.',
  'AC-4':
    'INFORMATION FLOW ENFORCEMENT - The information system enforces approved authorizations for controlling the flow of information within the system and between interconnected systems based on organization-defined information flow control policies.',
  'AC-6':
    'LEAST PRIVILEGE - The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
  'AC-7':
    'UNSUCCESSFUL LOGON ATTEMPTS - Enforces a limit of consecutive invalid logon attempts by a user during a time period.',
  'AC-12':
    'SESSION TERMINATION - The information system automatically terminates a user session.',
  'AC-17':
    'REMOTE ACCESS - The organization establishes and documents usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed, and authorizes remote access to the information system prior to allowing such connections.',
  'AU-2':
    'AUDIT EVENTS - The organization determines that the information system is capable of auditing organization-defined events and coordinates the security audit function with other organizational entities requiring audit-related information.',
  'AU-5':
    'RESPONSE TO AUDIT PROCESSING FAILURES - The information system alerts organization-defined personnel or roles in the event of an audit processing failure and takes organization-defined actions to be taken (e.g., shut down information system, overwrite oldest audit records, stop generating audit records).',
  'AU-6':
    'AUDIT REVIEW, ANALYSIS, AND REPORTING - Reviews and analyzes information system audit records.',
  'AU-8':
    'TIME STAMPS - Uses internal system clocks to generate time stamps for audit records and records time stamps for audit records.',
  'AU-9':
    'PROTECTION OF AUDIT INFORMATION - The information system protects audit information and audit tools from unauthorized access, modification, and deletion.',
  'AU-12':
    'AUDIT GENERATION - The information system provides audit record generation capability for the auditable events at organization-defined information system components, allows organization-defined personnel or roles to select which auditable events are to be audited by specific components of the information system and generates audit records.',
  'AU-14':
    'SESSION AUDIT - The information system provides the capability for authorized users to select a user session to capture/record or view/hear.',
  'CA-3':
    'SYSTEM INTERCONNECTIONS - Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements, Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated and Reviews and updates Interconnection Security Agreements ',
  'CA-7':
    'CONTINUOUS MONITORING - The organization develops a continuous monitoring strategy and implements a continuous monitoring program that includes ongoing assessments of security controls to determine their effectiveness.',
  'CM-1':
    'CONFIGURATION MANAGEMENT POLICY AND PROCEDURES - Develops, documents, and disseminates to a configuration management policy. Revies and updates the current configuration management policy and procedures.',
  'CM-2':
    'BASELINE CONFIGURATION - The organization develops, documents, and maintains under configuration control, a current baseline configuration of the information system.',
  'CM-3':
    'CONFIGURATION CHANGE CONTROL - The organization determines the types of changes to the information system that are configuration-controlled. ',
  'CM-5':
    'ACCESS RESTRICTIONS FOR CHANGE - The organization defines, documents, approves, and enforces physical and logical access restrictions associated with changes to the information system.',
  'CM-6':
    'CONFIGURATION SETTINGS - The organization establishes and documents mandatory configuration settings for information technology products employed within the information system using the most restrictive mode consistent with operational requirements.',
  'CM-7':
    'LEAST FUNCTIONALITY - The organization configures the information system to provide only essential capabilities and prohibits or restricts the use of specified functions, ports, protocols, and/or services.',
  'CM-8':
    'INFORMATION SYSTEM COMPONENT INVENTORY - The organization develops and documents an inventory of information system components that accurately reflects the current information system, and reviews and updates the inventory periodically.',
  'CP-6':
    'ALTERNATE STORAGE SITE - The organization establishes an alternate storage site including necessary agreements to permit the storage and retrieval of information system backup information.',
  'CP-9':
    'INFORMATION SYSTEM BACKUP - The organization conducts backups of user-level information, system-level information, and information system documentation contained in the information system.',
  'IA-2':
    'IDENTIFICATION AND AUTHENTICATION (ORGANIZATIONAL USERS) - The information system uniquely identifies and authenticates organizational users (or processes acting on behalf of organizational users).',
  'IA-4':
    'IDENTIFIER MANAGEMENT - The organization manages information system identifiers by: Receiving authorization from organization-defined personnel or roles to assign an individual, group, role, or device identifier. Selecting an identifier that identifies an individual, group, role, or device. Assigning the identifier to the intended individual, group, role, or device. Preventing reuse of identifiers for a organization-defined time period. Disabling the identifier after organization-defined time period of inactivity.',
  'IA-5':
    'AUTHENTICATOR MANAGEMENT - The organization manages information system authenticators by verifying, as part of the initial authenticator distribution, the identity of the individual, group role, or device receiving the authenticator.',
  'IA-10':
    'ADAPTIVE IDENTIFICATION AND AUTHENTICATION - The organization requires that individuals accessing the information system employ organization-defined supplemental authentication techniques or mechanisms under specific organization-defined circumstances or situations. ',
  'IR-4':
    'INCIDENT HANDLING - The organization implements an incident handling capability for security incidents that includes preparation, detection and analysis, containment, eradication, and recovery.',
  'IR-5':
    'INCIDENT MONITORING - The organization tracks and documents information system security incidents.',
  'IR-8':
    'INCIDENT RESPONSE PLAN - The organization develops an incident response plan that provides the organization with a roadmap for implementing its incident response capability and distributes copies of the plan to organization-defined incident response personnel.',
  'MP-6':
    'MEDIA SANITIZATION - The organization sanitizes information system media, both digital and non-digital, prior to disposal, release out of organizational control, or release for reuse.',
  'RA-3':
    'RISK ASSESSMENT - The organization conducts an assessment of risk, including the likelihood and magnitude of harm, from the unauthorized access, use, disclosure, disruption, modification, or destruction of the information system and the information it processes, stores, or transmits.',
  'RA-5':
    'VULNERABILITY SCANNING - The organization scans for vulnerabilities in the information system and hosted applications and analyzes vulnerability scan reports and results from security control assessments.',
  'SA-11':
    'DEVELOPER SECURITY TESTING AND EVALUATION - The organization requires the developer of the information system, system component, or information system service to create and implement a security assessment plan.',
  'SC-2':
    'APPLICATION PARTITIONING - The information system separates user functionality (including user interface services) from information system management functionality.',
  'SC-5':
    'DENIAL OF SERVICE PROTECTION - The information system protects against or limits the effects of organization-defined types of denial of service attacks.',
  'SC-7':
    'BOUNDARY PROTECTION - The information system monitors and controls communications at the external boundary of the system and at key internal boundaries within the system.',
  'SC-8':
    'TRANSMISSION CONFIDENTIALITY AND INTEGRITY - The information system protects the confidentiality and integrity of transmitted information.',
  'SC-12':
    'CRYPTOGRAPHIC KEY ESTABLISHMENT AND MANAGEMENT - The organization establishes and manages cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key generation, distribution, storage, access, and destruction.',
  'SC-28':
    'PROTECTION OF INFORMATION AT REST - The information system protects the confidentiality and/or integrity of organization-defined information at rest.',
  'SI-2':
    'FLAW REMEDIATION - The organization identifies, reports, and corrects information system flaws; tests software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation; installs security-relevant software and firmware updates within organizationdefined time period of the release of the updates and  incorporates flaw remediation into the organizational configuration management process.',
  'SI-3':
    'MALICIOUS CODE PROTECTION - The organization employs malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code, updates malicious code protection mechanisms whenever new releases are available in accordance with organizational configuration management policy and procedures, configures malicious code protection mechanisms and addresses the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the information system.',
  'SI-4':
    'INFORMATION SYSTEM MONITORING - The organization monitors the information system to detect attacks and indicators of potential attacks, and unauthorized local, network, and remote connections.',
  'SI-4(4)':
    'INFORMATION SYSTEM MONITORING | INBOUND AND OUTBOUND COMMUNICATIONS TRAFFIC - The information system monitors inbound and outbound communications traffic for unusual or unauthorized activities or conditions.',
  'SI-7':
    'SOFTWARE, FIRMWARE, AND INFORMATION INTEGRITY - The organization employs integrity verification tools to detect unauthorized changes to organization-defined software, firmware, and information.',
  'SI-12':
    'INFORMATION HANDLING AND RETENTION - The organization handles and retains information within the information system and information output from the system in accordance with applicable federal laws, executive orders, directives, policies, regulations, standards, and operational requirements.',
};
