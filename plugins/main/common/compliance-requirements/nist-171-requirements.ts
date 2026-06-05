/*
 * Wazuh app - Module for NIST 800-171 Rev. 2 requirements
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 * Source: NIST Special Publication 800-171 Rev. 2
 * https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171r2.pdf
 *
 * NOTE: Key format follows the Rev. 2 numbering scheme (3.X.X) to match
 * values stored in the wazuh.rule.compliance.nist_800_171 index field.
 */
export const nist171RequirementsFile = {
  // 3.1 Access Control
  '3.1.1':
    'SYSTEM ACCESS CONTROL - Limit information system access to authorized users, processes acting on behalf of authorized users, and devices (including other information systems).',
  '3.1.2':
    'ACCESS ENFORCEMENT - Limit information system access to the types of transactions and functions that authorized users are permitted to execute.',
  '3.1.3':
    'INFORMATION FLOW ENFORCEMENT - Control the flow of CUI in accordance with approved authorizations.',
  '3.1.4':
    'SEPARATION OF DUTIES - Separate the duties of individuals to reduce the risk of malevolent activity without collusion.',
  '3.1.5':
    'LEAST PRIVILEGE - Employ the principle of least privilege, including for specific security functions and privileged accounts.',
  '3.1.6':
    'LEAST PRIVILEGE – NON-PRIVILEGED ACCESS - Use non-privileged accounts or roles when accessing non-security functions.',
  '3.1.7':
    'LEAST PRIVILEGE – PRIVILEGED FUNCTIONS - Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.',
  '3.1.8': 'UNSUCCESSFUL LOGON ATTEMPTS - Limit unsuccessful logon attempts.',
  '3.1.9':
    'SYSTEM USE NOTIFICATION - Provide privacy and security notices consistent with CUI rules.',
  '3.1.10':
    'SESSION LOCK - Use session lock with pattern-hiding displays after a period of inactivity.',
  '3.1.11':
    'SESSION TERMINATION - Terminate (automatically) a user session after a defined condition.',
  '3.1.12': 'REMOTE ACCESS - Monitor and control remote access sessions.',
  '3.1.13':
    'REMOTE ACCESS – CRYPTOGRAPHIC PROTECTION - Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.',
  '3.1.14':
    'REMOTE ACCESS – MANAGED ACCESS CONTROL POINTS - Route remote access via managed access control points.',
  '3.1.15':
    'REMOTE ACCESS – PRIVILEGED COMMANDS - Authorize remote execution of privileged commands and access to security-relevant information via remote access only for documented operational needs.',
  '3.1.16':
    'WIRELESS ACCESS AUTHORIZATION - Authorize wireless access prior to allowing such connections.',
  '3.1.17':
    'WIRELESS ACCESS PROTECTION - Protect wireless access using authentication and encryption.',
  '3.1.18':
    'MOBILE DEVICE ACCESS CONTROL - Control connection of mobile devices.',
  '3.1.19':
    'MOBILE DEVICE ENCRYPTION - Encrypt CUI on mobile devices and mobile computing platforms.',
  '3.1.20':
    'EXTERNAL SYSTEMS - Verify and control/limit connections to external information systems.',
  '3.1.21':
    'PORTABLE STORAGE DEVICES - Limit use of portable storage devices on external systems.',
  '3.1.22':
    'PUBLICLY ACCESSIBLE CONTENT - Control CUI posted or processed on publicly accessible information systems.',

  // 3.2 Awareness and Training
  '3.2.1':
    'SECURITY AWARENESS - Ensure that managers, system administrators, and users of organizational systems are made aware of security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.',
  '3.2.2':
    'ROLE-BASED TRAINING - Ensure that organizational personnel are adequately trained to carry out their assigned information security responsibilities.',
  '3.2.3':
    'INSIDER THREAT AWARENESS - Provide security awareness training on recognizing and reporting potential indicators of insider threat.',

  // 3.3 Audit and Accountability
  '3.3.1':
    'AUDIT LOGGING - Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.',
  '3.3.2':
    'USER ACCOUNTABILITY - Ensure that the actions of individual system users can be traced to those users so they can be held accountable for their actions.',
  '3.3.3': 'EVENT REVIEW - Review and update logged events.',
  '3.3.4':
    'AUDIT FAILURE ALERTING - Alert in the event of an audit logging process failure.',
  '3.3.5':
    'AUDIT REPORTING - Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.',
  '3.3.6':
    'REDUCTION AND REPORTING - Provide audit record reduction and report generation to support on-demand analysis and reporting.',
  '3.3.7':
    'TIME SYNCHRONIZATION - Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.',
  '3.3.8':
    'AUDIT INFORMATION PROTECTION - Protect audit information and audit tools from unauthorized access, modification, and deletion.',
  '3.3.9':
    'AUDIT LOGGING MANAGEMENT - Limit management of audit logging to a subset of privileged users.',

  // 3.4 Configuration Management
  '3.4.1':
    'BASELINE CONFIGURATION - Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.',
  '3.4.2':
    'CONFIGURATION SETTINGS - Establish and enforce security configuration settings for information technology products employed in organizational systems.',
  '3.4.3':
    'CONFIGURATION CHANGE CONTROL - Track, review, approve, and log changes to organizational systems.',
  '3.4.4':
    'SECURITY IMPACT ANALYSIS - Analyze the security impact of changes prior to implementation.',
  '3.4.5':
    'ACCESS RESTRICTIONS FOR CHANGE - Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.',
  '3.4.6':
    'LEAST FUNCTIONALITY - Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.',
  '3.4.7':
    'NONESSENTIAL CAPABILITIES - Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.',
  '3.4.8':
    'APPLICATION EXECUTION POLICY - Apply deny-by-exception (blacklist) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelist) policy to allow the execution of authorized software.',
  '3.4.9':
    'USER-INSTALLED SOFTWARE - Control and monitor user-installed software.',

  // 3.5 Identification and Authentication
  '3.5.1':
    'IDENTIFICATION - Identify information system users, processes acting on behalf of users, or devices.',
  '3.5.2':
    'AUTHENTICATION - Authenticate (or verify) the identities of those users, processes, or devices as a prerequisite to allowing access to organizational systems.',
  '3.5.3':
    'MULTI-FACTOR AUTHENTICATION - Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.',
  '3.5.4':
    'REPLAY-RESISTANT AUTHENTICATION - Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.',
  '3.5.5':
    'IDENTIFIER REUSE - Employ identifier management practices to prevent the reuse of identifiers for a defined period.',
  '3.5.6':
    'IDENTIFIER HANDLING - Disable identifiers after a defined inactivity period.',
  '3.5.7':
    'PASSWORD COMPLEXITY - Enforce a minimum password complexity and change of characters when new passwords are created.',
  '3.5.8':
    'PASSWORD REUSE - Prohibit password reuse for a specified number of generations.',
  '3.5.9':
    'TEMPORARY PASSWORDS - Allow temporary password use for system logons with an immediate change to a permanent password.',
  '3.5.10':
    'CRYPTOGRAPHIC AUTHENTICATION - Store and transmit only cryptographically protected passwords.',
  '3.5.11':
    'AUTHENTICATION FEEDBACK - Obscure feedback of authentication information.',

  // 3.6 Incident Response
  '3.6.1':
    'INCIDENT HANDLING - Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.',
  '3.6.2':
    'INCIDENT REPORTING - Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.',
  '3.6.3':
    'INCIDENT RESPONSE TESTING - Test the organizational incident response capability.',

  // 3.7 Maintenance
  '3.7.1':
    'CONTROLLED MAINTENANCE - Perform maintenance on organizational systems.',
  '3.7.2':
    'MAINTENANCE CONTROLS - Provide controls on the tools, techniques, mechanisms, and personnel that conduct system maintenance.',
  '3.7.3':
    'EQUIPMENT SANITIZATION - Ensure equipment removed for maintenance is sanitized.',
  '3.7.4':
    'MAINTENANCE TOOLS - Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.',
  '3.7.5':
    'NONLOCAL MAINTENANCE - Require multifactor authentication to establish nonlocal maintenance sessions via external network connections, and terminate such connections when nonlocal maintenance is completed.',
  '3.7.6':
    'MAINTENANCE PERSONNEL - Supervise the maintenance activities of maintenance personnel without required access authorization.',

  // 3.8 Media Protection
  '3.8.1':
    'MEDIA PROTECTION - Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.',
  '3.8.2':
    'MEDIA ACCESS - Limit access to CUI on system media to authorized users.',
  '3.8.3':
    'MEDIA SANITIZATION - Sanitize or destroy information system media before disposal or reuse.',
  '3.8.4':
    'MEDIA MARKINGS - Mark media with necessary CUI markings and distribution limitations.',
  '3.8.5':
    'MEDIA ACCOUNTABILITY - Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.',
  '3.8.6':
    'MEDIA TRANSPORT ENCRYPTION - Implement cryptographic mechanisms to protect the confidentiality of CUI during transport unless otherwise protected by alternative physical safeguards.',
  '3.8.7':
    'REMOVABLE MEDIA - Control the use of removable media on system components.',
  '3.8.8':
    'SHARED MEDIA - Prohibit the use of portable storage devices when such devices have no identifiable owner.',
  '3.8.9':
    'BACKUP CUI PROTECTION - Protect the confidentiality of backup CUI at storage locations.',

  // 3.9 Personnel Security
  '3.9.1':
    'PERSONNEL SCREENING - Screen individuals prior to authorizing access to organizational systems containing CUI.',
  '3.9.2':
    'PERSONNEL TERMINATION AND TRANSFER - Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.',

  // 3.10 Physical Protection
  '3.10.1':
    'PHYSICAL ACCESS AUTHORIZATIONS - Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.',
  '3.10.2':
    'MONITORING PHYSICAL ACCESS - Protect and monitor the physical facility and support infrastructure for organizational systems.',
  '3.10.3': 'VISITOR ACCESS - Escort visitors and monitor visitor activity.',
  '3.10.4': 'PHYSICAL ACCESS LOGS - Maintain audit logs of physical access.',
  '3.10.5':
    'PHYSICAL ACCESS CONTROL - Control and manage physical access devices.',
  '3.10.6':
    'ALTERNATE WORK SITE - Enforce safeguarding measures for CUI at alternate work sites.',

  // 3.11 Risk Assessment
  '3.11.1':
    'RISK ASSESSMENT - Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational information systems and the associated processing, storage, or transmission of CUI.',
  '3.11.2':
    'VULNERABILITY SCANNING - Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems are identified.',
  '3.11.3':
    'VULNERABILITY REMEDIATION - Remediate vulnerabilities in accordance with risk assessments.',

  // 3.12 Security Assessment
  '3.12.1':
    'SECURITY ASSESSMENT - Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.',
  '3.12.2':
    'PLAN OF ACTION - Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.',
  '3.12.3':
    'CONTINUOUS MONITORING - Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.',
  '3.12.4':
    'SYSTEM SECURITY PLAN - Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.',

  // 3.13 System and Communications Protection
  '3.13.1':
    'BOUNDARY PROTECTION - Monitor, control, and protect organizational communications at the external boundaries and key internal boundaries of the information systems.',
  '3.13.2':
    'SECURITY ENGINEERING PRINCIPLES - Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.',
  '3.13.3':
    'SEPARATION OF USER AND SYSTEM FUNCTIONALITY - Separate user functionality from information system management functionality.',
  '3.13.4':
    'SHARED SYSTEM RESOURCES - Prevent unauthorized and unintended information transfer via shared system resources.',
  '3.13.5':
    'NETWORK SEGMENTATION - Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.',
  '3.13.6':
    'NETWORK DENY BY DEFAULT - Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).',
  '3.13.7':
    'SPLIT TUNNELING - Prevent remote devices from simultaneously establishing non-remote connections with the system and communicating via some other connection to resources in external networks.',
  '3.13.8':
    'TRANSMISSION CONFIDENTIALITY - Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.',
  '3.13.9':
    'NETWORK DISCONNECT - Terminate network connections associated with communications sessions after a defined period of inactivity or at the end of a communications session.',
  '3.13.10':
    'CRYPTOGRAPHIC KEY MANAGEMENT - Establish and manage cryptographic keys for required cryptography employed in organizational systems.',
  '3.13.11':
    'CRYPTOGRAPHIC PROTECTION - Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.',
  '3.13.12':
    'COLLABORATIVE COMPUTING DEVICES - Prohibit remote activation of collaborative computing devices and provide indication of use to present users.',
  '3.13.13': 'MOBILE CODE - Control and monitor the use of mobile code.',
  '3.13.14':
    'VOICE OVER INTERNET PROTOCOL - Control and monitor the use of VoIP technologies.',
  '3.13.15':
    'COMMUNICATIONS AUTHENTICITY - Protect the authenticity of communications sessions.',
  '3.13.16': 'DATA AT REST - Protect the confidentiality of CUI at rest.',

  // 3.14 System and Information Integrity
  '3.14.1':
    'FLAW REMEDIATION - Identify, report, and correct information and information system flaws in a timely manner.',
  '3.14.2':
    'MALICIOUS CODE PROTECTION - Provide protection from malicious code at appropriate locations within organizational information systems.',
  '3.14.3':
    'SECURITY ALERTS AND ADVISORIES - Monitor information system security alerts and advisories and take action in response.',
  '3.14.4':
    'MALICIOUS CODE UPDATES - Update malicious code protection mechanisms when new releases are available.',
  '3.14.5':
    'SYSTEM AND FILE SCANNING - Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.',
  '3.14.6':
    'SYSTEM MONITORING - Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.',
  '3.14.7':
    'IDENTIFICATION OF UNAUTHORIZED USE - Identify unauthorized use of organizational information systems.',
};
