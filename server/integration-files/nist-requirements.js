/*
 * Wazuh app - Module for NIST 800-53 requirements
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const nistRequirementsFile = {
  "AC.2": " ACCOUNT MANAGEMENT - Identifies and selects the following types of information system accounts to support organizational missions/business functions.",
  "AC.7": "UNSUCCESSFUL LOGON ATTEMPTS - Enforces a limit of consecutive invalid logon attempts by a user during a time period.",
  "AC.12": "SESSION TERMINATION - The information system automatically terminates a user session.",
  "AU.1": "AUDIT AND ACCOUNTABILITY POLICY AND PROCEDURES - Develops, documents, and disseminates to an audit and accountability policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.",
  "AU.3.1": "CONTENT OF AUDIT RECORDS - ADDITIONAL AUDIT INFORMATION - The information system generates audit records containing additional information that organizations may consider in audit records includes.",
  "AU.6": "AUDIT REVIEW, ANALYSIS, AND REPORTING - Reviews and analyzes information system audit records.",
  "AU.8": "TIME STAMPS - Uses internal system clocks to generate time stamps for audit records and records time stamps for audit records.",
  "AU.9": "PROTECTION OF AUDIT INFORMATION - The information system protects audit information and audit tools from unauthorized access, modification, and deletion.",
  "CA.3": "SYSTEM INTERCONNECTIONS - Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements, Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated and Reviews and updates Interconnection Security Agreements ",
  "CM.1": "CONFIGURATION MANAGEMENT POLICY AND PROCEDURES - Develops, documents, and disseminates to a configuration management policy. Revies and updates the current configuration management policy and procedures.",
  "CM.3": "CONFIGURATION CHANGE CONTROL - The organization determines the types of changes to the information system that are configuration-controlled. ",
  "IA.10": "ADAPTIVE IDENTIFICATION AND AUTHENTICATION - The organization requires that individuals accessing the information system employ organization-defined supplemental authentication techniques or mechanisms under specific organization-defined circumstances or situations. ",
  "IA.4": "IDENTIFIER MANAGEMENT - The organization manages information system identifiers by: Receiving authorization from organization-defined personnel or roles to assign an individual, group, role, or device identifier. Selecting an identifier that identifies an individual, group, role, or device. Assigning the identifier to the intended individual, group, role, or device. Preventing reuse of identifiers for a organization-defined time period. Disabling the identifier after organization-defined time period of inactivity.",
  "IA.5": "AUTHENTICATOR MANAGEMENT - The organization manages information system authenticators by verifying, as part of the initial authenticator distribution, the identity of the individual, group role, or device receiving the authenticator.",
  "MA.2": "CONTROLLED MAINTENANCE - Schedules, performs, documents, and reviews records of maintenance and repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.",
  "SA.11": "DEVELOPER SECURITY TESTING AND EVALUATION - The organization requires the developer of the information system, system component, or information system service to create and implement a security assessment plan.",
  "SC.2": "APPLICATION PARTITIONING - The information system separates user functionality (including user interface services) from information system management functionality.",
  "SC.7": "BOUNDARY PROTECTION - The information system monitors and controls communications at the external boundary of the system and at key internal boundaries within the system.",
  "SC.8": "TRANSMISSION CONFIDENTIALITY AND INTEGRITY - The information system protects the confidentiality and integrity of transmitted information.",
  "SI.5": "SECURITY ALERTS, ADVISORIES, AND DIRECTIVES - The organization receives information system security alerts, advisories, and directives from organization-defined external organizations on an ongoing basis.",
  "SI.7": "SOFTWARE, FIRMWARE, AND INFORMATION INTEGRITY - The organization employs integrity verification tools to detect unauthorized changes to organization-defined software, firmware, and information.",
  "SI.10": "INFORMATION INPUT VALIDATION - The information system checks the validity of organization-defined information inputs.",
  "SI.11": "ERROR HANDLING - The information system generates error messages that provide information necessary for corrective actions without revealing information that could be exploited by adversaries and reveals error messages only to organization-defined personnel or roles.",
  "SI.15": "INFORMATION OUTPUT FILTERING - The information system validates information output from organizationdefined software programs and/or applications to ensure that the information is consistent with the expected content.",
  "SI.16": "MEMORY PROTECTION - The information system implements organization-defined security safeguards to protect its memory from unauthorized code execution.",
};
