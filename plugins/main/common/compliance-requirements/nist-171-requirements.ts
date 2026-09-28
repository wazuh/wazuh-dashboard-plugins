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
 * Edition: Rev 2
 * Source: NIST SP 800-171 Rev 2 (upd 1) security requirements CSV, csrc.nist.gov
 * Controls: 110
 */
import { ComplianceRequirement } from './types';

export const nist171RequirementsFile: Record<string, ComplianceRequirement> = {
  '3.1.1': {
    title:
      'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
  },
  '3.1.2': {
    title:
      'Limit system access to the types of transactions and functions that authorized users are permitted to execute.',
  },
  '3.1.3': {
    title:
      'Control the flow of CUI in accordance with approved authorizations.',
  },
  '3.1.4': {
    title:
      'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.',
  },
  '3.1.5': {
    title:
      'Employ the principle of least privilege, including for specific security functions and privileged accounts.',
  },
  '3.1.6': {
    title:
      'Use non-privileged accounts or roles when accessing nonsecurity functions.',
  },
  '3.1.7': {
    title:
      'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.',
  },
  '3.1.8': { title: 'Limit unsuccessful logon attempts.' },
  '3.1.9': {
    title:
      'Provide privacy and security notices consistent with applicable CUI rules.',
  },
  '3.1.10': {
    title:
      'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.',
  },
  '3.1.11': {
    title:
      'Terminate (automatically) a user session after a defined condition.',
  },
  '3.1.12': { title: 'Monitor and control remote access sessions.' },
  '3.1.13': {
    title:
      'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.',
  },
  '3.1.14': { title: 'Route remote access via managed access control points.' },
  '3.1.15': {
    title:
      'Authorize remote execution of privileged commands and remote access to security-relevant information.',
  },
  '3.1.16': {
    title: 'Authorize wireless access prior to allowing such connections.',
  },
  '3.1.17': {
    title: 'Protect wireless access using authentication and encryption.',
  },
  '3.1.18': { title: 'Control connection of mobile devices.' },
  '3.1.19': {
    title: 'Encrypt CUI on mobile devices and mobile computing platforms.',
  },
  '3.1.20': {
    title:
      'Verify and control/limit connections to and use of external systems.',
  },
  '3.1.21': {
    title: 'Limit use of portable storage devices on external systems.',
  },
  '3.1.22': {
    title: 'Control CUI posted or processed on publicly accessible systems.',
  },
  '3.2.1': {
    title:
      'Ensure that managers, systems administrators, and users of organizational systems are made aware of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.',
  },
  '3.2.2': {
    title:
      'Ensure that personnel are trained to carry out their assigned information security-related duties and responsibilities.',
  },
  '3.2.3': {
    title:
      'Provide security awareness training on recognizing and reporting potential indicators of insider threat.',
  },
  '3.3.1': {
    title:
      'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.',
  },
  '3.3.2': {
    title:
      'Ensure that the actions of individual system users can be uniquely traced to those users, so they can be held accountable for their actions.',
  },
  '3.3.3': { title: 'Review and update logged events.' },
  '3.3.4': { title: 'Alert in the event of an audit logging process failure.' },
  '3.3.5': {
    title:
      'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.',
  },
  '3.3.6': {
    title:
      'Provide audit record reduction and report generation to support on-demand analysis and reporting.',
  },
  '3.3.7': {
    title:
      'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.',
  },
  '3.3.8': {
    title:
      'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.',
  },
  '3.3.9': {
    title:
      'Limit management of audit logging functionality to a subset of privileged users.',
  },
  '3.4.1': {
    title:
      'Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.',
  },
  '3.4.2': {
    title:
      'Establish and enforce security configuration settings for information technology products employed in organizational systems.',
  },
  '3.4.3': {
    title:
      'Track, review, approve or disapprove, and log changes to organizational systems.',
  },
  '3.4.4': {
    title: 'Analyze the security impact of changes prior to implementation.',
  },
  '3.4.5': {
    title:
      'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.',
  },
  '3.4.6': {
    title:
      'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.',
  },
  '3.4.7': {
    title:
      'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.',
  },
  '3.4.8': {
    title:
      'Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.',
  },
  '3.4.9': { title: 'Control and monitor user-installed software.' },
  '3.5.1': {
    title:
      'Identify system users, processes acting on behalf of users, and devices.',
  },
  '3.5.2': {
    title:
      'Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.',
  },
  '3.5.3': {
    title:
      'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts. .',
  },
  '3.5.4': {
    title:
      'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.',
  },
  '3.5.5': { title: 'Prevent reuse of identifiers for a defined period.' },
  '3.5.6': {
    title: 'Disable identifiers after a defined period of inactivity.',
  },
  '3.5.7': {
    title:
      'Enforce a minimum password complexity and change of characters when new passwords are created.',
  },
  '3.5.8': {
    title: 'Prohibit password reuse for a specified number of generations.',
  },
  '3.5.9': {
    title:
      'Allow temporary password use for system logons with an immediate change to a permanent password.',
  },
  '3.5.10': {
    title: 'Store and transmit only cryptographically-protected passwords.',
  },
  '3.5.11': { title: 'Obscure feedback of authentication information.' },
  '3.6.1': {
    title:
      'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.',
  },
  '3.6.2': {
    title:
      'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.',
  },
  '3.6.3': { title: 'Test the organizational incident response capability.' },
  '3.7.1': { title: 'Perform maintenance on organizational systems. .' },
  '3.7.2': {
    title:
      'Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.',
  },
  '3.7.3': {
    title:
      'Ensure equipment removed for off-site maintenance is sanitized of any CUI.',
  },
  '3.7.4': {
    title:
      'Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.',
  },
  '3.7.5': {
    title:
      'Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete.',
  },
  '3.7.6': {
    title:
      'Supervise the maintenance activities of maintenance personnel without required access authorization.',
  },
  '3.8.1': {
    title:
      'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.',
  },
  '3.8.2': {
    title: 'Limit access to CUI on system media to authorized users.',
  },
  '3.8.3': {
    title:
      'Sanitize or destroy system media containing CUI before disposal or release for reuse.',
  },
  '3.8.4': {
    title:
      'Mark media with necessary CUI markings and distribution limitations.',
  },
  '3.8.5': {
    title:
      'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.',
  },
  '3.8.6': {
    title:
      'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.',
  },
  '3.8.7': {
    title: 'Control the use of removable media on system components.',
  },
  '3.8.8': {
    title:
      'Prohibit the use of portable storage devices when such devices have no identifiable owner.',
  },
  '3.8.9': {
    title: 'Protect the confidentiality of backup CUI at storage locations.',
  },
  '3.9.1': {
    title:
      'Screen individuals prior to authorizing access to organizational systems containing CUI.',
  },
  '3.9.2': {
    title:
      'Ensure that organizational systems containing CUI are protected during and after personnel actions such as terminations and transfers.',
  },
  '3.10.1': {
    title:
      'Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.',
  },
  '3.10.2': {
    title:
      'Protect and monitor the physical facility and support infrastructure for organizational systems.',
  },
  '3.10.3': { title: 'Escort visitors and monitor visitor activity.' },
  '3.10.4': { title: 'Maintain audit logs of physical access.' },
  '3.10.5': { title: 'Control and manage physical access devices.' },
  '3.10.6': {
    title: 'Enforce safeguarding measures for CUI at alternate work sites.',
  },
  '3.11.1': {
    title:
      'Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.',
  },
  '3.11.2': {
    title:
      'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.',
  },
  '3.11.3': {
    title: 'Remediate vulnerabilities in accordance with risk assessments.',
  },
  '3.12.1': {
    title:
      'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.',
  },
  '3.12.2': {
    title:
      'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.',
  },
  '3.12.3': {
    title:
      'Monitor security controls on an ongoing basis to ensure the continued effectiveness of the controls.',
  },
  '3.12.4': {
    title:
      'Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.',
  },
  '3.13.1': {
    title:
      'Monitor, control, and protect communications (i.e., information transmitted or received by organizational systems) at the external boundaries and key internal boundaries of organizational systems.',
  },
  '3.13.2': {
    title:
      'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.',
  },
  '3.13.3': {
    title: 'Separate user functionality from system management functionality.',
  },
  '3.13.4': {
    title:
      'Prevent unauthorized and unintended information transfer via shared system resources.',
  },
  '3.13.5': {
    title:
      'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.',
  },
  '3.13.6': {
    title:
      'Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).',
  },
  '3.13.7': {
    title:
      'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (i.e., split tunneling).',
  },
  '3.13.8': {
    title:
      'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.',
  },
  '3.13.9': {
    title:
      'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.',
  },
  '3.13.10': {
    title:
      'Establish and manage cryptographic keys for cryptography employed in organizational systems.',
  },
  '3.13.11': {
    title:
      'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.',
  },
  '3.13.12': {
    title:
      'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device. .',
  },
  '3.13.13': { title: 'Control and monitor the use of mobile code.' },
  '3.13.14': {
    title:
      'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.',
  },
  '3.13.15': { title: 'Protect the authenticity of communications sessions.' },
  '3.13.16': { title: 'Protect the confidentiality of CUI at rest.' },
  '3.14.1': {
    title: 'Identify, report, and correct system flaws in a timely manner.',
  },
  '3.14.2': {
    title:
      'Provide protection from malicious code at designated locations within organizational systems.',
  },
  '3.14.3': {
    title:
      'Monitor system security alerts and advisories and take action in response.',
  },
  '3.14.4': {
    title:
      'Update malicious code protection mechanisms when new releases are available.',
  },
  '3.14.5': {
    title:
      'Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.',
  },
  '3.14.6': {
    title:
      'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.',
  },
  '3.14.7': { title: 'Identify unauthorized use of organizational systems.' },
};
