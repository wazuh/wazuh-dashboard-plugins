/*
 * Wazuh app - Module for FedRAMP requirements
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
 * Framework: fedramp
 * Edition: Rev 5 baselines (Class B = Low, Class C = Moderate, Class D = High)
 * Source: FedRAMP Full Rev5 Control Reference (fedramp.gov), one page per NIST SP 800-53 Rev 5 family
 * Controls: 409
 */
import { ComplianceRequirement } from './types';

export const fedrampRequirementsFile: Record<string, ComplianceRequirement> = {
  'AC-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] access control policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the access control policy and the associated access controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the access control policy and procedures; and\nc. Review and update the current access control:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'AC-2': {
    title: 'Account Management',
    description:
      'a. Define and document the types of accounts allowed and specifically prohibited for use within the system;\nb. Assign account managers;\nc. Require [Assignment: organization-defined prerequisites and criteria] for group and role membership;\nd. Specify:\n1. Authorized users of the system;\n2. Group and role membership; and\n3. Access authorizations (i.e., privileges) and [Assignment: organization-defined attributes (as required)] for each account;\ne. Require approvals by [Assignment: organization-defined personnel or roles] for requests to create accounts;\nf. Create, enable, modify, disable, and remove accounts in accordance with [Assignment: organization-defined policy, procedures, prerequisites, and criteria];\ng. Monitor the use of accounts;\nh. Notify account managers and [Assignment: organization-defined personnel or roles] within:\n1. [Assignment: organization-defined time period] when accounts are no longer required;\n2. [Assignment: organization-defined time period] when users are terminated or transferred; and\n3. [Assignment: organization-defined time period] when system usage or need-to-know changes for an individual;\ni. Authorize access to the system based on:\n1. A valid access authorization;\n2. Intended system usage; and\n3. [Assignment: organization-defined attributes (as required)];\nj. Review accounts for compliance with account management requirements [Assignment: organization-defined frequency];\nk. Establish and implement a process for changing shared or group account authenticators (if deployed) when individuals are removed from the group; and\nl. Align account management processes with personnel termination and transfer processes.',
  },
  'AC-2(1)': {
    title: 'Automated System Account Management',
    description:
      'Support the management of system accounts using [Assignment: organization-defined automated mechanisms].',
  },
  'AC-2(2)': {
    title: 'Automated Temporary and Emergency Account Management',
    description:
      'Automatically [Selection: one of: remove; disable] temporary and emergency accounts after [Assignment: organization-defined time period].',
  },
  'AC-2(3)': {
    title: 'Disable Accounts',
    description:
      'Disable accounts within [Assignment: organization-defined time period] when the accounts:\n(a) Have expired;\n(b) Are no longer associated with a user or individual;\n(c) Are in violation of organizational policy; or\n(d) Have been inactive for [Assignment: organization-defined time period].',
  },
  'AC-2(4)': {
    title: 'Automated Audit Actions',
    description:
      'Automatically audit account creation, modification, enabling, disabling, and removal actions.',
  },
  'AC-2(5)': {
    title: 'Inactivity Logout',
    description:
      'Require that users log out when [Assignment: organization-defined time period of expected inactivity or description of when to log out].',
  },
  'AC-2(7)': {
    title: 'Privileged User Accounts',
    description:
      '(a) Establish and administer privileged user accounts in accordance with [Selection: one of: a role-based access scheme; an attribute-based access scheme];\n(b) Monitor privileged role or attribute assignments;\n(c) Monitor changes to roles or attributes; and\n(d) Revoke access when privileged role or attribute assignments are no longer appropriate.',
  },
  'AC-2(9)': {
    title: 'Restrictions on Use of Shared and Group Accounts',
    description:
      'Only permit the use of shared and group accounts that meet [Assignment: organization-defined conditions].',
  },
  'AC-2(11)': {
    title: 'Usage Conditions',
    description:
      'Enforce [Assignment: organization-defined circumstances and/or usage conditions] for [Assignment: organization-defined system accounts].',
  },
  'AC-2(12)': {
    title: 'Account Monitoring for Atypical Usage',
    description:
      '(a) Monitor system accounts for [Assignment: organization-defined atypical usage]; and\n(b) Report atypical usage of system accounts to [Assignment: organization-defined personnel or roles].',
  },
  'AC-2(13)': {
    title: 'Disable Accounts for High-risk Individuals',
    description:
      'Disable accounts of individuals within [Assignment: organization-defined time period] of discovery of [Assignment: organization-defined significant risks].',
  },
  'AC-3': {
    title: 'Access Enforcement',
    description:
      'Enforce approved authorizations for logical access to information and system resources in accordance with applicable access control policies.',
  },
  'AC-4': {
    title: 'Information Flow Enforcement',
    description:
      'Enforce approved authorizations for controlling the flow of information within the system and between connected systems based on [Assignment: organization-defined information flow control policies].',
  },
  'AC-4(4)': {
    title: 'Flow Control of Encrypted Information',
    description:
      'Prevent encrypted information from bypassing [Assignment: organization-defined information flow control mechanisms] by [Selection: one or more of: decrypting the information; blocking the flow of the encrypted information; terminating communications sessions attempting to pass encrypted information].',
  },
  'AC-4(21)': {
    title: 'Physical or Logical Separation of Information Flows',
    description:
      'Separate information flows logically or physically using [Assignment: organization-defined mechanisms and/or techniques] to accomplish [Assignment: organization-defined required separations].',
  },
  'AC-5': {
    title: 'Separation of Duties',
    description:
      'a. Identify and document [Assignment: organization-defined duties of individuals]; and\nb. Define system access authorizations to support separation of duties.',
  },
  'AC-6': {
    title: 'Least Privilege',
    description:
      'Employ the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) that are necessary to accomplish assigned organizational tasks.',
  },
  'AC-6(1)': {
    title: 'Authorize Access to Security Functions',
    description:
      'Authorize access for [Assignment: organization-defined individuals and roles] to:\n(a) [Assignment: organization-defined security functions (deployed in hardware, software, and firmware)]; and\n(b) [Assignment: organization-defined security-relevant information].',
  },
  'AC-6(2)': {
    title: 'Non-privileged Access for Nonsecurity Functions',
    description:
      'Require that users of system accounts (or roles) with access to [Assignment: organization-defined security functions or security-relevant information] use non-privileged accounts or roles, when accessing nonsecurity functions.',
  },
  'AC-6(3)': {
    title: 'Network Access to Privileged Commands',
    description:
      'Authorize network access to [Assignment: organization-defined privileged commands] only for [Assignment: organization-defined compelling operational needs] and document the rationale for such access in the security plan for the system.',
  },
  'AC-6(5)': {
    title: 'Privileged Accounts',
    description:
      'Restrict privileged accounts on the system to [Assignment: organization-defined personnel or roles].',
  },
  'AC-6(7)': {
    title: 'Review of User Privileges',
    description:
      '(a) Review [Assignment: organization-defined frequency] the privileges assigned to [Assignment: organization-defined roles and classes] to validate the need for such privileges; and\n(b) Reassign or remove privileges, if necessary, to correctly reflect organizational mission and business needs.',
  },
  'AC-6(8)': {
    title: 'Privilege Levels for Code Execution',
    description:
      'Prevent the following software from executing at higher privilege levels than users executing the software: [Assignment: organization-defined software].',
  },
  'AC-6(9)': {
    title: 'Log Use of Privileged Functions',
    description: 'Log the execution of privileged functions.',
  },
  'AC-6(10)': {
    title: 'Prohibit Non-privileged Users from Executing Privileged Functions',
    description:
      'Prevent non-privileged users from executing privileged functions.',
  },
  'AC-7': {
    title: 'Unsuccessful Logon Attempts',
    description:
      'a. Enforce a limit of [Assignment: organization-defined number] consecutive invalid logon attempts by a user during a [Assignment: organization-defined time period]; and\nb. Automatically [Selection: one or more of: lock the account or node for; lock the account or node until released by an administrator; delay next logon prompt per; notify system administrator; take other] when the maximum number of unsuccessful attempts is exceeded.',
  },
  'AC-8': {
    title: 'System Use Notification',
    description:
      'a. Display [Assignment: organization-defined system use notification] to users before granting access to the system that provides privacy and security notices consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines and state that:\n1. Users are accessing a U.S. Government system;\n2. System usage may be monitored, recorded, and subject to audit;\n3. Unauthorized use of the system is prohibited and subject to criminal and civil penalties; and\n4. Use of the system indicates consent to monitoring and recording;\nb. Retain the notification message or banner on the screen until users acknowledge the usage conditions and take explicit actions to log on to or further access the system; and\nc. For publicly accessible systems:\n1. Display system use information [Assignment: organization-defined conditions], before granting further access to the publicly accessible system;\n2. Display references, if any, to monitoring, recording, or auditing that are consistent with privacy accommodations for such systems that generally prohibit those activities; and\n3. Include a description of the authorized uses of the system.',
  },
  'AC-10': {
    title: 'Concurrent Session Control',
    description:
      'Limit the number of concurrent sessions for each [Assignment: organization-defined account and/or account types] to [Assignment: organization-defined number].',
  },
  'AC-11': {
    title: 'Device Lock',
    description:
      'a. Prevent further access to the system by [Selection: one or more of: initiating a device lock after of inactivity; requiring the user to initiate a device lock before leaving the system unattended]; and\nb. Retain the device lock until the user reestablishes access using established identification and authentication procedures.',
  },
  'AC-11(1)': {
    title: 'Pattern-hiding Displays',
    description:
      'Conceal, via the device lock, information previously visible on the display with a publicly viewable image.',
  },
  'AC-12': {
    title: 'Session Termination',
    description:
      'Automatically terminate a user session after [Assignment: organization-defined conditions or trigger events].',
  },
  'AC-14': {
    title: 'Permitted Actions Without Identification or Authentication',
    description:
      'a. Identify [Assignment: organization-defined user actions] that can be performed on the system without identification or authentication consistent with organizational mission and business functions; and\nb. Document and provide supporting rationale in the security plan for the system, user actions not requiring identification or authentication.',
  },
  'AC-17': {
    title: 'Remote Access',
    description:
      'a. Establish and document usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed; and\nb. Authorize each type of remote access to the system prior to allowing such connections.',
  },
  'AC-17(1)': {
    title: 'Monitoring and Control',
    description:
      'Employ automated mechanisms to monitor and control remote access methods.',
  },
  'AC-17(2)': {
    title: 'Protection of Confidentiality and Integrity Using Encryption',
    description:
      'Implement cryptographic mechanisms to protect the confidentiality and integrity of remote access sessions.',
  },
  'AC-17(3)': {
    title: 'Managed Access Control Points',
    description:
      'Route remote accesses through authorized and managed network access control points.',
  },
  'AC-17(4)': {
    title: 'Privileged Commands and Access',
    description:
      '(a) Authorize the execution of privileged commands and access to security-relevant information via remote access only in a format that provides assessable evidence and for the following needs: [Assignment: organization-defined needs]; and\n(b) Document the rationale for remote access in the security plan for the system.',
  },
  'AC-18': {
    title: 'Wireless Access',
    description:
      'a. Establish configuration requirements, connection requirements, and implementation guidance for each type of wireless access; and\nb. Authorize each type of wireless access to the system prior to allowing such connections.',
  },
  'AC-18(1)': {
    title: 'Authentication and Encryption',
    description:
      'Protect wireless access to the system using authentication of [Selection: one or more of: users; devices] and encryption.',
  },
  'AC-18(3)': {
    title: 'Disable Wireless Networking',
    description:
      'Disable, when not intended for use, wireless networking capabilities embedded within system components prior to issuance and deployment.',
  },
  'AC-18(4)': {
    title: 'Restrict Configurations by Users',
    description:
      'Identify and explicitly authorize users allowed to independently configure wireless networking capabilities.',
  },
  'AC-18(5)': {
    title: 'Antennas and Transmission Power Levels',
    description:
      'Select radio antennas and calibrate transmission power levels to reduce the probability that signals from wireless access points can be received outside of organization-controlled boundaries.',
  },
  'AC-19': {
    title: 'Access Control for Mobile Devices',
    description:
      'a. Establish configuration requirements, connection requirements, and implementation guidance for organization-controlled mobile devices, to include when such devices are outside of controlled areas; and\nb. Authorize the connection of mobile devices to organizational systems.',
  },
  'AC-19(5)': {
    title: 'Full Device or Container-based Encryption',
    description:
      'Employ [Selection: one of: full-device encryption; container-based encryption] to protect the confidentiality and integrity of information on [Assignment: organization-defined mobile devices].',
  },
  'AC-20': {
    title: 'Use of External Systems',
    description:
      'a. [Selection: one or more of: establish; identify], consistent with the trust relationships established with other organizations owning, operating, and/or maintaining external systems, allowing authorized individuals to:\n1. Access the system from external systems; and\n2. Process, store, or transmit organization-controlled information using external systems; or\nb. Prohibit the use of [Assignment: organization-defined prohibited types of external systems].',
  },
  'AC-20(1)': {
    title: 'Limits on Authorized Use',
    description:
      'Permit authorized individuals to use an external system to access the system or to process, store, or transmit organization-controlled information only after:\n(a) Verification of the implementation of controls on the external system as specified in the organization’s security and privacy policies and security and privacy plans; or\n(b) Retention of approved system connection or processing agreements with the organizational entity hosting the external system.',
  },
  'AC-20(2)': {
    title: 'Portable Storage Devices — Restricted Use',
    description:
      'Restrict the use of organization-controlled portable storage devices by authorized individuals on external systems using [Assignment: organization-defined restrictions].',
  },
  'AC-21': {
    title: 'Information Sharing',
    description:
      'a. Enable authorized users to determine whether access authorizations assigned to a sharing partner match the information’s access and use restrictions for [Assignment: organization-defined information-sharing circumstances]; and\nb. Employ [Assignment: organization-defined automated mechanisms] to assist users in making information sharing and collaboration decisions.',
  },
  'AC-22': {
    title: 'Publicly Accessible Content',
    description:
      'a. Designate individuals authorized to make information publicly accessible;\nb. Train authorized individuals to ensure that publicly accessible information does not contain nonpublic information;\nc. Review the proposed content of information prior to posting onto the publicly accessible system to ensure that nonpublic information is not included; and\nd. Review the content on the publicly accessible system for nonpublic information [Assignment: organization-defined frequency] and remove such information, if discovered.',
  },
  'CA-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] assessment, authorization, and monitoring policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the assessment, authorization, and monitoring policy and the associated assessment, authorization, and monitoring controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the assessment, authorization, and monitoring policy and procedures; and\nc. Review and update the current assessment, authorization, and monitoring:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'CA-2': {
    title: 'Control Assessments',
    description:
      'a. Select the appropriate assessor or assessment team for the type of assessment to be conducted;\nb. Develop a control assessment plan that describes the scope of the assessment including:\n1. Controls and control enhancements under assessment;\n2. Assessment procedures to be used to determine control effectiveness; and\n3. Assessment environment, assessment team, and assessment roles and responsibilities;\nc. Ensure the control assessment plan is reviewed and approved by the authorizing official or designated representative prior to conducting the assessment;\nd. Assess the controls in the system and its environment of operation [Assignment: organization-defined assessment frequency] to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security and privacy requirements;\ne. Produce a control assessment report that document the results of the assessment; and\nf. Provide the results of the control assessment to [Assignment: organization-defined individuals or roles].',
  },
  'CA-2(1)': {
    title: 'Independent Assessors',
    description:
      'Employ independent assessors or assessment teams to conduct control assessments.',
  },
  'CA-2(2)': {
    title: 'Specialized Assessments',
    description:
      'Include as part of control assessments, [Assignment: organization-defined specialized assessment frequency], [Selection: one of: announced; unannounced], [Selection: one or more of: in-depth monitoring; security instrumentation; automated security test cases; vulnerability scanning; malicious user testing; insider threat assessment; performance and load testing; data leakage or data loss assessment].',
  },
  'CA-2(3)': {
    title: 'Leveraging Results from External Organizations',
    description:
      'Leverage the results of control assessments performed by [Assignment: organization-defined external organization(s)] on [Assignment: organization-defined system] when the assessment meets [Assignment: organization-defined requirements].',
  },
  'CA-3': {
    title: 'Information Exchange',
    description:
      'a. Approve and manage the exchange of information between the system and other systems using [Selection: one or more of: interconnection security agreements; information exchange security agreements; memoranda of understanding or agreement; service level agreements; user agreements; non-disclosure agreements];\nb. Document, as part of each exchange agreement, the interface characteristics, security and privacy requirements, controls, and responsibilities for each system, and the impact level of the information communicated; and\nc. Review and update the agreements [Assignment: organization-defined frequency].',
  },
  'CA-3(6)': {
    title: 'Transfer Authorizations',
    description:
      'Verify that individuals or systems transferring data between interconnecting systems have the requisite authorizations (i.e., write permissions or privileges) prior to accepting such data.',
  },
  'CA-6': {
    title: 'Authorization',
    description:
      'a. Assign a senior official as the authorizing official for the system;\nb. Assign a senior official as the authorizing official for common controls available for inheritance by organizational systems;\nc. Ensure that the authorizing official for the system, before commencing operations:\n1. Accepts the use of common controls inherited by the system; and\n2. Authorizes the system to operate;\nd. Ensure that the authorizing official for common controls authorizes the use of those controls for inheritance by organizational systems;\ne. Update the authorizations [Assignment: organization-defined frequency].',
  },
  'CA-7': {
    title: 'Continuous Monitoring',
    description:
      'Develop a system-level continuous monitoring strategy and implement continuous monitoring in accordance with the organization-level continuous monitoring strategy that includes:\na. Establishing the following system-level metrics to be monitored: [Assignment: organization-defined system-level metrics];\nb. Establishing [Assignment: organization-defined frequencies] for monitoring and [Assignment: organization-defined frequencies] for assessment of control effectiveness;\nc. Ongoing control assessments in accordance with the continuous monitoring strategy;\nd. Ongoing monitoring of system and organization-defined metrics in accordance with the continuous monitoring strategy;\ne. Correlation and analysis of information generated by control assessments and monitoring;\nf. Response actions to address results of the analysis of control assessment and monitoring information; and\ng. Reporting the security and privacy status of the system to [Assignment: organization-defined personnel or roles] [Assignment: organization-defined frequency].',
  },
  'CA-7(1)': {
    title: 'Independent Assessment',
    description:
      'Employ independent assessors or assessment teams to monitor the controls in the system on an ongoing basis.',
  },
  'CA-7(4)': {
    title: 'Risk Monitoring',
    description:
      'Ensure risk monitoring is an integral part of the continuous monitoring strategy that includes the following:\n(a) Effectiveness monitoring;\n(b) Compliance monitoring; and\n(c) Change monitoring.',
  },
  'CA-8': {
    title: 'Penetration Testing',
    description:
      'Conduct penetration testing [Assignment: organization-defined frequency] on [Assignment: organization-defined system(s) or system components].',
  },
  'CA-8(1)': {
    title: 'Independent Penetration Testing Agent or Team',
    description:
      'Employ an independent penetration testing agent or team to perform penetration testing on the system or system components.',
  },
  'CA-8(2)': {
    title: 'Red Team Exercises',
    description:
      'Employ the following red-team exercises to simulate attempts by adversaries to compromise organizational systems in accordance with applicable rules of engagement: [Assignment: organization-defined red team exercises].',
  },
  'CA-9': {
    title: 'Internal System Connections',
    description:
      'a. Authorize internal connections of [Assignment: organization-defined system components] to the system;\nb. Document, for each internal connection, the interface characteristics, security and privacy requirements, and the nature of the information communicated;\nc. Terminate internal system connections after [Assignment: organization-defined conditions]; and\nd. Review [Assignment: organization-defined frequency] the continued need for each internal connection.',
  },
  'AU-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] audit and accountability policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the audit and accountability policy and the associated audit and accountability controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the audit and accountability policy and procedures; and\nc. Review and update the current audit and accountability:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'AU-2': {
    title: 'Event Logging',
    description:
      'a. Identify the types of events that the system is capable of logging in support of the audit function: [Assignment: organization-defined event types];\nb. Coordinate the event logging function with other organizational entities requiring audit-related information to guide and inform the selection criteria for events to be logged;\nc. Specify the following event types for logging within the system: [Assignment: organization-defined event types (subset of the event types defined in AU-2a.) along with the frequency of (or situation requiring) logging for each identified event type];\nd. Provide a rationale for why the event types selected for logging are deemed to be adequate to support after-the-fact investigations of incidents; and\ne. Review and update the event types selected for logging [Assignment: organization-defined frequency].',
  },
  'AU-3': {
    title: 'Content of Audit Records',
    description:
      'Ensure that audit records contain information that establishes the following:\na. What type of event occurred;\nb. When the event occurred;\nc. Where the event occurred;\nd. Source of the event;\ne. Outcome of the event; and\nf. Identity of any individuals, subjects, or objects/entities associated with the event.',
  },
  'AU-3(1)': {
    title: 'Additional Audit Information',
    description:
      'Generate audit records containing the following additional information: [Assignment: organization-defined additional information].',
  },
  'AU-4': {
    title: 'Audit Log Storage Capacity',
    description:
      'Allocate audit log storage capacity to accommodate [Assignment: organization-defined audit log retention requirements].',
  },
  'AU-5': {
    title: 'Response to Audit Logging Process Failures',
    description:
      'a. Alert [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period] in the event of an audit logging process failure; and\nb. Take the following additional actions: [Assignment: organization-defined additional actions].',
  },
  'AU-5(1)': {
    title: 'Storage Capacity Warning',
    description:
      'Provide a warning to [Assignment: organization-defined personnel, roles, and/or locations] within [Assignment: organization-defined time period] when allocated audit log storage volume reaches [Assignment: organization-defined percentage] of repository maximum audit log storage capacity.',
  },
  'AU-5(2)': {
    title: 'Real-time Alerts',
    description:
      'Provide an alert within [Assignment: organization-defined real-time period] to [Assignment: organization-defined personnel, roles, and/or locations] when the following audit failure events occur: [Assignment: organization-defined audit logging failure events requiring real-time alerts].',
  },
  'AU-6': {
    title: 'Audit Record Review, Analysis, and Reporting',
    description:
      'a. Review and analyze system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity] and the potential impact of the inappropriate or unusual activity;\nb. Report findings to [Assignment: organization-defined personnel or roles]; and\nc. Adjust the level of audit record review, analysis, and reporting within the system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',
  },
  'AU-6(1)': {
    title: 'Automated Process Integration',
    description:
      'Integrate audit record review, analysis, and reporting processes using [Assignment: organization-defined automated mechanisms].',
  },
  'AU-6(3)': {
    title: 'Correlate Audit Record Repositories',
    description:
      'Analyze and correlate audit records across different repositories to gain organization-wide situational awareness.',
  },
  'AU-6(4)': {
    title: 'Central Review and Analysis',
    description:
      'Provide and implement the capability to centrally review and analyze audit records from multiple components within the system.',
  },
  'AU-6(5)': {
    title: 'Integrated Analysis of Audit Records',
    description:
      'Integrate analysis of audit records with analysis of [Selection: one or more of: vulnerability scanning information; performance data; system monitoring information] to further enhance the ability to identify inappropriate or unusual activity.',
  },
  'AU-6(6)': {
    title: 'Correlation with Physical Monitoring',
    description:
      'Correlate information from audit records with information obtained from monitoring physical access to further enhance the ability to identify suspicious, inappropriate, unusual, or malevolent activity.',
  },
  'AU-6(7)': {
    title: 'Permitted Actions',
    description:
      'Specify the permitted actions for each [Selection: one or more of: system process; role; user] associated with the review, analysis, and reporting of audit record information.',
  },
  'AU-7': {
    title: 'Audit Record Reduction and Report Generation',
    description:
      'Provide and implement an audit record reduction and report generation capability that:\na. Supports on-demand audit record review, analysis, and reporting requirements and after-the-fact investigations of incidents; and\nb. Does not alter the original content or time ordering of audit records.',
  },
  'AU-7(1)': {
    title: 'Automatic Processing',
    description:
      'Provide and implement the capability to process, sort, and search audit records for events of interest based on the following content: [Assignment: organization-defined fields within audit records].',
  },
  'AU-8': {
    title: 'Time Stamps',
    description:
      'a. Use internal system clocks to generate time stamps for audit records; and\nb. Record time stamps for audit records that meet [Assignment: organization-defined granularity of time measurement] and that use Coordinated Universal Time, have a fixed local time offset from Coordinated Universal Time, or that include the local time offset as part of the time stamp.',
  },
  'AU-9': {
    title: 'Protection of Audit Information',
    description:
      'a. Protect audit information and audit logging tools from unauthorized access, modification, and deletion; and\nb. Alert [Assignment: organization-defined personnel or roles] upon detection of unauthorized access, modification, or deletion of audit information.',
  },
  'AU-9(2)': {
    title: 'Store on Separate Physical Systems or Components',
    description:
      'Store audit records [Assignment: organization-defined frequency] in a repository that is part of a physically different system or system component than the system or component being audited.',
  },
  'AU-9(3)': {
    title: 'Cryptographic Protection',
    description:
      'Implement cryptographic mechanisms to protect the integrity of audit information and audit tools.',
  },
  'AU-9(4)': {
    title: 'Access by Subset of Privileged Users',
    description:
      'Authorize access to management of audit logging functionality to only [Assignment: organization-defined subset of privileged users or roles].',
  },
  'AU-10': {
    title: 'Non-repudiation',
    description:
      'Provide irrefutable evidence that an individual (or process acting on behalf of an individual) has performed [Assignment: organization-defined actions].',
  },
  'AU-11': {
    title: 'Audit Record Retention',
    description:
      'Retain audit records for [Assignment: organization-defined time period] to provide support for after-the-fact investigations of incidents and to meet regulatory and organizational information retention requirements.',
  },
  'AU-12': {
    title: 'Audit Record Generation',
    description:
      'a. Provide audit record generation capability for the event types the system is capable of auditing as defined in AU-2a on [Assignment: organization-defined system components];\nb. Allow [Assignment: organization-defined personnel or roles] to select the event types that are to be logged by specific components of the system; and\nc. Generate audit records for the event types defined in AU-2c that include the audit record content defined in AU-3.',
  },
  'AU-12(1)': {
    title: 'System-wide and Time-correlated Audit Trail',
    description:
      'Compile audit records from [Assignment: organization-defined system components] into a system-wide (logical or physical) audit trail that is time-correlated to within [Assignment: organization-defined level of tolerance].',
  },
  'AU-12(3)': {
    title: 'Changes by Authorized Individuals',
    description:
      'Provide and implement the capability for [Assignment: organization-defined individuals or roles] to change the logging to be performed on [Assignment: organization-defined system components] based on [Assignment: organization-defined selectable event criteria] within [Assignment: organization-defined time thresholds].',
  },
  'AT-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] awareness and training policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the awareness and training policy and the associated awareness and training controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the awareness and training policy and procedures; and\nc. Review and update the current awareness and training:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'AT-2': {
    title: 'Literacy Training and Awareness',
    description:
      'a. Provide security and privacy literacy training to system users (including managers, senior executives, and contractors):\n1. As part of initial training for new users and [Assignment: organization-defined frequency] thereafter; and\n2. When required by system changes or following [Assignment: organization-defined events];\nb. Employ the following techniques to increase the security and privacy awareness of system users [Assignment: organization-defined awareness techniques];\nc. Update literacy training and awareness content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\nd. Incorporate lessons learned from internal or external security incidents or breaches into literacy training and awareness techniques.',
  },
  'AT-2(2)': {
    title: 'Insider Threat',
    description:
      'Provide literacy training on recognizing and reporting potential indicators of insider threat.',
  },
  'AT-2(3)': {
    title: 'Social Engineering and Mining',
    description:
      'Provide literacy training on recognizing and reporting potential and actual instances of social engineering and social mining.',
  },
  'AT-3': {
    title: 'Role-based Training',
    description:
      'a. Provide role-based security and privacy training to personnel with the following roles and responsibilities: [Assignment: organization-defined roles and responsibilities]:\n1. Before authorizing access to the system, information, or performing assigned duties, and [Assignment: organization-defined frequency] thereafter; and\n2. When required by system changes;\nb. Update role-based training content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\nc. Incorporate lessons learned from internal or external security incidents or breaches into role-based training.',
  },
  'AT-4': {
    title: 'Training Records',
    description:
      'a. Document and monitor information security and privacy training activities, including security and privacy awareness training and specific role-based security and privacy training; and\nb. Retain individual training records for [Assignment: organization-defined time period].',
  },
  'CM-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] configuration management policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the configuration management policy and the associated configuration management controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the configuration management policy and procedures; and\nc. Review and update the current configuration management:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'CM-2': {
    title: 'Baseline Configuration',
    description:
      'a. Develop, document, and maintain under configuration control, a current baseline configuration of the system; and\nb. Review and update the baseline configuration of the system:\n1. [Assignment: organization-defined frequency];\n2. When required due to [Assignment: organization-defined circumstances]; and\n3. When system components are installed or upgraded.',
  },
  'CM-2(2)': {
    title: 'Automation Support for Accuracy and Currency',
    description:
      'Maintain the currency, completeness, accuracy, and availability of the baseline configuration of the system using [Assignment: organization-defined automated mechanisms].',
  },
  'CM-2(3)': {
    title: 'Retention of Previous Configurations',
    description:
      'Retain [Assignment: organization-defined number] of previous versions of baseline configurations of the system to support rollback.',
  },
  'CM-2(7)': {
    title: 'Configure Systems and Components for High-risk Areas',
    description:
      '(a) Issue [Assignment: organization-defined systems or system components] with [Assignment: organization-defined configurations] to individuals traveling to locations that the organization deems to be of significant risk; and\n(b) Apply the following controls to the systems or components when the individuals return from travel: [Assignment: organization-defined controls].',
  },
  'CM-3': {
    title: 'Configuration Change Control',
    description:
      'a. Determine and document the types of changes to the system that are configuration-controlled;\nb. Review proposed configuration-controlled changes to the system and approve or disapprove such changes with explicit consideration for security and privacy impact analyses;\nc. Document configuration change decisions associated with the system;\nd. Implement approved configuration-controlled changes to the system;\ne. Retain records of configuration-controlled changes to the system for [Assignment: organization-defined time period];\nf. Monitor and review activities associated with configuration-controlled changes to the system; and\ng. Coordinate and provide oversight for configuration change control activities through [Assignment: organization-defined configuration change control element] that convenes [Selection: one or more of: when].',
  },
  'CM-3(1)': {
    title: 'Automated Documentation, Notification, and Prohibition of Changes',
    description:
      'Use [Assignment: organization-defined automated mechanisms] to:\n(a) Document proposed changes to the system;\n(b) Notify [Assignment: organization-defined approval authorities] of proposed changes to the system and request change approval;\n(c) Highlight proposed changes to the system that have not been approved or disapproved within [Assignment: organization-defined time period];\n(d) Prohibit changes to the system until designated approvals are received;\n(e) Document all changes to the system; and\n(f) Notify [Assignment: organization-defined personnel] when approved changes to the system are completed.',
  },
  'CM-3(2)': {
    title: 'Testing, Validation, and Documentation of Changes',
    description:
      'Test, validate, and document changes to the system before finalizing the implementation of the changes.',
  },
  'CM-3(4)': {
    title: 'Security and Privacy Representatives',
    description:
      'Require [Assignment: organization-defined security and privacy representatives] to be members of the [Assignment: organization-defined configuration change control element].',
  },
  'CM-3(6)': {
    title: 'Cryptography Management',
    description:
      'Ensure that cryptographic mechanisms used to provide the following controls are under configuration management: [Assignment: organization-defined controls].',
  },
  'CM-4': {
    title: 'Impact Analyses',
    description:
      'Analyze changes to the system to determine potential security and privacy impacts prior to change implementation.',
  },
  'CM-4(1)': {
    title: 'Separate Test Environments',
    description:
      'Analyze changes to the system in a separate test environment before implementation in an operational environment, looking for security and privacy impacts due to flaws, weaknesses, incompatibility, or intentional malice.',
  },
  'CM-4(2)': {
    title: 'Verification of Controls',
    description:
      'After system changes, verify that the impacted controls are implemented correctly, operating as intended, and producing the desired outcome with regard to meeting the security and privacy requirements for the system.',
  },
  'CM-5': {
    title: 'Access Restrictions for Change',
    description:
      'Define, document, approve, and enforce physical and logical access restrictions associated with changes to the system.',
  },
  'CM-5(1)': {
    title: 'Automated Access Enforcement and Audit Records',
    description:
      '(a) Enforce access restrictions using [Assignment: organization-defined automated mechanisms]; and\n(b) Automatically generate audit records of the enforcement actions.',
  },
  'CM-5(5)': {
    title: 'Privilege Limitation for Production and Operation',
    description:
      '(a) Limit privileges to change system components and system-related information within a production or operational environment; and\n(b) Review and reevaluate privileges [Assignment: organization-defined frequency].',
  },
  'CM-6': {
    title: 'Configuration Settings',
    description:
      'a. Establish and document configuration settings for components employed within the system that reflect the most restrictive mode consistent with operational requirements using [Assignment: organization-defined common secure configurations];\nb. Implement the configuration settings;\nc. Identify, document, and approve any deviations from established configuration settings for [Assignment: organization-defined system components] based on [Assignment: organization-defined operational requirements]; and\nd. Monitor and control changes to the configuration settings in accordance with organizational policies and procedures.',
  },
  'CM-6(1)': {
    title: 'Automated Management, Application, and Verification',
    description:
      'Manage, apply, and verify configuration settings for [Assignment: organization-defined system components] using [Assignment: organization-defined automated mechanisms].',
  },
  'CM-6(2)': {
    title: 'Respond to Unauthorized Changes',
    description:
      'Take the following actions in response to unauthorized changes to [Assignment: organization-defined configuration settings]: [Assignment: organization-defined actions].',
  },
  'CM-7': {
    title: 'Least Functionality',
    description:
      'a. Configure the system to provide only [Assignment: organization-defined mission-essential capabilities]; and\nb. Prohibit or restrict the use of the following functions, ports, protocols, software, and/or services: [Assignment: organization-defined prohibited or restricted functions, system ports, protocols, software, and/or services].',
  },
  'CM-7(1)': {
    title: 'Periodic Review',
    description:
      '(a) Review the system [Assignment: organization-defined frequency] to identify unnecessary and/or nonsecure functions, ports, protocols, software, and services; and\n(b) Disable or remove [Assignment: organization-defined functions, ports, protocols, software, and services within the system deemed to be unnecessary and/or nonsecure].',
  },
  'CM-7(2)': {
    title: 'Prevent Program Execution',
    description:
      'Prevent program execution in accordance with [Selection: one or more of: rules authorizing the terms and conditions of software program usage].',
  },
  'CM-7(5)': {
    title: 'Authorized Software — Allow-by-exception',
    description:
      '(a) Identify [Assignment: organization-defined software programs];\n(b) Employ a deny-all, permit-by-exception policy to allow the execution of authorized software programs on the system; and\n(c) Review and update the list of authorized software programs [Assignment: organization-defined frequency].',
  },
  'CM-8': {
    title: 'System Component Inventory',
    description:
      'a. Develop and document an inventory of system components that:\n1. Accurately reflects the system;\n2. Includes all components within the system;\n3. Does not include duplicate accounting of components or components assigned to any other system;\n4. Is at the level of granularity deemed necessary for tracking and reporting; and\n5. Includes the following information to achieve system component accountability: [Assignment: organization-defined information]; and\nb. Review and update the system component inventory [Assignment: organization-defined frequency].',
  },
  'CM-8(1)': {
    title: 'Updates During Installation and Removal',
    description:
      'Update the inventory of system components as part of component installations, removals, and system updates.',
  },
  'CM-8(2)': {
    title: 'Automated Maintenance',
    description:
      'Maintain the currency, completeness, accuracy, and availability of the inventory of system components using [Assignment: organization-defined automated mechanisms].',
  },
  'CM-8(3)': {
    title: 'Automated Unauthorized Component Detection',
    description:
      '(a) Detect the presence of unauthorized hardware, software, and firmware components within the system using [Assignment: organization-defined automated mechanisms] [Assignment: organization-defined frequency]; and\n(b) Take the following actions when unauthorized components are detected: [Selection: one or more of: disable network access by unauthorized components; isolate unauthorized components; notify].',
  },
  'CM-8(4)': {
    title: 'Accountability Information',
    description:
      'Include in the system component inventory information, a means for identifying by [Selection: one or more of: name; position; role], individuals responsible and accountable for administering those components.',
  },
  'CM-9': {
    title: 'Configuration Management Plan',
    description:
      'Develop, document, and implement a configuration management plan for the system that:\na. Addresses roles, responsibilities, and configuration management processes and procedures;\nb. Establishes a process for identifying configuration items throughout the system development life cycle and for managing the configuration of the configuration items;\nc. Defines the configuration items for the system and places the configuration items under configuration management;\nd. Is reviewed and approved by [Assignment: organization-defined personnel or roles]; and\ne. Protects the configuration management plan from unauthorized disclosure and modification.',
  },
  'CM-10': {
    title: 'Software Usage Restrictions',
    description:
      'a. Use software and associated documentation in accordance with contract agreements and copyright laws;\nb. Track the use of software and associated documentation protected by quantity licenses to control copying and distribution; and\nc. Control and document the use of peer-to-peer file sharing technology to ensure that this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
  },
  'CM-11': {
    title: 'User-installed Software',
    description:
      'a. Establish [Assignment: organization-defined policies] governing the installation of software by users;\nb. Enforce software installation policies through the following methods: [Assignment: organization-defined methods]; and\nc. Monitor policy compliance [Assignment: organization-defined frequency].',
  },
  'CM-12': {
    title: 'Information Location',
    description:
      'a. Identify and document the location of [Assignment: organization-defined information] and the specific system components on which the information is processed and stored;\nb. Identify and document the users who have access to the system and system components where the information is processed and stored; and\nc. Document changes to the location (i.e., system or system components) where the information is processed and stored.',
  },
  'CM-12(1)': {
    title: 'Automated Tools to Support Information Location',
    description:
      'Use automated tools to identify [Assignment: organization-defined information by information type] on [Assignment: organization-defined system components] to ensure controls are in place to protect organizational information and individual privacy.',
  },
  'CM-14': {
    title: 'Signed Components',
    description:
      'Prevent the installation of [Assignment: organization-defined software and firmware components] without verification that the component has been digitally signed using a certificate that is recognized and approved by the organization.',
  },
  'CP-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] contingency planning policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the contingency planning policy and the associated contingency planning controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the contingency planning policy and procedures; and\nc. Review and update the current contingency planning:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'CP-2': {
    title: 'Contingency Plan',
    description:
      'a. Develop a contingency plan for the system that:\n1. Identifies essential mission and business functions and associated contingency requirements;\n2. Provides recovery objectives, restoration priorities, and metrics;\n3. Addresses contingency roles, responsibilities, assigned individuals with contact information;\n4. Addresses maintaining essential mission and business functions despite a system disruption, compromise, or failure;\n5. Addresses eventual, full system restoration without deterioration of the controls originally planned and implemented;\n6. Addresses the sharing of contingency information; and\n7. Is reviewed and approved by [Assignment: organization-defined personnel or roles];\nb. Distribute copies of the contingency plan to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements];\nc. Coordinate contingency planning activities with incident handling activities;\nd. Review the contingency plan for the system [Assignment: organization-defined frequency];\ne. Update the contingency plan to address changes to the organization, system, or environment of operation and problems encountered during contingency plan implementation, execution, or testing;\nf. Communicate contingency plan changes to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements];\ng. Incorporate lessons learned from contingency plan testing, training, or actual contingency activities into contingency testing and training; and\nh. Protect the contingency plan from unauthorized disclosure and modification.',
  },
  'CP-2(1)': {
    title: 'Coordinate with Related Plans',
    description:
      'Coordinate contingency plan development with organizational elements responsible for related plans.',
  },
  'CP-2(2)': {
    title: 'Capacity Planning',
    description:
      'Conduct capacity planning so that necessary capacity for information processing, telecommunications, and environmental support exists during contingency operations.',
  },
  'CP-2(3)': {
    title: 'Resume Mission and Business Functions',
    description:
      'Plan for the resumption of [Selection: one of: all; essential] mission and business functions within [Assignment: organization-defined time period] of contingency plan activation.',
  },
  'CP-2(5)': {
    title: 'Continue Mission and Business Functions',
    description:
      'Plan for the continuance of [Selection: one of: all; essential] mission and business functions with minimal or no loss of operational continuity and sustains that continuity until full system restoration at primary processing and/or storage sites.',
  },
  'CP-2(8)': {
    title: 'Identify Critical Assets',
    description:
      'Identify critical system assets supporting [Selection: one of: all; essential] mission and business functions.',
  },
  'CP-3': {
    title: 'Contingency Training',
    description:
      'a. Provide contingency training to system users consistent with assigned roles and responsibilities:\n1. Within [Assignment: organization-defined time period] of assuming a contingency role or responsibility;\n2. When required by system changes; and\n3. [Assignment: organization-defined frequency] thereafter; and\nb. Review and update contingency training content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'CP-3(1)': {
    title: 'Simulated Events',
    description:
      'Incorporate simulated events into contingency training to facilitate effective response by personnel in crisis situations.',
  },
  'CP-4': {
    title: 'Contingency Plan Testing',
    description:
      'a. Test the contingency plan for the system [Assignment: organization-defined frequency] using the following tests to determine the effectiveness of the plan and the readiness to execute the plan: [Assignment: organization-defined tests].\nb. Review the contingency plan test results; and\nc. Initiate corrective actions, if needed.',
  },
  'CP-4(1)': {
    title: 'Coordinate with Related Plans',
    description:
      'Coordinate contingency plan testing with organizational elements responsible for related plans.',
  },
  'CP-4(2)': {
    title: 'Alternate Processing Site',
    description:
      'Test the contingency plan at the alternate processing site:\n(a) To familiarize contingency personnel with the facility and available resources; and\n(b) To evaluate the capabilities of the alternate processing site to support contingency operations.',
  },
  'CP-6': {
    title: 'Alternate Storage Site',
    description:
      'a. Establish an alternate storage site, including necessary agreements to permit the storage and retrieval of system backup information; and\nb. Ensure that the alternate storage site provides controls equivalent to that of the primary site.',
  },
  'CP-6(1)': {
    title: 'Separation from Primary Site',
    description:
      'Identify an alternate storage site that is sufficiently separated from the primary storage site to reduce susceptibility to the same threats.',
  },
  'CP-6(2)': {
    title: 'Recovery Time and Recovery Point Objectives',
    description:
      'Configure the alternate storage site to facilitate recovery operations in accordance with recovery time and recovery point objectives.',
  },
  'CP-6(3)': {
    title: 'Accessibility',
    description:
      'Identify potential accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster and outline explicit mitigation actions.',
  },
  'CP-7': {
    title: 'Alternate Processing Site',
    description:
      'a. Establish an alternate processing site, including necessary agreements to permit the transfer and resumption of [Assignment: organization-defined system operations] for essential mission and business functions within [Assignment: organization-defined time period] when the primary processing capabilities are unavailable;\nb. Make available at the alternate processing site, the equipment and supplies required to transfer and resume operations or put contracts in place to support delivery to the site within the organization-defined time period for transfer and resumption; and\nc. Provide controls at the alternate processing site that are equivalent to those at the primary site.',
  },
  'CP-7(1)': {
    title: 'Separation from Primary Site',
    description:
      'Identify an alternate processing site that is sufficiently separated from the primary processing site to reduce susceptibility to the same threats.',
  },
  'CP-7(2)': {
    title: 'Accessibility',
    description:
      'Identify potential accessibility problems to alternate processing sites in the event of an area-wide disruption or disaster and outlines explicit mitigation actions.',
  },
  'CP-7(3)': {
    title: 'Priority of Service',
    description:
      'Develop alternate processing site agreements that contain priority-of-service provisions in accordance with availability requirements (including recovery time objectives).',
  },
  'CP-7(4)': {
    title: 'Preparation for Use',
    description:
      'Prepare the alternate processing site so that the site can serve as the operational site supporting essential mission and business functions.',
  },
  'CP-8': {
    title: 'Telecommunications Services',
    description:
      'Establish alternate telecommunications services, including necessary agreements to permit the resumption of [Assignment: organization-defined system operations] for essential mission and business functions within [Assignment: organization-defined time period] when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
  },
  'CP-8(1)': {
    title: 'Priority of Service Provisions',
    description:
      '(a) Develop primary and alternate telecommunications service agreements that contain priority-of-service provisions in accordance with availability requirements (including recovery time objectives); and\n(b) Request Telecommunications Service Priority for all telecommunications services used for national security emergency preparedness if the primary and/or alternate telecommunications services are provided by a common carrier.',
  },
  'CP-8(2)': {
    title: 'Single Points of Failure',
    description:
      'Obtain alternate telecommunications services to reduce the likelihood of sharing a single point of failure with primary telecommunications services.',
  },
  'CP-8(3)': {
    title: 'Separation of Primary and Alternate Providers',
    description:
      'Obtain alternate telecommunications services from providers that are separated from primary service providers to reduce susceptibility to the same threats.',
  },
  'CP-8(4)': {
    title: 'Provider Contingency Plan',
    description:
      '(a) Require primary and alternate telecommunications service providers to have contingency plans;\n(b) Review provider contingency plans to ensure that the plans meet organizational contingency requirements; and\n(c) Obtain evidence of contingency testing and training by providers [Assignment: organization-defined frequency].',
  },
  'CP-9': {
    title: 'System Backup',
    description:
      'a. Conduct backups of user-level information contained in [Assignment: organization-defined system components] [Assignment: organization-defined frequency];\nb. Conduct backups of system-level information contained in the system [Assignment: organization-defined frequency];\nc. Conduct backups of system documentation, including security- and privacy-related documentation [Assignment: organization-defined frequency]; and\nd. Protect the confidentiality, integrity, and availability of backup information.',
  },
  'CP-9(1)': {
    title: 'Testing for Reliability and Integrity',
    description:
      'Test backup information [Assignment: organization-defined frequency] to verify media reliability and information integrity.',
  },
  'CP-9(2)': {
    title: 'Test Restoration Using Sampling',
    description:
      'Use a sample of backup information in the restoration of selected system functions as part of contingency plan testing.',
  },
  'CP-9(3)': {
    title: 'Separate Storage for Critical Information',
    description:
      'Store backup copies of [Assignment: organization-defined critical system software and other security-related information] in a separate facility or in a fire rated container that is not collocated with the operational system.',
  },
  'CP-9(5)': {
    title: 'Transfer to Alternate Storage Site',
    description:
      'Transfer system backup information to the alternate storage site [Assignment: organization-defined time period and transfer rate consistent with the recovery time and recovery point objectives].',
  },
  'CP-9(8)': {
    title: 'Cryptographic Protection',
    description:
      'Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of [Assignment: organization-defined backup information].',
  },
  'CP-10': {
    title: 'System Recovery and Reconstitution',
    description:
      'Provide for the recovery and reconstitution of the system to a known state within [Assignment: organization-defined time period consistent with recovery time and recovery point objectives] after a disruption, compromise, or failure.',
  },
  'CP-10(2)': {
    title: 'Transaction Recovery',
    description:
      'Implement transaction recovery for systems that are transaction-based.',
  },
  'CP-10(4)': {
    title: 'Restore Within Time Period',
    description:
      'Provide the capability to restore system components within [Assignment: organization-defined restoration time periods] from configuration-controlled and integrity-protected information representing a known, operational state for the components.',
  },
  'IA-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] identification and authentication policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the identification and authentication policy and the associated identification and authentication controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the identification and authentication policy and procedures; and\nc. Review and update the current identification and authentication:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'IA-2': {
    title: 'Identification and Authentication (Organizational Users)',
    description:
      'Uniquely identify and authenticate organizational users and associate that unique identification with processes acting on behalf of those users.',
  },
  'IA-2(1)': {
    title: 'Multi-factor Authentication to Privileged Accounts',
    description:
      'Implement multi-factor authentication for access to privileged accounts.',
  },
  'IA-2(2)': {
    title: 'Multi-factor Authentication to Non-privileged Accounts',
    description:
      'Implement multi-factor authentication for access to non-privileged accounts.',
  },
  'IA-2(5)': {
    title: 'Individual Authentication with Group Authentication',
    description:
      'When shared accounts or authenticators are employed, require users to be individually authenticated before granting access to the shared accounts or resources.',
  },
  'IA-2(6)': {
    title: 'Access to Accounts —separate Device',
    description:
      'Implement multi-factor authentication for [Selection: one or more of: local; network; remote] access to [Selection: one or more of: privileged accounts; non-privileged accounts] such that:\n(a) One of the factors is provided by a device separate from the system gaining access; and\n(b) The device meets [Assignment: organization-defined strength of mechanism requirements].',
  },
  'IA-2(8)': {
    title: 'Access to Accounts — Replay Resistant',
    description:
      'Implement replay-resistant authentication mechanisms for access to [Selection: one or more of: privileged accounts; non-privileged accounts].',
  },
  'IA-2(12)': {
    title: 'Acceptance of PIV Credentials',
    description:
      'Accept and electronically verify Personal Identity Verification-compliant credentials.',
  },
  'IA-3': {
    title: 'Device Identification and Authentication',
    description:
      'Uniquely identify and authenticate [Assignment: organization-defined devices and/or types of devices] before establishing a [Selection: one or more of: local; remote; network] connection.',
  },
  'IA-4': {
    title: 'Identifier Management',
    description:
      'Manage system identifiers by:\na. Receiving authorization from [Assignment: organization-defined personnel or roles] to assign an individual, group, role, service, or device identifier;\nb. Selecting an identifier that identifies an individual, group, role, service, or device;\nc. Assigning the identifier to the intended individual, group, role, service, or device; and\nd. Preventing reuse of identifiers for [Assignment: organization-defined time period].',
  },
  'IA-4(4)': {
    title: 'Identify User Status',
    description:
      'Manage individual identifiers by uniquely identifying each individual as [Assignment: organization-defined characteristics].',
  },
  'IA-5': {
    title: 'Authenticator Management',
    description:
      'Manage system authenticators by:\na. Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, service, or device receiving the authenticator;\nb. Establishing initial authenticator content for any authenticators issued by the organization;\nc. Ensuring that authenticators have sufficient strength of mechanism for their intended use;\nd. Establishing and implementing administrative procedures for initial authenticator distribution, for lost or compromised or damaged authenticators, and for revoking authenticators;\ne. Changing default authenticators prior to first use;\nf. Changing or refreshing authenticators [Assignment: organization-defined time period by authenticator type] or when [Assignment: organization-defined events] occur;\ng. Protecting authenticator content from unauthorized disclosure and modification;\nh. Requiring individuals to take, and having devices implement, specific controls to protect authenticators; and\ni. Changing authenticators for group or role accounts when membership to those accounts changes.',
  },
  'IA-5(1)': {
    title: 'Password-based Authentication',
    description:
      'For password-based authentication:\n(a) Maintain a list of commonly-used, expected, or compromised passwords and update the list [Assignment: organization-defined frequency] and when organizational passwords are suspected to have been compromised directly or indirectly;\n(b) Verify, when users create or update passwords, that the passwords are not found on the list of commonly-used, expected, or compromised passwords in IA-5(1)(a);\n(c) Transmit passwords only over cryptographically-protected channels;\n(d) Store passwords using an approved salted key derivation function, preferably using a keyed hash;\n(e) Require immediate selection of a new password upon account recovery;\n(f) Allow user selection of long passwords and passphrases, including spaces and all printable characters;\n(g) Employ automated tools to assist the user in selecting strong password authenticators; and\n(h) Enforce the following composition and complexity rules: [Assignment: organization-defined composition and complexity rules].',
  },
  'IA-5(2)': {
    title: 'Public Key-based Authentication',
    description:
      '(a) For public key-based authentication:\n(1) Enforce authorized access to the corresponding private key; and\n(2) Map the authenticated identity to the account of the individual or group; and\n(b) When public key infrastructure (PKI) is used:\n(1) Validate certificates by constructing and verifying a certification path to an accepted trust anchor, including checking certificate status information; and\n(2) Implement a local cache of revocation data to support path discovery and validation.',
  },
  'IA-5(6)': {
    title: 'Protection of Authenticators',
    description:
      'Protect authenticators commensurate with the security category of the information to which use of the authenticator permits access.',
  },
  'IA-5(7)': {
    title: 'No Embedded Unencrypted Static Authenticators',
    description:
      'Ensure that unencrypted static authenticators are not embedded in applications or other forms of static storage.',
  },
  'IA-5(8)': {
    title: 'Multiple System Accounts',
    description:
      'Implement [Assignment: organization-defined security controls] to manage the risk of compromise due to individuals having accounts on multiple systems.',
  },
  'IA-5(13)': {
    title: 'Expiration of Cached Authenticators',
    description:
      'Prohibit the use of cached authenticators after [Assignment: organization-defined time period].',
  },
  'IA-6': {
    title: 'Authentication Feedback',
    description:
      'Obscure feedback of authentication information during the authentication process to protect the information from possible exploitation and use by unauthorized individuals.',
  },
  'IA-7': {
    title: 'Cryptographic Module Authentication',
    description:
      'Implement mechanisms for authentication to a cryptographic module that meet the requirements of applicable laws, executive orders, directives, policies, regulations, standards, and guidelines for such authentication.',
  },
  'IA-8': {
    title: 'Identification and Authentication (Non-organizational Users)',
    description:
      'Uniquely identify and authenticate non-organizational users or processes acting on behalf of non-organizational users.',
  },
  'IA-8(1)': {
    title: 'Acceptance of PIV Credentials from Other Agencies',
    description:
      'Accept and electronically verify Personal Identity Verification-compliant credentials from other federal agencies.',
  },
  'IA-8(2)': {
    title: 'Acceptance of External Authenticators',
    description:
      '(a) Accept only external authenticators that are NIST-compliant; and\n(b) Document and maintain a list of accepted external authenticators.',
  },
  'IA-8(4)': {
    title: 'Use of Defined Profiles',
    description:
      'Conform to the following profiles for identity management [Assignment: organization-defined identity management profiles].',
  },
  'IA-11': {
    title: 'Re-authentication',
    description:
      'Require users to re-authenticate when [Assignment: organization-defined circumstances or situations].',
  },
  'IA-12': {
    title: 'Identity Proofing',
    description:
      'a. Identity proof users that require accounts for logical access to systems based on appropriate identity assurance level requirements as specified in applicable standards and guidelines;\nb. Resolve user identities to a unique individual; and\nc. Collect, validate, and verify identity evidence.',
  },
  'IA-12(2)': {
    title: 'Identity Evidence',
    description:
      'Require evidence of individual identification be presented to the registration authority.',
  },
  'IA-12(3)': {
    title: 'Identity Evidence Validation and Verification',
    description:
      'Require that the presented identity evidence be validated and verified through [Assignment: organization-defined methods of validation and verification].',
  },
  'IA-12(4)': {
    title: 'In-person Validation and Verification',
    description:
      'Require that the validation and verification of identity evidence be conducted in person before a designated registration authority.',
  },
  'IA-12(5)': {
    title: 'Address Confirmation',
    description:
      'Require that a [Selection: one of: registration code; notice of proofing] be delivered through an out-of-band channel to verify the users address (physical or digital) of record.',
  },
  'IR-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] incident response policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the incident response policy and the associated incident response controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the incident response policy and procedures; and\nc. Review and update the current incident response:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'IR-2': {
    title: 'Incident Response Training',
    description:
      'a. Provide incident response training to system users consistent with assigned roles and responsibilities:\n1. Within [Assignment: organization-defined time period] of assuming an incident response role or responsibility or acquiring system access;\n2. When required by system changes; and\n3. [Assignment: organization-defined frequency] thereafter; and\nb. Review and update incident response training content [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'IR-2(1)': {
    title: 'Simulated Events',
    description:
      'Incorporate simulated events into incident response training to facilitate the required response by personnel in crisis situations.',
  },
  'IR-2(2)': {
    title: 'Automated Training Environments',
    description:
      'Provide an incident response training environment using [Assignment: organization-defined automated mechanisms].',
  },
  'IR-3': {
    title: 'Incident Response Testing',
    description:
      'Test the effectiveness of the incident response capability for the system [Assignment: organization-defined frequency] using the following tests: [Assignment: organization-defined tests].',
  },
  'IR-3(2)': {
    title: 'Coordination with Related Plans',
    description:
      'Coordinate incident response testing with organizational elements responsible for related plans.',
  },
  'IR-4': {
    title: 'Incident Handling',
    description:
      'a. Implement an incident handling capability for incidents that is consistent with the incident response plan and includes preparation, detection and analysis, containment, eradication, and recovery;\nb. Coordinate incident handling activities with contingency planning activities;\nc. Incorporate lessons learned from ongoing incident handling activities into incident response procedures, training, and testing, and implement the resulting changes accordingly; and\nd. Ensure the rigor, intensity, scope, and results of incident handling activities are comparable and predictable across the organization.',
  },
  'IR-4(1)': {
    title: 'Automated Incident Handling Processes',
    description:
      'Support the incident handling process using [Assignment: organization-defined automated mechanisms].',
  },
  'IR-4(2)': {
    title: 'Dynamic Reconfiguration',
    description:
      'Include the following types of dynamic reconfiguration for [Assignment: organization-defined system components] as part of the incident response capability: [Assignment: organization-defined types of dynamic reconfiguration].',
  },
  'IR-4(4)': {
    title: 'Information Correlation',
    description:
      'Correlate incident information and individual incident responses to achieve an organization-wide perspective on incident awareness and response.',
  },
  'IR-4(6)': {
    title: 'Insider Threats',
    description:
      'Implement an incident handling capability for incidents involving insider threats.',
  },
  'IR-4(11)': {
    title: 'Integrated Incident Response Team',
    description:
      'Establish and maintain an integrated incident response team that can be deployed to any location identified by the organization in [Assignment: organization-defined time period].',
  },
  'IR-5': {
    title: 'Incident Monitoring',
    description: 'Track and document incidents.',
  },
  'IR-5(1)': {
    title: 'Automated Tracking, Data Collection, and Analysis',
    description:
      'Track incidents and collect and analyze incident information using [Assignment: organization-defined automated mechanisms].',
  },
  'IR-6': {
    title: 'Incident Reporting',
    description:
      'a. Require personnel to report suspected incidents to the organizational incident response capability within [Assignment: organization-defined time period]; and\nb. Report incident information to [Assignment: organization-defined authorities].',
  },
  'IR-6(1)': {
    title: 'Automated Reporting',
    description:
      'Report incidents using [Assignment: organization-defined automated mechanisms].',
  },
  'IR-6(3)': {
    title: 'Supply Chain Coordination',
    description:
      'Provide incident information to the provider of the product or service and other organizations involved in the supply chain or supply chain governance for systems or system components related to the incident.',
  },
  'IR-7': {
    title: 'Incident Response Assistance',
    description:
      'Provide an incident response support resource, integral to the organizational incident response capability, that offers advice and assistance to users of the system for the handling and reporting of incidents.',
  },
  'IR-7(1)': {
    title: 'Automation Support for Availability of Information and Support',
    description:
      'Increase the availability of incident response information and support using [Assignment: organization-defined automated mechanisms].',
  },
  'IR-8': {
    title: 'Incident Response Plan',
    description:
      'a. Develop an incident response plan that:\n1. Provides the organization with a roadmap for implementing its incident response capability;\n2. Describes the structure and organization of the incident response capability;\n3. Provides a high-level approach for how the incident response capability fits into the overall organization;\n4. Meets the unique requirements of the organization, which relate to mission, size, structure, and functions;\n5. Defines reportable incidents;\n6. Provides metrics for measuring the incident response capability within the organization;\n7. Defines the resources and management support needed to effectively maintain and mature an incident response capability;\n8. Addresses the sharing of incident information;\n9. Is reviewed and approved by [Assignment: organization-defined personnel or roles] [Assignment: organization-defined frequency]; and\n10. Explicitly designates responsibility for incident response to [Assignment: organization-defined entities, personnel, or roles].\nb. Distribute copies of the incident response plan to [Assignment: organization-defined incident response personnel];\nc. Update the incident response plan to address system and organizational changes or problems encountered during plan implementation, execution, or testing;\nd. Communicate incident response plan changes to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements]; and\ne. Protect the incident response plan from unauthorized disclosure and modification.',
  },
  'IR-9': {
    title: 'Information Spillage Response',
    description:
      'Respond to information spills by:\na. Assigning [Assignment: organization-defined personnel or roles] with responsibility for responding to information spills;\nb. Identifying the specific information involved in the system contamination;\nc. Alerting [Assignment: organization-defined personnel or roles] of the information spill using a method of communication not associated with the spill;\nd. Isolating the contaminated system or system component;\ne. Eradicating the information from the contaminated system or component;\nf. Identifying other systems or system components that may have been subsequently contaminated; and\ng. Performing the following additional actions: [Assignment: organization-defined actions].',
  },
  'IR-9(2)': {
    title: 'Training',
    description:
      'Provide information spillage response training [Assignment: organization-defined frequency].',
  },
  'IR-9(3)': {
    title: 'Post-spill Operations',
    description:
      'Implement the following procedures to ensure that organizational personnel impacted by information spills can continue to carry out assigned tasks while contaminated systems are undergoing corrective actions: [Assignment: organization-defined procedures].',
  },
  'IR-9(4)': {
    title: 'Exposure to Unauthorized Personnel',
    description:
      'Employ the following controls for personnel exposed to information not within assigned access authorizations: [Assignment: organization-defined controls].',
  },
  'MA-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] maintenance policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the maintenance policy and the associated maintenance controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the maintenance policy and procedures; and\nc. Review and update the current maintenance:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'MA-2': {
    title: 'Controlled Maintenance',
    description:
      'a. Schedule, document, and review records of maintenance, repair, and replacement on system components in accordance with manufacturer or vendor specifications and/or organizational requirements;\nb. Approve and monitor all maintenance activities, whether performed on site or remotely and whether the system or system components are serviced on site or removed to another location;\nc. Require that [Assignment: organization-defined personnel or roles] explicitly approve the removal of the system or system components from organizational facilities for off-site maintenance, repair, or replacement;\nd. Sanitize equipment to remove the following information from associated media prior to removal from organizational facilities for off-site maintenance, repair, or replacement: [Assignment: organization-defined information];\ne. Check all potentially impacted controls to verify that the controls are still functioning properly following maintenance, repair, or replacement actions; and\nf. Include the following information in organizational maintenance records: [Assignment: organization-defined information].',
  },
  'MA-2(2)': {
    title: 'Automated Maintenance Activities',
    description:
      '(a) Schedule, conduct, and document maintenance, repair, and replacement actions for the system using [Assignment: organization-defined automated mechanisms]; and\n(b) Produce up-to date, accurate, and complete records of all maintenance, repair, and replacement actions requested, scheduled, in process, and completed.',
  },
  'MA-3': {
    title: 'Maintenance Tools',
    description:
      'a. Approve, control, and monitor the use of system maintenance tools; and\nb. Review previously approved system maintenance tools [Assignment: organization-defined frequency].',
  },
  'MA-3(1)': {
    title: 'Inspect Tools',
    description:
      'Inspect the maintenance tools used by maintenance personnel for improper or unauthorized modifications.',
  },
  'MA-3(2)': {
    title: 'Inspect Media',
    description:
      'Check media containing diagnostic and test programs for malicious code before the media are used in the system.',
  },
  'MA-3(3)': {
    title: 'Prevent Unauthorized Removal',
    description:
      'Prevent the removal of maintenance equipment containing organizational information by:\n(a) Verifying that there is no organizational information contained on the equipment;\n(b) Sanitizing or destroying the equipment;\n(c) Retaining the equipment within the facility; or\n(d) Obtaining an exemption from [Assignment: organization-defined personnel or roles] explicitly authorizing removal of the equipment from the facility.',
  },
  'MA-4': {
    title: 'Nonlocal Maintenance',
    description:
      'a. Approve and monitor nonlocal maintenance and diagnostic activities;\nb. Allow the use of nonlocal maintenance and diagnostic tools only as consistent with organizational policy and documented in the security plan for the system;\nc. Employ strong authentication in the establishment of nonlocal maintenance and diagnostic sessions;\nd. Maintain records for nonlocal maintenance and diagnostic activities; and\ne. Terminate session and network connections when nonlocal maintenance is completed.',
  },
  'MA-4(3)': {
    title: 'Comparable Security and Sanitization',
    description:
      '(a) Require that nonlocal maintenance and diagnostic services be performed from a system that implements a security capability comparable to the capability implemented on the system being serviced; or\n(b) Remove the component to be serviced from the system prior to nonlocal maintenance or diagnostic services; sanitize the component (for organizational information); and after the service is performed, inspect and sanitize the component (for potentially malicious software) before reconnecting the component to the system.',
  },
  'MA-5': {
    title: 'Maintenance Personnel',
    description:
      'a. Establish a process for maintenance personnel authorization and maintain a list of authorized maintenance organizations or personnel;\nb. Verify that non-escorted personnel performing maintenance on the system possess the required access authorizations; and\nc. Designate organizational personnel with required access authorizations and technical competence to supervise the maintenance activities of personnel who do not possess the required access authorizations.',
  },
  'MA-5(1)': {
    title: 'Individuals Without Appropriate Access',
    description:
      '(a) Implement procedures for the use of maintenance personnel that lack appropriate security clearances or are not U.S. citizens, that include the following requirements:\n(1) Maintenance personnel who do not have needed access authorizations, clearances, or formal access approvals are escorted and supervised during the performance of maintenance and diagnostic activities on the system by approved organizational personnel who are fully cleared, have appropriate access authorizations, and are technically qualified; and\n(2) Prior to initiating maintenance or diagnostic activities by personnel who do not have needed access authorizations, clearances or formal access approvals, all volatile information storage components within the system are sanitized and all nonvolatile storage media are removed or physically disconnected from the system and secured; and\n(b) Develop and implement [Assignment: organization-defined alternate controls] in the event a system component cannot be sanitized, removed, or disconnected from the system.',
  },
  'MA-6': {
    title: 'Timely Maintenance',
    description:
      'Obtain maintenance support and/or spare parts for [Assignment: organization-defined system components] within [Assignment: organization-defined time period] of failure.',
  },
  'MP-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] media protection policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the media protection policy and the associated media protection controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the media protection policy and procedures; and\nc. Review and update the current media protection:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'MP-2': {
    title: 'Media Access',
    description:
      'Restrict access to [Assignment: organization-defined types of digital and/or non-digital media] to [Assignment: organization-defined personnel or roles].',
  },
  'MP-3': {
    title: 'Media Marking',
    description:
      'a. Mark system media indicating the distribution limitations, handling caveats, and applicable security markings (if any) of the information; and\nb. Exempt [Assignment: organization-defined types of media exempted from marking] from marking if the media remain within [Assignment: organization-defined controlled areas].',
  },
  'MP-4': {
    title: 'Media Storage',
    description:
      'a. Physically control and securely store [Assignment: organization-defined types of digital and/or non-digital media] within [Assignment: organization-defined controlled areas]; and\nb. Protect system media types defined in MP-4a until the media are destroyed or sanitized using approved equipment, techniques, and procedures.',
  },
  'MP-5': {
    title: 'Media Transport',
    description:
      'a. Protect and control [Assignment: organization-defined types of system media] during transport outside of controlled areas using [Assignment: organization-defined controls];\nb. Maintain accountability for system media during transport outside of controlled areas;\nc. Document activities associated with the transport of system media; and\nd. Restrict the activities associated with the transport of system media to authorized personnel.',
  },
  'MP-6': {
    title: 'Media Sanitization',
    description:
      'a. Sanitize [Assignment: organization-defined system media] prior to disposal, release out of organizational control, or release for reuse using [Assignment: organization-defined sanitization techniques and procedures]; and\nb. Employ sanitization mechanisms with the strength and integrity commensurate with the security category or classification of the information.',
  },
  'MP-6(1)': {
    title: 'Review, Approve, Track, Document, and Verify',
    description:
      'Review, approve, track, document, and verify media sanitization and disposal actions.',
  },
  'MP-6(2)': {
    title: 'Equipment Testing',
    description:
      'Test sanitization equipment and procedures [Assignment: organization-defined frequency] to ensure that the intended sanitization is being achieved.',
  },
  'MP-6(3)': {
    title: 'Nondestructive Techniques',
    description:
      'Apply nondestructive sanitization techniques to portable storage devices prior to connecting such devices to the system under the following circumstances: [Assignment: organization-defined circumstances].',
  },
  'MP-7': {
    title: 'Media Use',
    description:
      'a. [Selection: one of: restrict; prohibit] the use of [Assignment: organization-defined types of system media] on [Assignment: organization-defined systems or system components] using [Assignment: organization-defined controls]; and\nb. Prohibit the use of portable storage devices in organizational systems when such devices have no identifiable owner.',
  },
  'PS-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] personnel security policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the personnel security policy and the associated personnel security controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the personnel security policy and procedures; and\nc. Review and update the current personnel security:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'PS-2': {
    title: 'Position Risk Designation',
    description:
      'a. Assign a risk designation to all organizational positions;\nb. Establish screening criteria for individuals filling those positions; and\nc. Review and update position risk designations [Assignment: organization-defined frequency].',
  },
  'PS-3': {
    title: 'Personnel Screening',
    description:
      'a. Screen individuals prior to authorizing access to the system; and\nb. Rescreen individuals in accordance with [Assignment: organization-defined conditions requiring rescreening and, where rescreening is so indicated, the frequency of rescreening].',
  },
  'PS-3(3)': {
    title: 'Information Requiring Special Protective Measures',
    description:
      'Verify that individuals accessing a system processing, storing, or transmitting information requiring special protection:\n(a) Have valid access authorizations that are demonstrated by assigned official government duties; and\n(b) Satisfy [Assignment: organization-defined additional personnel screening criteria].',
  },
  'PS-4': {
    title: 'Personnel Termination',
    description:
      'Upon termination of individual employment:\na. Disable system access within [Assignment: organization-defined time period];\nb. Terminate or revoke any authenticators and credentials associated with the individual;\nc. Conduct exit interviews that include a discussion of [Assignment: organization-defined information security topics];\nd. Retrieve all security-related organizational system-related property; and\ne. Retain access to organizational information and systems formerly controlled by terminated individual.',
  },
  'PS-4(2)': {
    title: 'Automated Actions',
    description:
      'Use [Assignment: organization-defined automated mechanisms] to [Selection: one or more of: notify of individual termination actions; disable access to system resources].',
  },
  'PS-5': {
    title: 'Personnel Transfer',
    description:
      'a. Review and confirm ongoing operational need for current logical and physical access authorizations to systems and facilities when individuals are reassigned or transferred to other positions within the organization;\nb. Initiate [Assignment: organization-defined transfer or reassignment actions] within [Assignment: organization-defined time period following the formal transfer action];\nc. Modify access authorization as needed to correspond with any changes in operational need due to reassignment or transfer; and\nd. Notify [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',
  },
  'PS-6': {
    title: 'Access Agreements',
    description:
      'a. Develop and document access agreements for organizational systems;\nb. Review and update the access agreements [Assignment: organization-defined frequency]; and\nc. Verify that individuals requiring access to organizational information and systems:\n1. Sign appropriate access agreements prior to being granted access; and\n2. Re-sign access agreements to maintain access to organizational systems when access agreements have been updated or [Assignment: organization-defined frequency].',
  },
  'PS-7': {
    title: 'External Personnel Security',
    description:
      'a. Establish personnel security requirements, including security roles and responsibilities for external providers;\nb. Require external providers to comply with personnel security policies and procedures established by the organization;\nc. Document personnel security requirements;\nd. Require external providers to notify [Assignment: organization-defined personnel or roles] of any personnel transfers or terminations of external personnel who possess organizational credentials and/or badges, or who have system privileges within [Assignment: organization-defined time period]; and\ne. Monitor provider compliance with personnel security requirements.',
  },
  'PS-8': {
    title: 'Personnel Sanctions',
    description:
      'a. Employ a formal sanctions process for individuals failing to comply with established information security and privacy policies and procedures; and\nb. Notify [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period] when a formal employee sanctions process is initiated, identifying the individual sanctioned and the reason for the sanction.',
  },
  'PS-9': {
    title: 'Position Descriptions',
    description:
      'Incorporate security and privacy roles and responsibilities into organizational position descriptions.',
  },
  'PE-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] physical and environmental protection policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the physical and environmental protection policy and the associated physical and environmental protection controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the physical and environmental protection policy and procedures; and\nc. Review and update the current physical and environmental protection:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'PE-2': {
    title: 'Physical Access Authorizations',
    description:
      'a. Develop, approve, and maintain a list of individuals with authorized access to the facility where the system resides;\nb. Issue authorization credentials for facility access;\nc. Review the access list detailing authorized facility access by individuals [Assignment: organization-defined frequency]; and\nd. Remove individuals from the facility access list when access is no longer required.',
  },
  'PE-3': {
    title: 'Physical Access Control',
    description:
      'a. Enforce physical access authorizations at [Assignment: organization-defined entry and exit points] by:\n1. Verifying individual access authorizations before granting access to the facility; and\n2. Controlling ingress and egress to the facility using [Selection: one or more of: guards];\nb. Maintain physical access audit logs for [Assignment: organization-defined entry or exit points];\nc. Control access to areas within the facility designated as publicly accessible by implementing the following controls: [Assignment: organization-defined physical access controls];\nd. Escort visitors and control visitor activity [Assignment: organization-defined circumstances];\ne. Secure keys, combinations, and other physical access devices;\nf. Inventory [Assignment: organization-defined physical access devices] every [Assignment: organization-defined frequency]; and\ng. Change combinations and keys [Assignment: organization-defined frequency] and/or when keys are lost, combinations are compromised, or when individuals possessing the keys or combinations are transferred or terminated.',
  },
  'PE-3(1)': {
    title: 'System Access',
    description:
      'Enforce physical access authorizations to the system in addition to the physical access controls for the facility at [Assignment: organization-defined physical spaces].',
  },
  'PE-4': {
    title: 'Access Control for Transmission',
    description:
      'Control physical access to [Assignment: organization-defined system distribution and transmission lines] within organizational facilities using [Assignment: organization-defined security controls].',
  },
  'PE-5': {
    title: 'Access Control for Output Devices',
    description:
      'Control physical access to output from [Assignment: organization-defined output devices] to prevent unauthorized individuals from obtaining the output.',
  },
  'PE-6': {
    title: 'Monitoring Physical Access',
    description:
      'a. Monitor physical access to the facility where the system resides to detect and respond to physical security incidents;\nb. Review physical access logs [Assignment: organization-defined frequency] and upon occurrence of [Assignment: organization-defined events]; and\nc. Coordinate results of reviews and investigations with the organizational incident response capability.',
  },
  'PE-6(1)': {
    title: 'Intrusion Alarms and Surveillance Equipment',
    description:
      'Monitor physical access to the facility where the system resides using physical intrusion alarms and surveillance equipment.',
  },
  'PE-6(4)': {
    title: 'Monitoring Physical Access to Systems',
    description:
      'Monitor physical access to the system in addition to the physical access monitoring of the facility at [Assignment: organization-defined physical spaces].',
  },
  'PE-8': {
    title: 'Visitor Access Records',
    description:
      'a. Maintain visitor access records to the facility where the system resides for [Assignment: organization-defined time period];\nb. Review visitor access records [Assignment: organization-defined frequency]; and\nc. Report anomalies in visitor access records to [Assignment: organization-defined personnel].',
  },
  'PE-8(1)': {
    title: 'Automated Records Maintenance and Review',
    description:
      'Maintain and review visitor access records using [Assignment: organization-defined automated mechanisms].',
  },
  'PE-9': {
    title: 'Power Equipment and Cabling',
    description:
      'Protect power equipment and power cabling for the system from damage and destruction.',
  },
  'PE-10': {
    title: 'Emergency Shutoff',
    description:
      'a. Provide the capability of shutting off power to [Assignment: organization-defined system or individual system components] in emergency situations;\nb. Place emergency shutoff switches or devices in [Assignment: organization-defined location] to facilitate access for authorized personnel; and\nc. Protect emergency power shutoff capability from unauthorized activation.',
  },
  'PE-11': {
    title: 'Emergency Power',
    description:
      'Provide an uninterruptible power supply to facilitate [Selection: one of: an orderly shutdown of the system; transition of the system to long-term alternate power] in the event of a primary power source loss.',
  },
  'PE-11(1)': {
    title: 'Alternate Power Supply — Minimal Operational Capability',
    description:
      'Provide an alternate power supply for the system that is activated [Selection: one of: manually; automatically] and that can maintain minimally required operational capability in the event of an extended loss of the primary power source.',
  },
  'PE-12': {
    title: 'Emergency Lighting',
    description:
      'Employ and maintain automatic emergency lighting for the system that activates in the event of a power outage or disruption and that covers emergency exits and evacuation routes within the facility.',
  },
  'PE-13': {
    title: 'Fire Protection',
    description:
      'Employ and maintain fire detection and suppression systems that are supported by an independent energy source.',
  },
  'PE-13(1)': {
    title: 'Detection Systems — Automatic Activation and Notification',
    description:
      'Employ fire detection systems that activate automatically and notify [Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders] in the event of a fire.',
  },
  'PE-13(2)': {
    title: 'Suppression Systems — Automatic Activation and Notification',
    description:
      '(a) Employ fire suppression systems that activate automatically and notify [Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders]; and\n(b) Employ an automatic fire suppression capability when the facility is not staffed on a continuous basis.',
  },
  'PE-14': {
    title: 'Environmental Controls',
    description:
      'a. Maintain [Selection: one or more of: temperature; humidity; pressure; radiation] levels within the facility where the system resides at [Assignment: organization-defined acceptable levels]; and\nb. Monitor environmental control levels [Assignment: organization-defined frequency].',
  },
  'PE-14(2)': {
    title: 'Monitoring with Alarms and Notifications',
    description:
      'Employ environmental control monitoring that provides an alarm or notification of changes potentially harmful to personnel or equipment to [Assignment: organization-defined personnel or roles].',
  },
  'PE-15': {
    title: 'Water Damage Protection',
    description:
      'Protect the system from damage resulting from water leakage by providing master shutoff or isolation valves that are accessible, working properly, and known to key personnel.',
  },
  'PE-15(1)': {
    title: 'Automation Support',
    description:
      'Detect the presence of water near the system and alert [Assignment: organization-defined personnel or roles] using [Assignment: organization-defined automated mechanisms].',
  },
  'PE-16': {
    title: 'Delivery and Removal',
    description:
      'a. Authorize and control [Assignment: organization-defined types of system components] entering and exiting the facility; and\nb. Maintain records of the system components.',
  },
  'PE-17': {
    title: 'Alternate Work Site',
    description:
      'a. Determine and document the [Assignment: organization-defined alternate work sites] allowed for use by employees;\nb. Employ the following controls at alternate work sites: [Assignment: organization-defined controls];\nc. Assess the effectiveness of controls at alternate work sites; and\nd. Provide a means for employees to communicate with information security and privacy personnel in case of incidents.',
  },
  'PE-18': {
    title: 'Location of System Components',
    description:
      'Position system components within the facility to minimize potential damage from [Assignment: organization-defined physical and environmental hazards] and to minimize the opportunity for unauthorized access.',
  },
  'PL-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] planning policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the planning policy and the associated planning controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the planning policy and procedures; and\nc. Review and update the current planning:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'PL-2': {
    title: 'System Security and Privacy Plans',
    description:
      'a. Develop security and privacy plans for the system that:\n1. Are consistent with the organization’s enterprise architecture;\n2. Explicitly define the constituent system components;\n3. Describe the operational context of the system in terms of mission and business processes;\n4. Identify the individuals that fulfill system roles and responsibilities;\n5. Identify the information types processed, stored, and transmitted by the system;\n6. Provide the security categorization of the system, including supporting rationale;\n7. Describe any specific threats to the system that are of concern to the organization;\n8. Provide the results of a privacy risk assessment for systems processing personally identifiable information;\n9. Describe the operational environment for the system and any dependencies on or connections to other systems or system components;\n10. Provide an overview of the security and privacy requirements for the system;\n11. Identify any relevant control baselines or overlays, if applicable;\n12. Describe the controls in place or planned for meeting the security and privacy requirements, including a rationale for any tailoring decisions;\n13. Include risk determinations for security and privacy architecture and design decisions;\n14. Include security- and privacy-related activities affecting the system that require planning and coordination with [Assignment: organization-defined individuals or groups]; and\n15. Are reviewed and approved by the authorizing official or designated representative prior to plan implementation.\nb. Distribute copies of the plans and communicate subsequent changes to the plans to [Assignment: organization-defined personnel or roles];\nc. Review the plans [Assignment: organization-defined frequency];\nd. Update the plans to address changes to the system and environment of operation or problems identified during plan implementation or control assessments; and\ne. Protect the plans from unauthorized disclosure and modification.',
  },
  'PL-4': {
    title: 'Rules of Behavior',
    description:
      'a. Establish and provide to individuals requiring access to the system, the rules that describe their responsibilities and expected behavior for information and system usage, security, and privacy;\nb. Receive a documented acknowledgment from such individuals, indicating that they have read, understand, and agree to abide by the rules of behavior, before authorizing access to information and the system;\nc. Review and update the rules of behavior [Assignment: organization-defined frequency]; and\nd. Require individuals who have acknowledged a previous version of the rules of behavior to read and re-acknowledge [Selection: one or more of: when the rules are revised or updated].',
  },
  'PL-4(1)': {
    title: 'Social Media and External Site/Application Usage Restrictions',
    description:
      'Include in the rules of behavior, restrictions on:\n(a) Use of social media, social networking sites, and external sites/applications;\n(b) Posting organizational information on public websites; and\n(c) Use of organization-provided identifiers (e.g., email addresses) and authentication secrets (e.g., passwords) for creating accounts on external sites/applications.',
  },
  'PL-8': {
    title: 'Security and Privacy Architectures',
    description:
      'a. Develop security and privacy architectures for the system that:\n1. Describe the requirements and approach to be taken for protecting the confidentiality, integrity, and availability of organizational information;\n2. Describe the requirements and approach to be taken for processing personally identifiable information to minimize privacy risk to individuals;\n3. Describe how the architectures are integrated into and support the enterprise architecture; and\n4. Describe any assumptions about, and dependencies on, external systems and services;\nb. Review and update the architectures [Assignment: organization-defined frequency] to reflect changes in the enterprise architecture; and\nc. Reflect planned architecture changes in security and privacy plans, Concept of Operations (CONOPS), criticality analysis, organizational procedures, and procurements and acquisitions.',
  },
  'PL-10': {
    title: 'Baseline Selection',
    description: 'Select a control baseline for the system.',
  },
  'PL-11': {
    title: 'Baseline Tailoring',
    description:
      'Tailor the selected control baseline by applying specified tailoring actions.',
  },
  'RA-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] risk assessment policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the risk assessment policy and the associated risk assessment controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the risk assessment policy and procedures; and\nc. Review and update the current risk assessment:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'RA-2': {
    title: 'Security Categorization',
    description:
      'a. Categorize the system and information it processes, stores, and transmits;\nb. Document the security categorization results, including supporting rationale, in the security plan for the system; and\nc. Verify that the authorizing official or authorizing official designated representative reviews and approves the security categorization decision.',
  },
  'RA-3': {
    title: 'Risk Assessment',
    description:
      'a. Conduct a risk assessment, including:\n1. Identifying threats to and vulnerabilities in the system;\n2. Determining the likelihood and magnitude of harm from unauthorized access, use, disclosure, disruption, modification, or destruction of the system, the information it processes, stores, or transmits, and any related information; and\n3. Determining the likelihood and impact of adverse effects on individuals arising from the processing of personally identifiable information;\nb. Integrate risk assessment results and risk management decisions from the organization and mission or business process perspectives with system-level risk assessments;\nc. Document risk assessment results in [Selection: one of: security and privacy plans; risk assessment report];\nd. Review risk assessment results [Assignment: organization-defined frequency];\ne. Disseminate risk assessment results to [Assignment: organization-defined personnel or roles]; and\nf. Update the risk assessment [Assignment: organization-defined frequency] or when there are significant changes to the system, its environment of operation, or other conditions that may impact the security or privacy state of the system.',
  },
  'RA-3(1)': {
    title: 'Supply Chain Risk Assessment',
    description:
      '(a) Assess supply chain risks associated with [Assignment: organization-defined systems, system components, and system services]; and\n(b) Update the supply chain risk assessment [Assignment: organization-defined frequency], when there are significant changes to the relevant supply chain, or when changes to the system, environments of operation, or other conditions may necessitate a change in the supply chain.',
  },
  'RA-5': {
    title: 'Vulnerability Monitoring and Scanning',
    description:
      'a. Monitor and scan for vulnerabilities in the system and hosted applications [Assignment: organization-defined frequency and/or randomly in accordance with organization-defined process] and when new vulnerabilities potentially affecting the system are identified and reported;\nb. Employ vulnerability monitoring tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for:\n1. Enumerating platforms, software flaws, and improper configurations;\n2. Formatting checklists and test procedures; and\n3. Measuring vulnerability impact;\nc. Analyze vulnerability scan reports and results from vulnerability monitoring;\nd. Remediate legitimate vulnerabilities [Assignment: organization-defined response times] in accordance with an organizational assessment of risk;\ne. Share information obtained from the vulnerability monitoring process and control assessments with [Assignment: organization-defined personnel or roles] to help eliminate similar vulnerabilities in other systems; and\nf. Employ vulnerability monitoring tools that include the capability to readily update the vulnerabilities to be scanned.',
  },
  'RA-5(2)': {
    title: 'Update Vulnerabilities to Be Scanned',
    description:
      'Update the system vulnerabilities to be scanned [Selection: one or more of: prior to a new scan; when new vulnerabilities are identified and reported].',
  },
  'RA-5(3)': {
    title: 'Breadth and Depth of Coverage',
    description:
      'Define the breadth and depth of vulnerability scanning coverage.',
  },
  'RA-5(4)': {
    title: 'Discoverable Information',
    description:
      'Determine information about the system that is discoverable and take [Assignment: organization-defined corrective actions].',
  },
  'RA-5(5)': {
    title: 'Privileged Access',
    description:
      'Implement privileged access authorization to [Assignment: organization-defined system components] for [Assignment: organization-defined vulnerability scanning activities].',
  },
  'RA-5(8)': {
    title: 'Review Historic Audit Logs',
    description:
      'Review historic audit logs to determine if a vulnerability identified in a [Assignment: organization-defined system] has been previously exploited within an [Assignment: organization-defined time period].',
  },
  'RA-5(11)': {
    title: 'Public Disclosure Program',
    description:
      'Establish a public reporting channel for receiving reports of vulnerabilities in organizational systems and system components.',
  },
  'RA-7': {
    title: 'Risk Response',
    description:
      'Respond to findings from security and privacy assessments, monitoring, and audits in accordance with organizational risk tolerance.',
  },
  'RA-9': {
    title: 'Criticality Analysis',
    description:
      'Identify critical system components and functions by performing a criticality analysis for [Assignment: organization-defined systems, system components, or system services] at [Assignment: organization-defined decision points in the system development life cycle].',
  },
  'SR-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] supply chain risk management policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the supply chain risk management policy and the associated supply chain risk management controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the supply chain risk management policy and procedures; and\nc. Review and update the current supply chain risk management:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'SR-2': {
    title: 'Supply Chain Risk Management Plan',
    description:
      'a. Develop a plan for managing supply chain risks associated with the research and development, design, manufacturing, acquisition, delivery, integration, operations and maintenance, and disposal of the following systems, system components or system services: [Assignment: organization-defined systems, system components, or system services];\nb. Review and update the supply chain risk management plan [Assignment: organization-defined frequency] or as required, to address threat, organizational or environmental changes; and\nc. Protect the supply chain risk management plan from unauthorized disclosure and modification.',
  },
  'SR-2(1)': {
    title: 'Establish SCRM Team',
    description:
      'Establish a supply chain risk management team consisting of [Assignment: organization-defined personnel, roles and responsibilities] to lead and support the following SCRM activities: [Assignment: organization-defined supply chain risk management activities].',
  },
  'SR-3': {
    title: 'Supply Chain Controls and Processes',
    description:
      'a. Establish a process or processes to identify and address weaknesses or deficiencies in the supply chain elements and processes of [Assignment: organization-defined system or system component] in coordination with [Assignment: organization-defined supply chain personnel];\nb. Employ the following controls to protect against supply chain risks to the system, system component, or system service and to limit the harm or consequences from supply chain-related events: [Assignment: organization-defined supply chain controls]; and\nc. Document the selected and implemented supply chain processes and controls in [Selection: one or more of: security and privacy plans; supply chain risk management plan].',
  },
  'SR-5': {
    title: 'Acquisition Strategies, Tools, and Methods',
    description:
      'Employ the following acquisition strategies, contract tools, and procurement methods to protect against, identify, and mitigate supply chain risks: [Assignment: organization-defined strategies, tools, and methods].',
  },
  'SR-6': {
    title: 'Supplier Assessments and Reviews',
    description:
      'Assess and review the supply chain-related risks associated with suppliers or contractors and the system, system component, or system service they provide [Assignment: organization-defined frequency].',
  },
  'SR-8': {
    title: 'Notification Agreements',
    description:
      'Establish agreements and procedures with entities involved in the supply chain for the system, system component, or system service for the [Selection: one or more of: notification of supply chain compromises].',
  },
  'SR-9': {
    title: 'Tamper Resistance and Detection',
    description:
      'Implement a tamper protection program for the system, system component, or system service.',
  },
  'SR-9(1)': {
    title: 'Multiple Stages of System Development Life Cycle',
    description:
      'Employ anti-tamper technologies, tools, and techniques throughout the system development life cycle.',
  },
  'SR-10': {
    title: 'Inspection of Systems or Components',
    description:
      'Inspect the following systems or system components [Selection: one or more of: at random; at; upon] to detect tampering: [Assignment: organization-defined systems or system components].',
  },
  'SR-11': {
    title: 'Component Authenticity',
    description:
      'a. Develop and implement anti-counterfeit policy and procedures that include the means to detect and prevent counterfeit components from entering the system; and\nb. Report counterfeit system components to [Selection: one or more of: source of counterfeit component].',
  },
  'SR-11(1)': {
    title: 'Anti-counterfeit Training',
    description:
      'Train [Assignment: organization-defined personnel or roles] to detect counterfeit system components (including hardware, software, and firmware).',
  },
  'SR-11(2)': {
    title: 'Configuration Control for Component Service and Repair',
    description:
      'Maintain configuration control over the following system components awaiting service or repair and serviced or repaired components awaiting return to service: [Assignment: organization-defined system components].',
  },
  'SR-12': {
    title: 'Component Disposal',
    description:
      'Dispose of [Assignment: organization-defined data, documentation, tools, or system components] using the following techniques and methods: [Assignment: organization-defined techniques and methods].',
  },
  'SC-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business-process-level; system-level] system and communications protection policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the system and communications protection policy and the associated system and communications protection controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and communications protection policy and procedures; and\nc. Review and update the current system and communications protection:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'SC-2': {
    title: 'Separation of System and User Functionality',
    description:
      'Separate user functionality, including user interface services, from system management functionality.',
  },
  'SC-3': {
    title: 'Security Function Isolation',
    description: 'Isolate security functions from nonsecurity functions.',
  },
  'SC-4': {
    title: 'Information in Shared System Resources',
    description:
      'Prevent unauthorized and unintended information transfer via shared system resources.',
  },
  'SC-5': {
    title: 'Denial-of-service Protection',
    description:
      'a. [Selection: one of: protect against; limit] the effects of the following types of denial-of-service events: [Assignment: organization-defined types of denial-of-service events]; and\nb. Employ the following controls to achieve the denial-of-service objective: [Assignment: organization-defined controls by type of denial-of-service event].',
  },
  'SC-7': {
    title: 'Boundary Protection',
    description:
      'a. Monitor and control communications at the external managed interfaces to the system and at key internal managed interfaces within the system;\nb. Implement subnetworks for publicly accessible system components that are [Selection: one of: physically; logically] separated from internal organizational networks; and\nc. Connect to external networks or systems only through managed interfaces consisting of boundary protection devices arranged in accordance with an organizational security and privacy architecture.',
  },
  'SC-7(3)': {
    title: 'Access Points',
    description:
      'Limit the number of external network connections to the system.',
  },
  'SC-7(4)': {
    title: 'External Telecommunications Services',
    description:
      '(a) Implement a managed interface for each external telecommunication service;\n(b) Establish a traffic flow policy for each managed interface;\n(c) Protect the confidentiality and integrity of the information being transmitted across each interface;\n(d) Document each exception to the traffic flow policy with a supporting mission or business need and duration of that need;\n(e) Review exceptions to the traffic flow policy [Assignment: organization-defined frequency] and remove exceptions that are no longer supported by an explicit mission or business need;\n(f) Prevent unauthorized exchange of control plane traffic with external networks;\n(g) Publish information to enable remote networks to detect unauthorized control plane traffic from internal networks; and\n(h) Filter unauthorized control plane traffic from external networks.',
  },
  'SC-7(5)': {
    title: 'Deny by Default — Allow by Exception',
    description:
      'Deny network communications traffic by default and allow network communications traffic by exception [Selection: one or more of: at managed interfaces; for].',
  },
  'SC-7(7)': {
    title: 'Split Tunneling for Remote Devices',
    description:
      'Prevent split tunneling for remote devices connecting to organizational systems unless the split tunnel is securely provisioned using [Assignment: organization-defined safeguards].',
  },
  'SC-7(8)': {
    title: 'Route Traffic to Authenticated Proxy Servers',
    description:
      'Route [Assignment: organization-defined internal communications traffic] to [Assignment: organization-defined external networks] through authenticated proxy servers at managed interfaces.',
  },
  'SC-7(10)': {
    title: 'Prevent Exfiltration',
    description:
      '(a) Prevent the exfiltration of information; and\n(b) Conduct exfiltration tests [Assignment: organization-defined frequency].',
  },
  'SC-7(12)': {
    title: 'Host-based Protection',
    description:
      'Implement [Assignment: organization-defined host-based boundary protection mechanisms] at [Assignment: organization-defined system components].',
  },
  'SC-7(18)': {
    title: 'Fail Secure',
    description:
      'Prevent systems from entering unsecure states in the event of an operational failure of a boundary protection device.',
  },
  'SC-7(20)': {
    title: 'Dynamic Isolation and Segregation',
    description:
      'Provide the capability to dynamically isolate [Assignment: organization-defined system components] from other system components.',
  },
  'SC-7(21)': {
    title: 'Isolation of System Components',
    description:
      'Employ boundary protection mechanisms to isolate [Assignment: organization-defined system components] supporting [Assignment: organization-defined missions and/or business functions].',
  },
  'SC-8': {
    title: 'Transmission Confidentiality and Integrity',
    description:
      'Protect the [Selection: one or more of: confidentiality; integrity] of transmitted information.',
  },
  'SC-8(1)': {
    title: 'Cryptographic Protection',
    description:
      'Implement cryptographic mechanisms to [Selection: one or more of: prevent unauthorized disclosure of information; detect changes to information] during transmission.',
  },
  'SC-10': {
    title: 'Network Disconnect',
    description:
      'Terminate the network connection associated with a communications session at the end of the session or after [Assignment: organization-defined time period] of inactivity.',
  },
  'SC-12': {
    title: 'Cryptographic Key Establishment and Management',
    description:
      'Establish and manage cryptographic keys when cryptography is employed within the system in accordance with the following key management requirements: [Assignment: organization-defined requirements].',
  },
  'SC-12(1)': {
    title: 'Availability',
    description:
      'Maintain availability of information in the event of the loss of cryptographic keys by users.',
  },
  'SC-13': {
    title: 'Cryptographic Protection',
    description:
      'a. Determine the [Assignment: organization-defined cryptographic uses]; and\nb. Implement the following types of cryptography required for each specified cryptographic use: [Assignment: organization-defined types of cryptography].',
  },
  'SC-15': {
    title: 'Collaborative Computing Devices and Applications',
    description:
      'a. Prohibit remote activation of collaborative computing devices and applications with the following exceptions: [Assignment: organization-defined exceptions where remote activation is to be allowed]; and\nb. Provide an explicit indication of use to users physically present at the devices.',
  },
  'SC-17': {
    title: 'Public Key Infrastructure Certificates',
    description:
      'a. Issue public key certificates under an [Assignment: organization-defined certificate policy] or obtain public key certificates from an approved service provider; and\nb. Include only approved trust anchors in trust stores or certificate stores managed by the organization.',
  },
  'SC-18': {
    title: 'Mobile Code',
    description:
      'a. Define acceptable and unacceptable mobile code and mobile code technologies; and\nb. Authorize, monitor, and control the use of mobile code within the system.',
  },
  'SC-20': {
    title: 'Secure Name/Address Resolution Service (Authoritative Source)',
    description:
      'a. Provide additional data origin authentication and integrity verification artifacts along with the authoritative name resolution data the system returns in response to external name/address resolution queries; and\nb. Provide the means to indicate the security status of child zones and (if the child supports secure resolution services) to enable verification of a chain of trust among parent and child domains, when operating as part of a distributed, hierarchical namespace.',
  },
  'SC-21': {
    title:
      'Secure Name/Address Resolution Service (Recursive or Caching Resolver)',
    description:
      'Request and perform data origin authentication and data integrity verification on the name/address resolution responses the system receives from authoritative sources.',
  },
  'SC-22': {
    title: 'Architecture and Provisioning for Name/Address Resolution Service',
    description:
      'Ensure the systems that collectively provide name/address resolution service for an organization are fault-tolerant and implement internal and external role separation.',
  },
  'SC-23': {
    title: 'Session Authenticity',
    description: 'Protect the authenticity of communications sessions.',
  },
  'SC-24': {
    title: 'Fail in Known State',
    description:
      'Fail to a [Assignment: organization-defined known system state] for the following failures on the indicated components while preserving [Assignment: organization-defined system state information] in failure: [Assignment: organization-defined types of system failures on system components].',
  },
  'SC-28': {
    title: 'Protection of Information at Rest',
    description:
      'Protect the [Selection: one or more of: confidentiality; integrity] of the following information at rest: [Assignment: organization-defined information at rest].',
  },
  'SC-28(1)': {
    title: 'Cryptographic Protection',
    description:
      'Implement cryptographic mechanisms to prevent unauthorized disclosure and modification of the following information at rest on [Assignment: organization-defined system components or media]: [Assignment: organization-defined information].',
  },
  'SC-39': {
    title: 'Process Isolation',
    description:
      'Maintain a separate execution domain for each executing system process.',
  },
  'SC-45': {
    title: 'System Time Synchronization',
    description:
      'Synchronize system clocks within and between systems and system components.',
  },
  'SC-45(1)': {
    title: 'Synchronization with Authoritative Time Source',
    description:
      '(a) Compare the internal system clocks [Assignment: organization-defined frequency] with [Assignment: organization-defined authoritative time source]; and\n(b) Synchronize the internal system clocks to the authoritative time source when the time difference is greater than [Assignment: organization-defined time period].',
  },
  'SI-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] system and information integrity policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the system and information integrity policy and the associated system and information integrity controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and information integrity policy and procedures; and\nc. Review and update the current system and information integrity:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'SI-2': {
    title: 'Flaw Remediation',
    description:
      'a. Identify, report, and correct system flaws;\nb. Test software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation;\nc. Install security-relevant software and firmware updates within [Assignment: organization-defined time period] of the release of the updates; and\nd. Incorporate flaw remediation into the organizational configuration management process.',
  },
  'SI-2(2)': {
    title: 'Automated Flaw Remediation Status',
    description:
      'Determine if system components have applicable security-relevant software and firmware updates installed using [Assignment: organization-defined automated mechanisms] [Assignment: organization-defined frequency].',
  },
  'SI-2(3)': {
    title: 'Time to Remediate Flaws and Benchmarks for Corrective Actions',
    description:
      '(a) Measure the time between flaw identification and flaw remediation; and\n(b) Establish the following benchmarks for taking corrective actions: [Assignment: organization-defined benchmarks].',
  },
  'SI-3': {
    title: 'Malicious Code Protection',
    description:
      'a. Implement [Selection: one or more of: signature-based; non-signature-based] malicious code protection mechanisms at system entry and exit points to detect and eradicate malicious code;\nb. Automatically update malicious code protection mechanisms as new releases are available in accordance with organizational configuration management policy and procedures;\nc. Configure malicious code protection mechanisms to:\n1. Perform periodic scans of the system [Assignment: organization-defined frequency] and real-time scans of files from external sources at [Selection: one or more of: endpoint; network entry and exit points] as the files are downloaded, opened, or executed in accordance with organizational policy; and\n2. [Selection: one or more of: block malicious code; quarantine malicious code; take]; and send alert to [Assignment: organization-defined personnel or roles] in response to malicious code detection; and\nd. Address the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the system.',
  },
  'SI-4': {
    title: 'System Monitoring',
    description:
      'a. Monitor the system to detect:\n1. Attacks and indicators of potential attacks in accordance with the following monitoring objectives: [Assignment: organization-defined monitoring objectives]; and\n2. Unauthorized local, network, and remote connections;\nb. Identify unauthorized use of the system through the following techniques and methods: [Assignment: organization-defined techniques and methods];\nc. Invoke internal monitoring capabilities or deploy monitoring devices:\n1. Strategically within the system to collect organization-determined essential information; and\n2. At ad hoc locations within the system to track specific types of transactions of interest to the organization;\nd. Analyze detected events and anomalies;\ne. Adjust the level of system monitoring activity when there is a change in risk to organizational operations and assets, individuals, other organizations, or the Nation;\nf. Obtain legal opinion regarding system monitoring activities; and\ng. Provide [Assignment: organization-defined system monitoring information] to [Assignment: organization-defined personnel or roles] [Selection: one or more of: as needed].',
  },
  'SI-4(1)': {
    title: 'System-wide Intrusion Detection System',
    description:
      'Connect and configure individual intrusion detection tools into a system-wide intrusion detection system.',
  },
  'SI-4(2)': {
    title: 'Automated Tools and Mechanisms for Real-time Analysis',
    description:
      'Employ automated tools and mechanisms to support near real-time analysis of events.',
  },
  'SI-4(4)': {
    title: 'Inbound and Outbound Communications Traffic',
    description:
      '(a) Determine criteria for unusual or unauthorized activities or conditions for inbound and outbound communications traffic;\n(b) Monitor inbound and outbound communications traffic [Assignment: organization-defined frequency] for [Assignment: organization-defined unusual or unauthorized activities or conditions].',
  },
  'SI-4(5)': {
    title: 'System-generated Alerts',
    description:
      'Alert [Assignment: organization-defined personnel or roles] when the following system-generated indications of compromise or potential compromise occur: [Assignment: organization-defined compromise indicators].',
  },
  'SI-4(10)': {
    title: 'Visibility of Encrypted Communications',
    description:
      'Make provisions so that [Assignment: organization-defined encrypted communications traffic] is visible to [Assignment: organization-defined system monitoring tools and mechanisms].',
  },
  'SI-4(11)': {
    title: 'Analyze Communications Traffic Anomalies',
    description:
      'Analyze outbound communications traffic at the external interfaces to the system and selected [Assignment: organization-defined interior points] to discover anomalies.',
  },
  'SI-4(12)': {
    title: 'Automated Organization-generated Alerts',
    description:
      'Alert [Assignment: organization-defined personnel or roles] using [Assignment: organization-defined automated mechanisms] when the following indications of inappropriate or unusual activities with security or privacy implications occur: [Assignment: organization-defined activities that trigger alerts].',
  },
  'SI-4(14)': {
    title: 'Wireless Intrusion Detection',
    description:
      'Employ a wireless intrusion detection system to identify rogue wireless devices and to detect attack attempts and potential compromises or breaches to the system.',
  },
  'SI-4(16)': {
    title: 'Correlate Monitoring Information',
    description:
      'Correlate information from monitoring tools and mechanisms employed throughout the system.',
  },
  'SI-4(18)': {
    title: 'Analyze Traffic and Covert Exfiltration',
    description:
      'Analyze outbound communications traffic at external interfaces to the system and at the following interior points to detect covert exfiltration of information: [Assignment: organization-defined interior points].',
  },
  'SI-4(19)': {
    title: 'Risk for Individuals',
    description:
      'Implement [Assignment: organization-defined additional monitoring] of individuals who have been identified by [Assignment: organization-defined sources] as posing an increased level of risk.',
  },
  'SI-4(20)': {
    title: 'Privileged Users',
    description:
      'Implement the following additional monitoring of privileged users: [Assignment: organization-defined additional monitoring].',
  },
  'SI-4(22)': {
    title: 'Unauthorized Network Services',
    description:
      '(a) Detect network services that have not been authorized or approved by [Assignment: organization-defined authorization or approval processes]; and\n(b) [Selection: one or more of: audit; alert] when detected.',
  },
  'SI-4(23)': {
    title: 'Host-based Devices',
    description:
      'Implement the following host-based monitoring mechanisms at [Assignment: organization-defined system components]: [Assignment: organization-defined host-based monitoring mechanisms].',
  },
  'SI-5': {
    title: 'Security Alerts, Advisories, and Directives',
    description:
      'a. Receive system security alerts, advisories, and directives from [Assignment: organization-defined external organizations] on an ongoing basis;\nb. Generate internal security alerts, advisories, and directives as deemed necessary;\nc. Disseminate security alerts, advisories, and directives to: [Selection: one or more of: [Assignment: organization-defined personnel or roles]; [Assignment: organization-defined elements]; [Assignment: organization-defined external organizations]]; and\nd. Implement security directives in accordance with established time frames, or notify the issuing organization of the degree of noncompliance.',
  },
  'SI-5(1)': {
    title: 'Automated Alerts and Advisories',
    description:
      'Broadcast security alert and advisory information throughout the organization using [Assignment: organization-defined automated mechanisms].',
  },
  'SI-6': {
    title: 'Security and Privacy Function Verification',
    description:
      'a. Verify the correct operation of [Assignment: organization-defined security and privacy functions];\nb. Perform the verification of the functions specified in SI-6a [Selection: one or more of: upon command by user with appropriate privilege];\nc. Alert [Assignment: organization-defined personnel or roles] to failed security and privacy verification tests; and\nd. [Selection: one or more of: shut the system down; restart the system] when anomalies are discovered.',
  },
  'SI-7': {
    title: 'Software, Firmware, and Information Integrity',
    description:
      'a. Employ integrity verification tools to detect unauthorized changes to the following software, firmware, and information: [Assignment: organization-defined software, firmware, and information]; and\nb. Take the following actions when unauthorized changes to the software, firmware, and information are detected: [Assignment: organization-defined actions].',
  },
  'SI-7(1)': {
    title: 'Integrity Checks',
    description:
      'Perform an integrity check of [Assignment: organization-defined software, firmware, and information] [Selection: one or more of: at startup; at].',
  },
  'SI-7(2)': {
    title: 'Automated Notifications of Integrity Violations',
    description:
      'Employ automated tools that provide notification to [Assignment: organization-defined personnel or roles] upon discovering discrepancies during integrity verification.',
  },
  'SI-7(5)': {
    title: 'Automated Response to Integrity Violations',
    description:
      'Automatically [Selection: one or more of: shut down the system; restart the system; implement] when integrity violations are discovered.',
  },
  'SI-7(7)': {
    title: 'Integration of Detection and Response',
    description:
      'Incorporate the detection of the following unauthorized changes into the organizational incident response capability: [Assignment: organization-defined changes].',
  },
  'SI-7(15)': {
    title: 'Code Authentication',
    description:
      'Implement cryptographic mechanisms to authenticate the following software or firmware components prior to installation: [Assignment: organization-defined software or firmware components].',
  },
  'SI-8': {
    title: 'Spam Protection',
    description:
      'a. Employ spam protection mechanisms at system entry and exit points to detect and act on unsolicited messages; and\nb. Update spam protection mechanisms when new releases are available in accordance with organizational configuration management policy and procedures.',
  },
  'SI-8(2)': {
    title: 'Automatic Updates',
    description:
      'Automatically update spam protection mechanisms [Assignment: organization-defined frequency].',
  },
  'SI-10': {
    title: 'Information Input Validation',
    description:
      'Check the validity of the following information inputs: [Assignment: organization-defined information inputs].',
  },
  'SI-11': {
    title: 'Error Handling',
    description:
      'a. Generate error messages that provide information necessary for corrective actions without revealing information that could be exploited; and\nb. Reveal error messages only to [Assignment: organization-defined personnel or roles].',
  },
  'SI-12': {
    title: 'Information Management and Retention',
    description:
      'Manage and retain information within the system and information output from the system in accordance with applicable laws, executive orders, directives, regulations, policies, standards, guidelines and operational requirements.',
  },
  'SI-16': {
    title: 'Memory Protection',
    description:
      'Implement the following controls to protect the system memory from unauthorized code execution: [Assignment: organization-defined controls].',
  },
  'SA-1': {
    title: 'Policy and Procedures',
    description:
      'a. Develop, document, and disseminate to [Assignment: organization-defined personnel or roles]:\n1. [Selection: one or more of: organization-level; mission/business process-level; system-level] system and services acquisition policy that:\n(a) Addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and\n(b) Is consistent with applicable laws, executive orders, directives, regulations, policies, standards, and guidelines; and\n2. Procedures to facilitate the implementation of the system and services acquisition policy and the associated system and services acquisition controls;\nb. Designate an [Assignment: organization-defined official] to manage the development, documentation, and dissemination of the system and services acquisition policy and procedures; and\nc. Review and update the current system and services acquisition:\n1. Policy [Assignment: organization-defined frequency] and following [Assignment: organization-defined events]; and\n2. Procedures [Assignment: organization-defined frequency] and following [Assignment: organization-defined events].',
  },
  'SA-2': {
    title: 'Allocation of Resources',
    description:
      'a. Determine the high-level information security and privacy requirements for the system or system service in mission and business process planning;\nb. Determine, document, and allocate the resources required to protect the system or system service as part of the organizational capital planning and investment control process; and\nc. Establish a discrete line item for information security and privacy in organizational programming and budgeting documentation.',
  },
  'SA-3': {
    title: 'System Development Life Cycle',
    description:
      'a. Acquire, develop, and manage the system using [Assignment: organization-defined system-development life cycle] that incorporates information security and privacy considerations;\nb. Define and document information security and privacy roles and responsibilities throughout the system development life cycle;\nc. Identify individuals having information security and privacy roles and responsibilities; and\nd. Integrate the organizational information security and privacy risk management process into system development life cycle activities.',
  },
  'SA-4': {
    title: 'Acquisition Process',
    description:
      'Include the following requirements, descriptions, and criteria, explicitly or by reference, using [Selection: one or more of: standardized contract language] in the acquisition contract for the system, system component, or system service:\na. Security and privacy functional requirements;\nb. Strength of mechanism requirements;\nc. Security and privacy assurance requirements;\nd. Controls needed to satisfy the security and privacy requirements.\ne. Security and privacy documentation requirements;\nf. Requirements for protecting security and privacy documentation;\ng. Description of the system development environment and environment in which the system is intended to operate;\nh. Allocation of responsibility or identification of parties responsible for information security, privacy, and supply chain risk management; and\ni. Acceptance criteria.',
  },
  'SA-4(1)': {
    title: 'Functional Properties of Controls',
    description:
      'Require the developer of the system, system component, or system service to provide a description of the functional properties of the controls to be implemented.',
  },
  'SA-4(2)': {
    title: 'Design and Implementation Information for Controls',
    description:
      'Require the developer of the system, system component, or system service to provide design and implementation information for the controls that includes: [Selection: one or more of: security-relevant external system interfaces; high-level design; low-level design; source code or hardware schematics] at [Assignment: organization-defined level of detail].',
  },
  'SA-4(5)': {
    title: 'System, Component, and Service Configurations',
    description:
      'Require the developer of the system, system component, or system service to:\n(a) Deliver the system, component, or service with [Assignment: organization-defined security configurations] implemented; and\n(b) Use the configurations as the default for any subsequent system, component, or service reinstallation or upgrade.',
  },
  'SA-4(9)': {
    title: 'Functions, Ports, Protocols, and Services in Use',
    description:
      'Require the developer of the system, system component, or system service to identify the functions, ports, protocols, and services intended for organizational use.',
  },
  'SA-4(10)': {
    title: 'Use of Approved PIV Products',
    description:
      'Employ only information technology products on the FIPS 201-approved products list for Personal Identity Verification (PIV) capability implemented within organizational systems.',
  },
  'SA-5': {
    title: 'System Documentation',
    description:
      'a. Obtain or develop administrator documentation for the system, system component, or system service that describes:\n1. Secure configuration, installation, and operation of the system, component, or service;\n2. Effective use and maintenance of security and privacy functions and mechanisms; and\n3. Known vulnerabilities regarding configuration and use of administrative or privileged functions;\nb. Obtain or develop user documentation for the system, system component, or system service that describes:\n1. User-accessible security and privacy functions and mechanisms and how to effectively use those functions and mechanisms;\n2. Methods for user interaction, which enables individuals to use the system, component, or service in a more secure manner and protect individual privacy; and\n3. User responsibilities in maintaining the security of the system, component, or service and privacy of individuals;\nc. Document attempts to obtain system, system component, or system service documentation when such documentation is either unavailable or nonexistent and take [Assignment: organization-defined actions] in response; and\nd. Distribute documentation to [Assignment: organization-defined personnel or roles].',
  },
  'SA-8': {
    title: 'Security and Privacy Engineering Principles',
    description:
      'Apply the following systems security and privacy engineering principles in the specification, design, development, implementation, and modification of the system and system components: [Assignment: organization-defined systems security and privacy engineering principles].',
  },
  'SA-9': {
    title: 'External System Services',
    description:
      'a. Require that providers of external system services comply with organizational security and privacy requirements and employ the following controls: [Assignment: organization-defined controls];\nb. Define and document organizational oversight and user roles and responsibilities with regard to external system services; and\nc. Employ the following processes, methods, and techniques to monitor control compliance by external service providers on an ongoing basis: [Assignment: organization-defined processes, methods, and techniques].',
  },
  'SA-9(1)': {
    title: 'Risk Assessments and Organizational Approvals',
    description:
      '(a) Conduct an organizational assessment of risk prior to the acquisition or outsourcing of information security services; and\n(b) Verify that the acquisition or outsourcing of dedicated information security services is approved by [Assignment: organization-defined personnel or roles].',
  },
  'SA-9(2)': {
    title: 'Identification of Functions, Ports, Protocols, and Services',
    description:
      'Require providers of the following external system services to identify the functions, ports, protocols, and other services required for the use of such services: [Assignment: organization-defined external system services].',
  },
  'SA-9(5)': {
    title: 'Processing, Storage, and Service Location',
    description:
      'Restrict the location of [Selection: one or more of: information processing; information or data; system services] to [Assignment: organization-defined locations] based on [Assignment: organization-defined requirements].',
  },
  'SA-10': {
    title: 'Developer Configuration Management',
    description:
      'Require the developer of the system, system component, or system service to:\na. Perform configuration management during system, component, or service [Selection: one or more of: design; development; implementation; operation; disposal];\nb. Document, manage, and control the integrity of changes to [Assignment: organization-defined configuration items];\nc. Implement only organization-approved changes to the system, component, or service;\nd. Document approved changes to the system, component, or service and the potential security and privacy impacts of such changes; and\ne. Track security flaws and flaw resolution within the system, component, or service and report findings to [Assignment: organization-defined personnel].',
  },
  'SA-11': {
    title: 'Developer Testing and Evaluation',
    description:
      'Require the developer of the system, system component, or system service, at all post-design stages of the system development life cycle, to:\na. Develop and implement a plan for ongoing security and privacy control assessments;\nb. Perform [Selection: one or more of: unit; integration; system; regression] testing/evaluation [Assignment: organization-defined frequency to conduct] at [Assignment: organization-defined depth and coverage];\nc. Produce evidence of the execution of the assessment plan and the results of the testing and evaluation;\nd. Implement a verifiable flaw remediation process; and\ne. Correct flaws identified during testing and evaluation.',
  },
  'SA-11(1)': {
    title: 'Static Code Analysis',
    description:
      'Require the developer of the system, system component, or system service to employ static code analysis tools to identify common flaws and document the results of the analysis.',
  },
  'SA-11(2)': {
    title: 'Threat Modeling and Vulnerability Analyses',
    description:
      'Require the developer of the system, system component, or system service to perform threat modeling and vulnerability analyses during development and the subsequent testing and evaluation of the system, component, or service that:\n(a) Uses the following contextual information: [Assignment: organization-defined information];\n(b) Employs the following tools and methods: [Assignment: organization-defined tools and methods];\n(c) Conducts the modeling and analyses at the following level of rigor: [Assignment: organization-defined breadth and depth of modeling and analyses]; and\n(d) Produces evidence that meets the following acceptance criteria: [Assignment: organization-defined acceptance criteria].',
  },
  'SA-15': {
    title: 'Development Process, Standards, and Tools',
    description:
      'a. Require the developer of the system, system component, or system service to follow a documented development process that:\n1. Explicitly addresses security and privacy requirements;\n2. Identifies the standards and tools used in the development process;\n3. Documents the specific tool options and tool configurations used in the development process; and\n4. Documents, manages, and ensures the integrity of changes to the process and/or tools used in development; and\nb. Review the development process, standards, tools, tool options, and tool configurations [Assignment: organization-defined frequency] to determine if the process, standards, tools, tool options and tool configurations selected and employed can satisfy the following security and privacy requirements: [Assignment: organization-defined security and privacy requirements].',
  },
  'SA-15(3)': {
    title: 'Criticality Analysis',
    description:
      'Require the developer of the system, system component, or system service to perform a criticality analysis:\n(a) At the following decision points in the system development life cycle: [Assignment: organization-defined decision points]; and\n(b) At the following level of rigor: [Assignment: organization-defined breadth and depth of criticality analysis].',
  },
  'SA-16': {
    title: 'Developer-provided Training',
    description:
      'Require the developer of the system, system component, or system service to provide the following training on the correct use and operation of the implemented security and privacy functions, controls, and/or mechanisms: [Assignment: organization-defined training].',
  },
  'SA-17': {
    title: 'Developer Security and Privacy Architecture and Design',
    description:
      'Require the developer of the system, system component, or system service to produce a design specification and security and privacy architecture that:\na. Is consistent with the organization’s security and privacy architecture that is an integral part the organization’s enterprise architecture;\nb. Accurately and completely describes the required security and privacy functionality, and the allocation of controls among physical and logical components; and\nc. Expresses how individual security and privacy functions, mechanisms, and services work together to provide required security and privacy capabilities and a unified approach to protection.',
  },
  'SA-21': {
    title: 'Developer Screening',
    description:
      'Require that the developer of [Assignment: organization-defined system, systems component, or system service]:\na. Has appropriate access authorizations as determined by assigned [Assignment: organization-defined official government duties]; and\nb. Satisfies the following additional personnel screening criteria: [Assignment: organization-defined additional personnel screening criteria].',
  },
  'SA-22': {
    title: 'Unsupported System Components',
    description:
      'a. Replace system components when support for the components is no longer available from the developer, vendor, or manufacturer; or\nb. Provide the following options for alternative sources for continued support for unsupported components [Selection: one or more of: in-house support].',
  },
};
