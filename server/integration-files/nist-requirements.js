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
  "AU.1": "Audit and Accountability Policy and Procedures",
  "AC.2": "Account Management",
  "AC.7": "UNSUCCESSFUL LOGON ATTEMPTS - Enforces a limit of consecutive invalid logon attempts by a user during a time period ",
  "AU.3.1": "CONTENT OF AUDIT RECORDS - ADDITIONAL AUDIT INFORMATION",
  "AC.12": "Session termination - The information system automatically terminates a user session.",
  "AU.6": "Audit Review, Analysis, and Reporting -  The organization: Reviews and analyzes information system audit records ",
  "AU.8": "Time Stamps - Uses internal system clocks to generate time stamps for audit records and records time stamps for audit records",
  "AU.9": "Protection of Audit Information - The information system protects audit information and audit tools from unauthorized access, modification, and deletion",
  "CA.3": "SYSTEM INTERCONNECTIONS - The organization: Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements, Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated and Reviews and updates Interconnection Security Agreements ",
  "CM.1": "CONFIGURATION MANAGEMENT POLICY AND PROCEDURES - The organization: Develops, documents, and disseminates to a configuration management policy. Revies and updates the current configuration management policy and procedures.",
  "CM.3": " CONFIGURATION CHANGE CONTROL - The organization determines the types of changes to the information system that are configuration-controlled. ",
  "IA.10": "ADAPTIVE IDENTIFICATION AND AUTHENTICATION - The organization requires that individuals accessing the information system employ organization-defined supplemental authentication techniques or mechanisms under specific organization-defined circumstances or situations. ",
  "IA.4": "IDENTIFIER MANAGEMENT -  The organization manages information system identifiers by: Receiving authorization from organization-defined personnel or roles to assign an individual, group, role, or device identifier. Selecting an identifier that identifies an individual, group, role, or device. Assigning the identifier to the intended individual, group, role, or device. Preventing reuse of identifiers for a organization-defined time period. Disabling the identifier after organization-defined time period of inactivity.",
  "IA.5": "AUTHENTICATOR MANAGEMENT",
  "MA.2": "CONTROLLED MAINTENANCE",
  "SA.11": "DEVELOPER SECURITY TESTING AND EVALUATION",
  "SC.2": "APPLICATION PARTITIONING",
  "SC.7": "BOUNDARY PROTECTION",
  "SC.8": "TRANSMISSION CONFIDENTIALITY AND INTEGRITY",
  "SI.10": "INFORMATION INPUT VALIDATION",
  "SI.11": "ERROR HANDLING",
  "SI.15": "INFORMATION OUTPUT FILTERING",
  "SI.16": "MEMORY PROTECTION",
  "SI.5": "SECURITY ALERTS, ADVISORIES, AND DIRECTIVES",
  "SI.7": "SOFTWARE, FIRMWARE, AND INFORMATION INTEGRITY"
};
