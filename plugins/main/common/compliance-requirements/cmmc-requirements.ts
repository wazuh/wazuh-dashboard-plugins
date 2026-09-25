/*
 * Wazuh app - Module for CMMC 2.0 requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { i18n } from '@osd/i18n';

/*
 * Source: CMMC Model Overview Version 2.13 (DoD)
 *   https://dodcio.defense.gov/Portals/0/Documents/CMMC/ModelOverviewv2.pdf
 *
 * Practice IDs, levels, and descriptions are taken verbatim from that document.
 *
 */
export const cmmcRequirementsFile = {
  // ── Access Control (AC) ─────────────────────────────────────────────────────

  // Level 1 — FAR Clause 52.204-21
  'AC.L1-3.1.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_3_1_1',
    {
      defaultMessage:
        'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
    },
  ),
  'AC.L1-3.1.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_3_1_2',
    {
      defaultMessage:
        'Limit system access to the types of transactions and functions that authorized users are permitted to execute.',
    },
  ),
  'AC.L1-3.1.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_3_1_3',
    {
      defaultMessage:
        'Control the flow of CUI in accordance with approved authorizations.',
    },
  ),
  'AC.L1-b.1.i': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_b_1_i',
    {
      defaultMessage:
        'Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems).',
    },
  ),
  'AC.L1-b.1.ii': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_b_1_ii',
    {
      defaultMessage:
        'Limit information system access to the types of transactions and functions that authorized users are permitted to execute.',
    },
  ),
  'AC.L1-b.1.iii': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_b_1_iii',
    {
      defaultMessage:
        'Verify and control/limit connections to and use of external information systems.',
    },
  ),
  'AC.L1-b.1.iv': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L1_b_1_iv',
    {
      defaultMessage:
        'Control information posted or processed on publicly accessible information systems.',
    },
  ),

  // Level 2 — NIST SP 800-171 Rev 2
  'AC.L2-3.1.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_1',
    {
      defaultMessage:
        'Limit system access to authorized users, processes acting on behalf of authorized users, and devices (including other systems).',
    },
  ),
  'AC.L2-3.1.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_2',
    {
      defaultMessage:
        'Limit system access to the types of transactions and functions that authorized users are permitted to execute.',
    },
  ),
  'AC.L2-3.1.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_3',
    {
      defaultMessage:
        'Control the flow of CUI in accordance with approved authorizations.',
    },
  ),
  'AC.L2-3.1.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_4',
    {
      defaultMessage:
        'Separate the duties of individuals to reduce the risk of malevolent activity without collusion.',
    },
  ),
  'AC.L2-3.1.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_5',
    {
      defaultMessage:
        'Employ the principle of least privilege, including for specific security functions and privileged accounts.',
    },
  ),
  'AC.L2-3.1.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_6',
    {
      defaultMessage:
        'Use non-privileged accounts or roles when accessing nonsecurity functions.',
    },
  ),
  'AC.L2-3.1.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_7',
    {
      defaultMessage:
        'Prevent non-privileged users from executing privileged functions and capture the execution of such functions in audit logs.',
    },
  ),
  'AC.L2-3.1.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_8',
    { defaultMessage: 'Limit unsuccessful logon attempts.' },
  ),
  'AC.L2-3.1.9': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_9',
    {
      defaultMessage:
        'Provide privacy and security notices consistent with applicable CUI rules.',
    },
  ),
  'AC.L2-3.1.10': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_10',
    {
      defaultMessage:
        'Use session lock with pattern-hiding displays to prevent access and viewing of data after a period of inactivity.',
    },
  ),
  'AC.L2-3.1.11': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_11',
    {
      defaultMessage:
        'Terminate (automatically) a user session after a defined condition.',
    },
  ),
  'AC.L2-3.1.12': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_12',
    { defaultMessage: 'Monitor and control remote access sessions.' },
  ),
  'AC.L2-3.1.13': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_13',
    {
      defaultMessage:
        'Employ cryptographic mechanisms to protect the confidentiality of remote access sessions.',
    },
  ),
  'AC.L2-3.1.14': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_14',
    {
      defaultMessage: 'Route remote access via managed access control points.',
    },
  ),
  'AC.L2-3.1.15': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_15',
    {
      defaultMessage:
        'Authorize remote execution of privileged commands and remote access to security-relevant information.',
    },
  ),
  'AC.L2-3.1.16': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_16',
    {
      defaultMessage:
        'Authorize wireless access prior to allowing such connections.',
    },
  ),
  'AC.L2-3.1.17': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_17',
    {
      defaultMessage:
        'Protect wireless access using authentication and encryption.',
    },
  ),
  'AC.L2-3.1.18': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_18',
    { defaultMessage: 'Control connection of mobile devices.' },
  ),
  'AC.L2-3.1.19': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_19',
    {
      defaultMessage:
        'Encrypt CUI on mobile devices and mobile computing platforms.',
    },
  ),
  'AC.L2-3.1.20': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_20',
    {
      defaultMessage:
        'Verify and control/limit connections to and use of external systems.',
    },
  ),
  'AC.L2-3.1.21': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_21',
    {
      defaultMessage:
        'Limit use of portable storage devices on external systems.',
    },
  ),
  'AC.L2-3.1.22': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L2_3_1_22',
    {
      defaultMessage:
        'Control CUI posted or processed on publicly accessible systems.',
    },
  ),

  // Level 3 — NIST SP 800-172
  'AC.L3-3.1.2e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L3_3_1_2e',
    {
      defaultMessage:
        'Restrict access to systems and system components to only those information resources that are owned, provisioned, or issued by the organization.',
    },
  ),
  'AC.L3-3.1.3e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AC_L3_3_1_3e',
    {
      defaultMessage:
        'Employ secure information transfer solutions to control information flows between security domains on connected systems.',
    },
  ),

  // ── Awareness and Training (AT) ─────────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'AT.L2-3.2.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AT_L2_3_2_1',
    {
      defaultMessage:
        'Inform managers, systems administrators, and users of organizational systems of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.',
    },
  ),
  'AT.L2-3.2.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AT_L2_3_2_2',
    {
      defaultMessage:
        'Train personnel to carry out their assigned information security-related duties and responsibilities.',
    },
  ),
  'AT.L2-3.2.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AT_L2_3_2_3',
    {
      defaultMessage:
        'Provide security awareness training on recognizing and reporting potential indicators of insider threat.',
    },
  ),

  // Level 3 — NIST SP 800-172
  'AT.L3-3.2.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AT_L3_3_2_1e',
    {
      defaultMessage:
        'Provide awareness training upon initial hire, following a significant cyber event, and at least annually, focused on recognizing and responding to threats from social engineering, advanced persistent threat actors, breaches, and suspicious behaviors; update the training at least annually or when there are significant changes to the threat.',
    },
  ),
  'AT.L3-3.2.2e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AT_L3_3_2_2e',
    {
      defaultMessage:
        'Include practical exercises in awareness training for all users, tailored by roles, to include general users, users with specialized roles, and privileged users, that are aligned with current threat scenarios and provide feedback to individuals involved in the training and their supervisors.',
    },
  ),

  // ── Audit and Accountability (AU) ───────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'AU.L2-3.3.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_1',
    {
      defaultMessage:
        'Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.',
    },
  ),
  'AU.L2-3.3.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_2',
    {
      defaultMessage:
        'Uniquely trace the actions of individual system users, so they can be held accountable for their actions.',
    },
  ),
  'AU.L2-3.3.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_3',
    { defaultMessage: 'Review and update logged events.' },
  ),
  'AU.L2-3.3.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_4',
    {
      defaultMessage: 'Alert in the event of an audit logging process failure.',
    },
  ),
  'AU.L2-3.3.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_5',
    {
      defaultMessage:
        'Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.',
    },
  ),
  'AU.L2-3.3.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_6',
    {
      defaultMessage:
        'Provide audit record reduction and report generation to support on-demand analysis and reporting.',
    },
  ),
  'AU.L2-3.3.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_7',
    {
      defaultMessage:
        'Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.',
    },
  ),
  'AU.L2-3.3.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_8',
    {
      defaultMessage:
        'Protect audit information and audit logging tools from unauthorized access, modification, and deletion.',
    },
  ),
  'AU.L2-3.3.9': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.AU_L2_3_3_9',
    {
      defaultMessage:
        'Limit management of audit logging functionality to a subset of privileged users.',
    },
  ),

  // ── Configuration Management (CM) ───────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'CM.L2-3.4.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_1',
    {
      defaultMessage:
        'Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.',
    },
  ),
  'CM.L2-3.4.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_2',
    {
      defaultMessage:
        'Establish and enforce security configuration settings for information technology products employed in organizational systems.',
    },
  ),
  'CM.L2-3.4.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_3',
    {
      defaultMessage:
        'Track, review, approve or disapprove, and log changes to organizational systems.',
    },
  ),
  'CM.L2-3.4.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_4',
    {
      defaultMessage:
        'Analyze the security impact of changes prior to implementation.',
    },
  ),
  'CM.L2-3.4.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_5',
    {
      defaultMessage:
        'Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.',
    },
  ),
  'CM.L2-3.4.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_6',
    {
      defaultMessage:
        'Employ the principle of least functionality by configuring organizational systems to provide only essential capabilities.',
    },
  ),
  'CM.L2-3.4.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_7',
    {
      defaultMessage:
        'Restrict, disable, or prevent the use of nonessential programs, functions, ports, protocols, and services.',
    },
  ),
  'CM.L2-3.4.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_8',
    {
      defaultMessage:
        'Apply deny-by-exception (blacklisting) policy to prevent the use of unauthorized software or deny-all, permit-by-exception (whitelisting) policy to allow the execution of authorized software.',
    },
  ),
  'CM.L2-3.4.9': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L2_3_4_9',
    { defaultMessage: 'Control and monitor user-installed software.' },
  ),

  // Level 3 — NIST SP 800-172
  'CM.L3-3.4.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L3_3_4_1e',
    {
      defaultMessage:
        'Establish and maintain an authoritative source and repository to provide a trusted source and accountability for approved and implemented system components.',
    },
  ),
  'CM.L3-3.4.2e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L3_3_4_2e',
    {
      defaultMessage:
        'Employ automated mechanisms to detect misconfigured or unauthorized system components; after detection, remove the components or place the components in a quarantine or remediation network to facilitate patching, re-configuration, or other mitigations.',
    },
  ),
  'CM.L3-3.4.3e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CM_L3_3_4_3e',
    {
      defaultMessage:
        'Employ automated discovery and management tools to maintain an up-to-date, complete, accurate, and readily available inventory of system components.',
    },
  ),

  // ── Identification and Authentication (IA) ──────────────────────────────────

  // Level 1 — FAR Clause 52.204-21
  'IA.L1-3.5.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L1_3_5_1',
    {
      defaultMessage:
        'Identify system users, processes acting on behalf of users, and devices.',
    },
  ),
  'IA.L1-b.1.v': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L1_b_1_v',
    {
      defaultMessage:
        'Identify information system users, processes acting on behalf of users, or devices.',
    },
  ),
  'IA.L1-b.1.vi': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L1_b_1_vi',
    {
      defaultMessage:
        'Authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.',
    },
  ),

  // Level 2 — NIST SP 800-171 Rev 2
  'IA.L2-3.5.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_1',
    {
      defaultMessage:
        'Identify system users, processes acting on behalf of users, and devices.',
    },
  ),
  'IA.L2-3.5.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_2',
    {
      defaultMessage:
        'Authenticate (or verify) the identities of users, processes, or devices, as a prerequisite to allowing access to organizational systems.',
    },
  ),
  'IA.L2-3.5.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_3',
    {
      defaultMessage:
        'Use multifactor authentication for local and network access to privileged accounts and for network access to non-privileged accounts.',
    },
  ),
  'IA.L2-3.5.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_4',
    {
      defaultMessage:
        'Employ replay-resistant authentication mechanisms for network access to privileged and non-privileged accounts.',
    },
  ),
  'IA.L2-3.5.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_5',
    { defaultMessage: 'Prevent reuse of identifiers for a defined period.' },
  ),
  'IA.L2-3.5.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_6',
    {
      defaultMessage:
        'Disable identifiers after a defined period of inactivity.',
    },
  ),
  'IA.L2-3.5.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_7',
    {
      defaultMessage:
        'Enforce a minimum password complexity and change of characters when new passwords are created.',
    },
  ),
  'IA.L2-3.5.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_8',
    {
      defaultMessage:
        'Prohibit password reuse for a specified number of generations.',
    },
  ),
  'IA.L2-3.5.9': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_9',
    {
      defaultMessage:
        'Allow temporary password use for system logons with an immediate change to a permanent password.',
    },
  ),
  'IA.L2-3.5.10': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_10',
    {
      defaultMessage:
        'Store and transmit only cryptographically protected passwords.',
    },
  ),
  'IA.L2-3.5.11': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L2_3_5_11',
    { defaultMessage: 'Obscure feedback of authentication information.' },
  ),

  // Level 3 — NIST SP 800-172
  'IA.L3-3.5.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L3_3_5_1e',
    {
      defaultMessage:
        'Identify and authenticate systems and system components, where possible, before establishing a network connection using bidirectional authentication that is cryptographically based and replay resistant.',
    },
  ),
  'IA.L3-3.5.3e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IA_L3_3_5_3e',
    {
      defaultMessage:
        'Employ automated or manual/procedural mechanisms to prohibit system components from connecting to organizational systems unless the components are known, authenticated, in a properly configured state, or in a trust profile.',
    },
  ),

  // ── Incident Response (IR) ──────────────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'IR.L2-3.6.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IR_L2_3_6_1',
    {
      defaultMessage:
        'Establish an operational incident-handling capability for organizational systems that includes preparation, detection, analysis, containment, recovery, and user response activities.',
    },
  ),
  'IR.L2-3.6.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IR_L2_3_6_2',
    {
      defaultMessage:
        'Track, document, and report incidents to designated officials and/or authorities both internal and external to the organization.',
    },
  ),
  'IR.L2-3.6.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IR_L2_3_6_3',
    { defaultMessage: 'Test the organizational incident response capability.' },
  ),

  // Level 3 — NIST SP 800-172
  'IR.L3-3.6.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IR_L3_3_6_1e',
    {
      defaultMessage:
        'Establish and maintain a security operations center capability that operates 24/7, with allowance for remote/on-call staff.',
    },
  ),
  'IR.L3-3.6.2e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.IR_L3_3_6_2e',
    {
      defaultMessage:
        'Establish and maintain a cyber incident response team that can be deployed by the organization within 24 hours.',
    },
  ),

  // ── Maintenance (MA) ────────────────────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'MA.L2-3.7.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MA_L2_3_7_1',
    { defaultMessage: 'Perform maintenance on organizational systems.' },
  ),
  'MA.L2-3.7.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MA_L2_3_7_2',
    {
      defaultMessage:
        'Provide controls on the tools, techniques, mechanisms, and personnel used to conduct system maintenance.',
    },
  ),
  'MA.L2-3.7.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MA_L2_3_7_3',
    {
      defaultMessage:
        'Sanitize equipment removed for off-site maintenance of any CUI.',
    },
  ),
  'MA.L2-3.7.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MA_L2_3_7_4',
    {
      defaultMessage:
        'Check media containing diagnostic and test programs for malicious code before the media are used in organizational systems.',
    },
  ),
  'MA.L2-3.7.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MA_L2_3_7_5',
    {
      defaultMessage:
        'Require multifactor authentication to establish nonlocal maintenance sessions via external network connections and terminate such connections when nonlocal maintenance is complete.',
    },
  ),
  'MA.L2-3.7.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MA_L2_3_7_6',
    {
      defaultMessage:
        'Supervise the maintenance activities of maintenance personnel without required access authorization.',
    },
  ),

  // ── Media Protection (MP) ───────────────────────────────────────────────────

  // Level 1 — FAR Clause 52.204-21
  'MP.L1-b.1.vii': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L1_b_1_vii',
    {
      defaultMessage:
        'Sanitize or destroy information system media containing Federal Contract Information before disposal or release for reuse.',
    },
  ),

  // Level 2 — NIST SP 800-171 Rev 2
  'MP.L2-3.8.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_1',
    {
      defaultMessage:
        'Protect (i.e., physically control and securely store) system media containing CUI, both paper and digital.',
    },
  ),
  'MP.L2-3.8.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_2',
    {
      defaultMessage:
        'Limit access to CUI on system media to authorized users.',
    },
  ),
  'MP.L2-3.8.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_3',
    {
      defaultMessage:
        'Sanitize or destroy system media containing CUI before disposal or release for reuse.',
    },
  ),
  'MP.L2-3.8.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_4',
    {
      defaultMessage:
        'Mark media with necessary CUI markings and distribution limitations.',
    },
  ),
  'MP.L2-3.8.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_5',
    {
      defaultMessage:
        'Control access to media containing CUI and maintain accountability for media during transport outside of controlled areas.',
    },
  ),
  'MP.L2-3.8.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_6',
    {
      defaultMessage:
        'Implement cryptographic mechanisms to protect the confidentiality of CUI stored on digital media during transport unless otherwise protected by alternative physical safeguards.',
    },
  ),
  'MP.L2-3.8.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_7',
    {
      defaultMessage:
        'Control the use of removable media on system components.',
    },
  ),
  'MP.L2-3.8.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_8',
    {
      defaultMessage:
        'Prohibit the use of portable storage devices when such devices have no identifiable owner.',
    },
  ),
  'MP.L2-3.8.9': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.MP_L2_3_8_9',
    {
      defaultMessage:
        'Protect the confidentiality of backup CUI at storage locations.',
    },
  ),

  // ── Personnel Security (PS) ─────────────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'PS.L2-3.9.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PS_L2_3_9_1',
    {
      defaultMessage:
        'Screen individuals prior to authorizing access to organizational systems containing CUI.',
    },
  ),
  'PS.L2-3.9.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PS_L2_3_9_2',
    {
      defaultMessage:
        'Protect organizational systems containing CUI during and after personnel actions such as terminations and transfers.',
    },
  ),

  // Level 3 — NIST SP 800-172
  'PS.L3-3.9.2e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PS_L3_3_9_2e',
    {
      defaultMessage:
        'Protect organizational systems when adverse information develops or is obtained about individuals with access to CUI.',
    },
  ),

  // ── Physical Protection (PE) ────────────────────────────────────────────────

  // Level 1 — FAR Clause 52.204-21
  'PE.L1-b.1.ix': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L1_b_1_ix',
    {
      defaultMessage:
        'Escort visitors and monitor visitor activity; maintain audit logs of physical access; and control and manage physical access devices.',
    },
  ),
  'PE.L1-b.1.viii': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L1_b_1_viii',
    {
      defaultMessage:
        'Limit physical access to organizational information systems, equipment, and the respective operating environments to authorized individuals.',
    },
  ),

  // Level 2 — NIST SP 800-171 Rev 2
  'PE.L2-3.10.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L2_3_10_1',
    {
      defaultMessage:
        'Limit physical access to organizational systems, equipment, and the respective operating environments to authorized individuals.',
    },
  ),
  'PE.L2-3.10.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L2_3_10_2',
    {
      defaultMessage:
        'Protect and monitor the physical facility and support infrastructure for organizational systems.',
    },
  ),
  'PE.L2-3.10.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L2_3_10_3',
    { defaultMessage: 'Escort visitors and monitor visitor activity.' },
  ),
  'PE.L2-3.10.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L2_3_10_4',
    { defaultMessage: 'Maintain audit logs of physical access.' },
  ),
  'PE.L2-3.10.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L2_3_10_5',
    { defaultMessage: 'Control and manage physical access devices.' },
  ),
  'PE.L2-3.10.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.PE_L2_3_10_6',
    {
      defaultMessage:
        'Enforce safeguarding measures for CUI at alternate work sites.',
    },
  ),

  // ── Risk Assessment (RA) ────────────────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'RA.L2-3.11.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L2_3_11_1',
    {
      defaultMessage:
        'Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational systems and the associated processing, storage, or transmission of CUI.',
    },
  ),
  'RA.L2-3.11.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L2_3_11_2',
    {
      defaultMessage:
        'Scan for vulnerabilities in organizational systems and applications periodically and when new vulnerabilities affecting those systems and applications are identified.',
    },
  ),
  'RA.L2-3.11.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L2_3_11_3',
    {
      defaultMessage:
        'Remediate vulnerabilities in accordance with risk assessments.',
    },
  ),

  // Level 3 — NIST SP 800-172
  'RA.L3-3.11.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_1e',
    {
      defaultMessage:
        'Employ threat intelligence, at a minimum from open or commercial sources, and any DoD-provided sources, as part of a risk assessment to guide and inform the development of organizational systems, security architectures, selection of security solutions, monitoring, threat hunting, and response and recovery activities.',
    },
  ),
  'RA.L3-3.11.2e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_2e',
    {
      defaultMessage:
        'Conduct cyber threat hunting activities on an on-going aperiodic basis or when indications warrant, to search for indicators of compromise in organizational systems and detect, track, and disrupt threats that evade existing controls.',
    },
  ),
  'RA.L3-3.11.3e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_3e',
    {
      defaultMessage:
        'Employ advanced automation and analytics capabilities in support of analysts to predict and identify risks to organizations, systems, and system components.',
    },
  ),
  'RA.L3-3.11.4e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_4e',
    {
      defaultMessage:
        'Document or reference in the system security plan the security solution selected, the rationale for the security solution, and the risk determination.',
    },
  ),
  'RA.L3-3.11.5e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_5e',
    {
      defaultMessage:
        'Assess the effectiveness of security solutions at least annually or upon receipt of relevant cyber threat information, or in response to a relevant cyber incident, to address anticipated risk to organizational systems and the organization based on current and accumulated threat intelligence.',
    },
  ),
  'RA.L3-3.11.6e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_6e',
    {
      defaultMessage:
        'Assess, respond to, and monitor supply chain risks associated with organizational systems and system components.',
    },
  ),
  'RA.L3-3.11.7e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.RA_L3_3_11_7e',
    {
      defaultMessage:
        'Develop a plan for managing supply chain risks associated with organizational systems and system components; update the plan at least annually, and upon receipt of relevant cyber threat information, or in response to a relevant cyber incident.',
    },
  ),

  // ── Security Assessment (CA) ────────────────────────────────────────────────

  // Level 2 — NIST SP 800-171 Rev 2
  'CA.L2-3.12.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CA_L2_3_12_1',
    {
      defaultMessage:
        'Periodically assess the security controls in organizational systems to determine if the controls are effective in their application.',
    },
  ),
  'CA.L2-3.12.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CA_L2_3_12_2',
    {
      defaultMessage:
        'Develop and implement plans of action designed to correct deficiencies and reduce or eliminate vulnerabilities in organizational systems.',
    },
  ),
  'CA.L2-3.12.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CA_L2_3_12_3',
    {
      defaultMessage:
        'Monitor security controls on an ongoing basis to determine the continued effectiveness of the controls.',
    },
  ),
  'CA.L2-3.12.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CA_L2_3_12_4',
    {
      defaultMessage:
        'Develop, document, and periodically update system security plans that describe system boundaries, system environments of operation, how security requirements are implemented, and the relationships with or connections to other systems.',
    },
  ),

  // Level 3 — NIST SP 800-172
  'CA.L3-3.12.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.CA_L3_3_12_1e',
    {
      defaultMessage:
        'Conduct penetration testing at least annually or when significant security changes are made to the system, leveraging automated scanning tools and ad hoc tests using subject matter experts.',
    },
  ),

  // ── System and Communications Protection (SC) ───────────────────────────────

  // Level 1 — FAR Clause 52.204-21
  'SC.L1-3.13.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L1_3_13_1',
    {
      defaultMessage:
        'Monitor, control, and protect organizational communications (i.e., information transmitted or received by organizational information systems) at the external boundaries and key internal boundaries of the information systems.',
    },
  ),
  'SC.L1-3.13.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L1_3_13_8',
    {
      defaultMessage:
        'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.',
    },
  ),
  'SC.L1-b.1.x': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L1_b_1_x',
    {
      defaultMessage:
        'Monitor, control, and protect organizational communications (i.e., information transmitted or received by organizational information systems) at the external boundaries and key internal boundaries of the information systems.',
    },
  ),
  'SC.L1-b.1.xi': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L1_b_1_xi',
    {
      defaultMessage:
        'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.',
    },
  ),

  // Level 2 — NIST SP 800-171 Rev 2
  'SC.L2-3.13.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_1',
    {
      defaultMessage:
        'Monitor, control, and protect organizational communications (i.e., information transmitted or received by organizational information systems) at the external boundaries and key internal boundaries of the information systems.',
    },
  ),
  'SC.L2-3.13.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_2',
    {
      defaultMessage:
        'Employ architectural designs, software development techniques, and systems engineering principles that promote effective information security within organizational systems.',
    },
  ),
  'SC.L2-3.13.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_3',
    {
      defaultMessage:
        'Separate user functionality from system management functionality.',
    },
  ),
  'SC.L2-3.13.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_4',
    {
      defaultMessage:
        'Prevent unauthorized and unintended information transfer via shared system resources.',
    },
  ),
  'SC.L2-3.13.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_5',
    {
      defaultMessage:
        'Implement subnetworks for publicly accessible system components that are physically or logically separated from internal networks.',
    },
  ),
  'SC.L2-3.13.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_6',
    {
      defaultMessage:
        'Deny network communications traffic by default and allow network communications traffic by exception (i.e., deny all, permit by exception).',
    },
  ),
  'SC.L2-3.13.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_7',
    {
      defaultMessage:
        'Prevent remote devices from simultaneously establishing non-remote connections with organizational systems and communicating via some other connection to resources in external networks (i.e., split tunneling).',
    },
  ),
  'SC.L2-3.13.8': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_8',
    {
      defaultMessage:
        'Implement cryptographic mechanisms to prevent unauthorized disclosure of CUI during transmission unless otherwise protected by alternative physical safeguards.',
    },
  ),
  'SC.L2-3.13.9': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_9',
    {
      defaultMessage:
        'Terminate network connections associated with communications sessions at the end of the sessions or after a defined period of inactivity.',
    },
  ),
  'SC.L2-3.13.10': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_10',
    {
      defaultMessage:
        'Establish and manage cryptographic keys for cryptography employed in organizational systems.',
    },
  ),
  'SC.L2-3.13.11': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_11',
    {
      defaultMessage:
        'Employ FIPS-validated cryptography when used to protect the confidentiality of CUI.',
    },
  ),
  'SC.L2-3.13.12': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_12',
    {
      defaultMessage:
        'Prohibit remote activation of collaborative computing devices and provide indication of devices in use to users present at the device.',
    },
  ),
  'SC.L2-3.13.13': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_13',
    { defaultMessage: 'Control and monitor the use of mobile code.' },
  ),
  'SC.L2-3.13.14': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_14',
    {
      defaultMessage:
        'Control and monitor the use of Voice over Internet Protocol (VoIP) technologies.',
    },
  ),
  'SC.L2-3.13.15': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_15',
    { defaultMessage: 'Protect the authenticity of communications sessions.' },
  ),
  'SC.L2-3.13.16': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L2_3_13_16',
    { defaultMessage: 'Protect the confidentiality of CUI at rest.' },
  ),

  // Level 3 — NIST SP 800-172
  'SC.L3-3.13.4e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SC_L3_3_13_4e',
    {
      defaultMessage:
        'Employ physical isolation techniques or logical isolation techniques or both in organizational systems and system components.',
    },
  ),

  // ── System and Information Integrity (SI) ───────────────────────────────────

  // Level 1 — FAR Clause 52.204-21
  'SI.L1-b.1.xii': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L1_b_1_xii',
    {
      defaultMessage:
        'Identify, report, and correct information and information system flaws in a timely manner.',
    },
  ),
  'SI.L1-b.1.xiii': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L1_b_1_xiii',
    {
      defaultMessage:
        'Provide protection from malicious code at appropriate locations within organizational information systems.',
    },
  ),
  'SI.L1-b.1.xiv': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L1_b_1_xiv',
    {
      defaultMessage:
        'Update malicious code protection mechanisms when new releases are available.',
    },
  ),
  'SI.L1-b.1.xv': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L1_b_1_xv',
    {
      defaultMessage:
        'Perform periodic scans of the information system and real-time scans of files from external sources as files are downloaded, opened, or executed.',
    },
  ),

  // Level 2 — NIST SP 800-171 Rev 2
  'SI.L2-3.14.1': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_1',
    {
      defaultMessage:
        'Identify, report, and correct system flaws in a timely manner.',
    },
  ),
  'SI.L2-3.14.2': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_2',
    {
      defaultMessage:
        'Provide protection from malicious code at designated locations within organizational systems.',
    },
  ),
  'SI.L2-3.14.3': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_3',
    {
      defaultMessage:
        'Monitor system security alerts and advisories and take action in response.',
    },
  ),
  'SI.L2-3.14.4': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_4',
    {
      defaultMessage:
        'Update malicious code protection mechanisms when new releases are available.',
    },
  ),
  'SI.L2-3.14.5': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_5',
    {
      defaultMessage:
        'Perform periodic scans of organizational systems and real-time scans of files from external sources as files are downloaded, opened, or executed.',
    },
  ),
  'SI.L2-3.14.6': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_6',
    {
      defaultMessage:
        'Monitor organizational systems, including inbound and outbound communications traffic, to detect attacks and indicators of potential attacks.',
    },
  ),
  'SI.L2-3.14.7': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L2_3_14_7',
    { defaultMessage: 'Identify unauthorized use of organizational systems.' },
  ),

  // Level 3 — NIST SP 800-172
  'SI.L3-3.14.1e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L3_3_14_1e',
    {
      defaultMessage:
        'Verify the integrity of security critical and essential software using root of trust mechanisms or cryptographic signatures.',
    },
  ),
  'SI.L3-3.14.3e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L3_3_14_3e',
    {
      defaultMessage:
        'Include specialized assets such as IoT, IIoT, OT, GFE, Restricted Information Systems and test equipment in the scope of the specified enhanced security requirements or are segregated in purpose-specific networks.',
    },
  ),
  'SI.L3-3.14.6e': i18n.translate(
    'wazuh.complianceTable.cmmcRequirements.SI_L3_3_14_6e',
    {
      defaultMessage:
        'Use threat indicator information and effective mitigations obtained from, at a minimum, open or commercial sources, and any DoD-provided sources, to guide and inform intrusion detection and threat hunting.',
    },
  ),
};
