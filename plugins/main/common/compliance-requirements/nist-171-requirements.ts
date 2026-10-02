/*
 * Wazuh app - Module for NIST 800-171 requirements
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/*
 * Framework: nist_800_171
 * Catalog version: 1.0.0
 * Edition: Rev 2
 * Source: NIST SP 800-171 Rev 2 (upd 1) security requirements CSV, csrc.nist.gov
 * Controls: 110
 */
import { ComplianceRequirement } from './types';

export const nist171RequirementsFile: Record<string, ComplianceRequirement> = {
  '3.1.1': {
    title: 'Authorized Access Control [CUI Data]',
    description:
      'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
    category: 'Access Control',
  },
  '3.1.2': {
    title: 'Transaction & Function Control [CUI Data]',
    description:
      'Limit system access to the types of transactions and functions that authorized users are permitted to execute.',
    category: 'Access Control',
  },
  '3.1.3': {
    title: 'Control CUI Flow',
    description:
      'Control the flow of CUI in accordance with approved authorizations.',
    category: 'Access Control',
  },
  '3.1.4': {
    title: 'Separation of Duties',
    description:
      'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.',
    category: 'Access Control',
  },
  '3.1.5': {
    title: 'Least Privilege',
    description:
      'Employ the principle of least privilege, including for specific security functions and privileged accounts.',
    category: 'Access Control',
  },
  '3.1.6': {
    title: 'Non-Privileged Account Use',
    description:
      'Use non-privileged accounts or roles when accessing nonsecurity functions.',
    category: 'Access Control',
  },
  '3.1.7': {
    title: 'Privileged Functions',
    description:
      'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.',
    category: 'Access Control',
  },
  '3.1.8': {
    title: 'Unsuccessful Logon Attempts',
    description: 'Limit unsuccessful logon attempts.',
    category: 'Access Control',
  },
  '3.1.9': {
    title: 'Privacy & Security Notices',
    description:
      'Provide privacy and security notices consistent with applicable CUI rules.',
    category: 'Access Control',
  },
  '3.1.10': {
    title: 'Session Lock',
    description:
      'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.',
    category: 'Access Control',
  },
  '3.1.11': {
    title: 'Session Termination',
    description:
      'Terminate (automatically) a user session after a defined condition.',
    category: 'Access Control',
  },
  '3.1.12': {
    title: 'Control Remote Access',
    description: 'Monitor and control remote access sessions.',
    category: 'Access Control',
  },
  '3.1.13': {
    title: 'Remote Access Confidentiality',
    description:
      'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.',
    category: 'Access Control',
  },
  '3.1.14': {
    title: 'Remote Access Routing',
    description: 'Route remote access via managed access control points.',
    category: 'Access Control',
  },
  '3.1.15': {
    title: 'Privileged Remote Access',
    description:
      'Authorize remote execution of privileged commands and remote access to security-relevant information.',
    category: 'Access Control',
  },
  '3.1.16': {
    title: 'Wireless Access Authorization',
    description:
      'Authorize wireless access prior to allowing such connections.',
    category: 'Access Control',
  },
  '3.1.17': {
    title: 'Wireless Access Protection',
    description: 'Protect wireless access using authentication and encryption.',
    category: 'Access Control',
  },
  '3.1.18': {
    title: 'Mobile Device Connection',
    description: 'Control connection of mobile devices.',
    category: 'Access Control',
  },
  '3.1.19': {
    title: 'Encrypt CUI on Mobile',
    description:
      'Encrypt CUI on mobile devices and mobile computing platforms.',
    category: 'Access Control',
  },
  '3.1.20': {
    title: 'External Connections [CUI Data]',
    description:
      'Verify and control/limit connections to and use of external systems.',
    category: 'Access Control',
  },
  '3.1.21': {
    title: 'Portable Storage Use',
    description: 'Limit use of portable storage devices on external systems.',
    category: 'Access Control',
  },
  '3.1.22': {
    title: 'Control Public Information [CUI Data]',
    description:
      'Control CUI posted or processed on publicly accessible systems.',
    category: 'Access Control',
  },
  '3.2.1': {
    title: 'Role-Based Risk Awareness',
    description:
      'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.',
    category: 'Awareness and Training',
  },
  '3.2.2': {
    title: 'Role-Based Training',
    description:
      'Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities.',
    category: 'Awareness and Training',
  },
  '3.2.3': {
    title: 'Insider Threat Awareness',
    description:
      'Provide security awareness training on recognizing and reporting potential indicators of insider threat.',
    category: 'Awareness and Training',
  },
  '3.3.1': {
    title: 'System Auditing',
    description:
      'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.',
    category: 'Audit and Accountability',
  },
  '3.3.2': {
    title: 'User Accountability',
    description:
      'Ensure that the actions of individual system users can be uniquely traced to those users, so they can be held accountable for their actions.',
    category: 'Audit and Accountability',
  },
  '3.3.3': {
    title: 'Event Review',
    description: 'Review and update logged events.',
    category: 'Audit and Accountability',
  },
  '3.3.4': {
    title: 'Audit Failure Alerting',
    description: 'Alert in the event of an audit logging process failure.',
    category: 'Audit and Accountability',
  },
  '3.3.5': {
    title: 'Audit Correlation',
    description:
      'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.',
    category: 'Audit and Accountability',
  },
  '3.3.6': {
    title: 'Reduction & Reporting',
    description:
      'Provide audit record reduction and report generation to support on-demand analysis and reporting.',
    category: 'Audit and Accountability',
  },
  '3.3.7': {
    title: 'Authoritative Time Source',
    description:
      'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.',
    category: 'Audit and Accountability',
  },
  '3.3.8': {
    title: 'Audit Protection',
    description:
      'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.',
    category: 'Audit and Accountability',
  },
  '3.3.9': {
    title: 'Audit Management',
    description:
      'Limit management of audit logging functionality to a subset of privileged users.',
    category: 'Audit and Accountability',
  },
  '3.4.1': {
    title: 'System Baselining',
    description:
      'Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.',
    category: 'Configuration Management',
  },
  '3.4.2': {
    title: 'Security Configuration Enforcement',
    description:
      'Establish and enforce security configuration settings for information technology products employed in organizational systems.',
    category: 'Configuration Management',
  },
  '3.4.3': {
    title: 'System Change Management',
    description:
      'Track, review, approve or disapprove, and log changes to organizational systems.',
    category: 'Configuration Management',
  },
  '3.4.4': {
    title: 'Security Impact Analysis',
    description:
      'Analyze the security impact of changes prior to implementation.',
    category: 'Configuration Management',
  },
  '3.4.5': {
    title: 'Access Restrictions for Change',
    description:
      'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.',
    category: 'Configuration Management',
  },
  '3.4.6': {
    title: 'Least Functionality',
    description:
      'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.',
    category: 'Configuration Management',
  },
  '3.4.7': {
    title: 'Nonessential Functionality',
    description:
      'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.',
    category: 'Configuration Management',
  },
  '3.4.8': {
    title: 'Application Execution Policy',
    description:
      'Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.',
    category: 'Configuration Management',
  },
  '3.4.9': {
    title: 'User-Installed Software',
    description: 'Control and monitor user-installed software.',
    category: 'Configuration Management',
  },
  '3.5.1': {
    title: 'Identification [CUI Data]',
    description:
      'Identify system users, processes acting on behalf of users, and devices.',
    category: 'Identification and Authentication',
  },
  '3.5.2': {
    title: 'Authentication [CUI Data]',
    description:
      'Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.',
    category: 'Identification and Authentication',
  },
  '3.5.3': {
    title: 'Multifactor Authentication',
    description:
      'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts. .',
    category: 'Identification and Authentication',
  },
  '3.5.4': {
    title: 'Replay-Resistant Authentication',
    description:
      'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.',
    category: 'Identification and Authentication',
  },
  '3.5.5': {
    title: 'Identifier Reuse',
    description: 'Prevent reuse of identifiers for a defined period.',
    category: 'Identification and Authentication',
  },
  '3.5.6': {
    title: 'Identifier Handling',
    description: 'Disable identifiers after a defined period of inactivity.',
    category: 'Identification and Authentication',
  },
  '3.5.7': {
    title: 'Password Complexity',
    description:
      'Enforce a minimum password complexity and change of characters when new passwords are created.',
    category: 'Identification and Authentication',
  },
  '3.5.8': {
    title: 'Password Reuse',
    description:
      'Prohibit password reuse for a specified number of generations.',
    category: 'Identification and Authentication',
  },
  '3.5.9': {
    title: 'Temporary Passwords',
    description:
      'Allow temporary password use for system logons with an immediate change to a permanent password.',
    category: 'Identification and Authentication',
  },
  '3.5.10': {
    title: 'Cryptographically-Protected Passwords',
    description:
      'Store and transmit only cryptographically-protected passwords.',
    category: 'Identification and Authentication',
  },
  '3.5.11': {
    title: 'Obscure Feedback',
    description: 'Obscure feedback of authentication information.',
    category: 'Identification and Authentication',
  },
  '3.6.1': {
    title: 'Incident Handling',
    description:
      'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.',
    category: 'Incident response',
  },
  '3.6.2': {
    title: 'Incident Reporting',
    description:
      'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.',
    category: 'Incident response',
  },
  '3.6.3': {
    title: 'Incident Response Testing',
    description: 'Test the organizational incident response capability.',
    category: 'Incident response',
  },
  '3.7.1': {
    title: 'Perform Maintenance',
    description: 'Perform maintenance on organizational systems. .',
    category: 'Maintenance',
  },
  '3.7.2': {
    title: 'System Maintenance Control',
    description:
      'Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.',
    category: 'Maintenance',
  },
  '3.7.3': {
    title: 'Equipment Sanitization',
    description:
      'Ensure equipment removed for off-site maintenance is sanitized of any CUI.',
    category: 'Maintenance',
  },
  '3.7.4': {
    title: 'Media Inspection',
    description:
      'Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.',
    category: 'Maintenance',
  },
  '3.7.5': {
    title: 'Nonlocal Maintenance',
    description:
      'Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete.',
    category: 'Maintenance',
  },
  '3.7.6': {
    title: 'Maintenance Personnel',
    description:
      'Supervise the maintenance activities of maintenance personnel without required access authorization.',
    category: 'Maintenance',
  },
  '3.8.1': {
    title: 'Media Protection',
    description:
      'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.',
    category: 'Media Protection',
  },
  '3.8.2': {
    title: 'Media Access',
    description: 'Limit access to CUI on system media to authorized users.',
    category: 'Media Protection',
  },
  '3.8.3': {
    title: 'Media Disposal [CUI Data]',
    description:
      'Sanitize or destroy system media containing CUI before disposal or release for reuse.',
    category: 'Media Protection',
  },
  '3.8.4': {
    title: 'Media Markings',
    description:
      'Mark media with necessary CUI markings and distribution limitations.',
    category: 'Media Protection',
  },
  '3.8.5': {
    title: 'Media Accountability',
    description:
      'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.',
    category: 'Media Protection',
  },
  '3.8.6': {
    title: 'Portable Storage Encryption',
    description:
      'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.',
    category: 'Media Protection',
  },
  '3.8.7': {
    title: 'Removable Media',
    description: 'Control the use of removable media on system components.',
    category: 'Media Protection',
  },
  '3.8.8': {
    title: 'Shared Media',
    description:
      'Prohibit the use of portable storage devices when such devices have no identifiable owner.',
    category: 'Media Protection',
  },
  '3.8.9': {
    title: 'Protect Backups',
    description:
      'Protect the confidentiality of backup CUI at storage locations.',
    category: 'Media Protection',
  },
  '3.9.1': {
    title: 'Screen Individuals',
    description:
      'Screen individuals prior to authorizing access to organizational systems containing CUI.',
    category: 'Personnel Security',
  },
  '3.9.2': {
    title: 'Personnel Actions',
    description:
      'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.',
    category: 'Personnel Security',
  },
  '3.10.1': {
    title: 'Limit Physical Access [CUI Data]',
    description:
      'Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.',
    category: 'Physical Protection',
  },
  '3.10.2': {
    title: 'Monitor Facility',
    description:
      'Protect and monitor the physical facility and support infrastructure for organizational systems.',
    category: 'Physical Protection',
  },
  '3.10.3': {
    title: 'Escort Visitors [CUI Data]',
    description: 'Escort visitors and monitor visitor activity.',
    category: 'Physical Protection',
  },
  '3.10.4': {
    title: 'Physical Access Logs [CUI Data]',
    description: 'Maintain audit logs of physical access.',
    category: 'Physical Protection',
  },
  '3.10.5': {
    title: 'Manage Physical Access [CUI Data]',
    description: 'Control and manage physical access devices.',
    category: 'Physical Protection',
  },
  '3.10.6': {
    title: 'Alternative Work Sites',
    description:
      'Enforce safeguarding measures for CUI at alternate work sites.',
    category: 'Physical Protection',
  },
  '3.11.1': {
    title: 'Risk Assessments',
    description:
      'Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.',
    category: 'Risk Assessment',
  },
  '3.11.2': {
    title: 'Vulnerability Scan',
    description:
      'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.',
    category: 'Risk Assessment',
  },
  '3.11.3': {
    title: 'Vulnerability Remediation',
    description:
      'Remediate vulnerabilities in accordance with risk assessments.',
    category: 'Risk Assessment',
  },
  '3.12.1': {
    title: 'Security Control Assessment',
    description:
      'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.',
    category: 'Security Assessment',
  },
  '3.12.2': {
    title: 'Operational Plan of Action',
    description:
      'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.',
    category: 'Security Assessment',
  },
  '3.12.3': {
    title: 'Security Control Monitoring',
    description:
      'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.',
    category: 'Security Assessment',
  },
  '3.12.4': {
    title: 'System Security Plan',
    description:
      'Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.',
    category: 'Security Assessment',
  },
  '3.13.1': {
    title: 'Boundary Protection [CUI Data]',
    description:
      'Monitor, control, and protect communications (i.e., information transmitted or received by organizational systems) at the external boundaries and key internal boundaries of organizational systems.',
    category: 'System and Communications Protection',
  },
  '3.13.2': {
    title: 'Security Engineering',
    description:
      'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.',
    category: 'System and Communications Protection',
  },
  '3.13.3': {
    title: 'Role Separation',
    description:
      'Separate user functionality from system management functionality.',
    category: 'System and Communications Protection',
  },
  '3.13.4': {
    title: 'Shared Resource Control',
    description:
      'Prevent unauthorized and unintended information transfer via shared system resources.',
    category: 'System and Communications Protection',
  },
  '3.13.5': {
    title: 'Public-Access System Separation [CUI Data]',
    description:
      'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.',
    category: 'System and Communications Protection',
  },
  '3.13.6': {
    title: 'Network Communication by Exception',
    description:
      'Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).',
    category: 'System and Communications Protection',
  },
  '3.13.7': {
    title: 'Split Tunneling',
    description:
      'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (i.e., split tunneling).',
    category: 'System and Communications Protection',
  },
  '3.13.8': {
    title: 'Data in Transit',
    description:
      'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.',
    category: 'System and Communications Protection',
  },
  '3.13.9': {
    title: 'Connections Termination',
    description:
      'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.',
    category: 'System and Communications Protection',
  },
  '3.13.10': {
    title: 'Key Management',
    description:
      'Establish and manage cryptographic keys for cryptography employed in organizational systems.',
    category: 'System and Communications Protection',
  },
  '3.13.11': {
    title: 'CUI Encryption',
    description:
      'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.',
    category: 'System and Communications Protection',
  },
  '3.13.12': {
    title: 'Collaborative Device Control',
    description:
      'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device. .',
    category: 'System and Communications Protection',
  },
  '3.13.13': {
    title: 'Mobile Code',
    description: 'Control and monitor the use of mobile code.',
    category: 'System and Communications Protection',
  },
  '3.13.14': {
    title: 'Voice over Internet Protocol',
    description:
      'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.',
    category: 'System and Communications Protection',
  },
  '3.13.15': {
    title: 'Communications Authenticity',
    description: 'Protect the authenticity of communications sessions.',
    category: 'System and Communications Protection',
  },
  '3.13.16': {
    title: 'Data at Rest',
    description: 'Protect the confidentiality of CUI at rest.',
    category: 'System and Communications Protection',
  },
  '3.14.1': {
    title: 'Flaw Remediation [CUI Data]',
    description:
      'Identify, report, and correct system flaws in a timely manner.',
    category: 'System and Information Integrity',
  },
  '3.14.2': {
    title: 'Malicious Code Protection [CUI Data]',
    description:
      'Provide protection from malicious code at designated locations within organizational systems.',
    category: 'System and Information Integrity',
  },
  '3.14.3': {
    title: 'Security Alerts & Advisories',
    description:
      'Monitor system security alerts and advisories and take action in response.',
    category: 'System and Information Integrity',
  },
  '3.14.4': {
    title: 'Update Malicious Code Protection [CUI Data]',
    description:
      'Update malicious code protection mechanisms when new releases are available.',
    category: 'System and Information Integrity',
  },
  '3.14.5': {
    title: 'System & File Scanning [CUI Data]',
    description:
      'Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.',
    category: 'System and Information Integrity',
  },
  '3.14.6': {
    title: 'Monitor Communications for Attacks',
    description:
      'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.',
    category: 'System and Information Integrity',
  },
  '3.14.7': {
    title: 'Identify Unauthorized Use',
    description: 'Identify unauthorized use of organizational systems.',
    category: 'System and Information Integrity',
  },
};
