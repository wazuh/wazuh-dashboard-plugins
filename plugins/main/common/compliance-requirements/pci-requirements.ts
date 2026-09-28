/*
 * Wazuh app - Module for PCI DSS requirements
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
 * Framework: pci_dss
 * Catalog version: 1.0.0
 * Edition: v4.0.1
 * Source: PCI Security Standards Council, Payment Card Industry Data Security Standard: Requirements and Testing Procedures, v4.0.1, June 2024
 * Controls: 325
 */
import { i18n } from '@osd/i18n';
import { ComplianceRequirement } from './types';

export const pciRequirementsFile: Record<string, ComplianceRequirement> = {
  '1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1.title',
      { defaultMessage: 'Install and Maintain Network Security Controls' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1.description',
      {
        defaultMessage:
          'Network security controls are put in place and kept maintained.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2.title',
      {
        defaultMessage: 'Apply Secure Configurations to All System Components',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2.description',
      {
        defaultMessage:
          'Every system component is given a secure configuration.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3.title',
      { defaultMessage: 'Protect Stored Account Data' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3.description',
      { defaultMessage: 'Stored account data is kept protected.' },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4.title',
      {
        defaultMessage:
          'Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4.description',
      {
        defaultMessage:
          'When cardholder data travels over open, public networks, strong cryptography protects it.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5.title',
      {
        defaultMessage:
          'Protect All Systems and Networks from Malicious Software',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5.description',
      {
        defaultMessage:
          'Every system and every network is protected against malicious software.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6.title',
      { defaultMessage: 'Develop and Maintain Secure Systems and Software' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6.description',
      {
        defaultMessage:
          'Systems and software are built and kept up in a secure way.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7.title',
      {
        defaultMessage:
          'Restrict Access to System Components and Cardholder Data by Business Need to Know',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7.description',
      {
        defaultMessage:
          'Access to cardholder data and to system components is limited to business need to know.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8.title',
      {
        defaultMessage:
          'Identify Users and Authenticate Access to System Components',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8.description',
      {
        defaultMessage:
          'Users are identified, and their access to system components is authenticated.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '9': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9.title',
      { defaultMessage: 'Restrict Physical Access to Cardholder Data' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9.description',
      { defaultMessage: 'Physical access to cardholder data is limited.' },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '10': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10.title',
      {
        defaultMessage:
          'Log and Monitor All Access to System Components and Cardholder Data',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10.description',
      {
        defaultMessage:
          'Every access to cardholder data and to system components is logged and monitored.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '11': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11.title',
      { defaultMessage: 'Test Security of Systems and Networks Regularly' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11.description',
      {
        defaultMessage:
          'The security of systems and networks is tested on a regular basis.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '12': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12.title',
      {
        defaultMessage:
          'Support Information Security with Organizational Policies and Programs',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12.description',
      {
        defaultMessage:
          'Organizational policies and programs back up information security.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_1.title',
      { defaultMessage: 'Network security control processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how network security controls are installed and kept in good order, and they are defined and understood.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_1_1.title',
      { defaultMessage: 'Requirement 1 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 1 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_1_2.title',
      { defaultMessage: 'Requirement 1 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 1 activities are written down, assigned, and understood.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2.title',
      { defaultMessage: 'Network security control configuration' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2.description',
      {
        defaultMessage:
          'The configuration of network security controls (NSCs) is set and maintained over time.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_1.title',
      { defaultMessage: 'NSC ruleset configuration standards' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_1.description',
      {
        defaultMessage:
          'Standards that say how NSC rulesets must be configured exist, are applied, and are kept up to date.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_2.title',
      { defaultMessage: 'Change control for network connections and NSCs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_2.description',
      {
        defaultMessage:
          'Every change to network connections or to NSC configurations is approved and handled through the change control process of Requirement 6.5.1.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_3.title',
      { defaultMessage: 'Network diagram' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_3.description',
      {
        defaultMessage:
          'One or more accurate network diagrams are kept current and show every link from the CDE to other networks, including wireless ones.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_4.title',
      { defaultMessage: 'Data-flow diagram' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_4.description',
      {
        defaultMessage:
          'One or more accurate data-flow diagrams are kept that show all flows of account data across systems and networks. The diagrams are updated as needed when the environment changes.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_5.title',
      { defaultMessage: 'Allowed services, protocols and ports' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_5.description',
      {
        defaultMessage:
          'Every service, protocol and port that is permitted is listed, approved, and backed by a defined business need.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_6.title',
      { defaultMessage: 'Security features for insecure services' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_6.description',
      {
        defaultMessage:
          'For each insecure service, protocol or port in use, security features are defined and applied so that its risk is reduced.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_7.title',
      { defaultMessage: 'Periodic review of NSC configurations' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_7.description',
      {
        defaultMessage:
          'NSC configurations are reviewed at least every six months to confirm that they are still relevant and working as intended.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.2.8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_8.title',
      { defaultMessage: 'Protection of NSC configuration files' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_2_8.description',
      {
        defaultMessage:
          'NSC configuration files are protected against unauthorized access and kept in line with the network configurations that are actually running.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3.title',
      { defaultMessage: 'Limits on network access into and out of the CDE' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3.description',
      {
        defaultMessage:
          'Network access into and out of the cardholder data environment is limited.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3_1.title',
      { defaultMessage: 'Inbound traffic to the CDE' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3_1.description',
      {
        defaultMessage:
          'Traffic coming into the CDE is limited to what is needed, and all other inbound traffic is explicitly blocked.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3_2.title',
      { defaultMessage: 'Outbound traffic from the CDE' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3_2.description',
      {
        defaultMessage:
          'Traffic leaving the CDE is limited to what is needed, and all other outbound traffic is explicitly blocked.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3_3.title',
      { defaultMessage: 'NSCs between wireless networks and the CDE' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_3_3.description',
      {
        defaultMessage:
          'NSCs sit between every wireless network and the CDE, even when the wireless network is part of the CDE. Wireless traffic toward the CDE is blocked unless allowed, and only traffic that serves an approved business purpose gets through.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4.title',
      { defaultMessage: 'Controls between trusted and untrusted networks' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4.description',
      {
        defaultMessage:
          'Connections between trusted networks and untrusted networks are kept under control.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_1.title',
      { defaultMessage: 'NSCs between trusted and untrusted networks' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_1.description',
      {
        defaultMessage:
          'Network security controls are placed between trusted networks and untrusted networks.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_2.title',
      { defaultMessage: 'Inbound traffic from untrusted networks' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_2.description',
      {
        defaultMessage:
          'Traffic from untrusted networks into trusted networks is allowed only to reach components authorized to offer public services, protocols and ports, or as stateful replies to connections started inside the trusted network. Everything else is denied.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_3.title',
      { defaultMessage: 'Anti-spoofing measures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_3.description',
      {
        defaultMessage:
          'Measures against spoofing find packets with forged source IP addresses and stop them from getting into the trusted network.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.4.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_4.title',
      {
        defaultMessage: 'No direct untrusted access to stored cardholder data',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_4.description',
      {
        defaultMessage:
          'Components that hold cardholder data cannot be reached directly from untrusted networks.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.4.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_5.title',
      { defaultMessage: 'Limited disclosure of internal addressing' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_4_5.description',
      {
        defaultMessage:
          'Details about internal IP addressing and network routing are shared only with parties that are authorized to receive them.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_5.title',
      { defaultMessage: 'Dual-connected computing devices' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_5.description',
      {
        defaultMessage:
          'Risks that computing devices bring to the CDE when they can connect both to untrusted networks and to the CDE are reduced.',
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '1.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_5_1.title',
      { defaultMessage: 'Security controls on dual-connected devices' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req1_5_1.description',
      {
        defaultMessage:
          "Any computing device, company-owned or employee-owned, that connects to both untrusted networks (the Internet included) and the CDE has security controls with defined configuration settings that stop threats from getting into the entity's network. The controls stay active. Users of the device cannot alter them unless management documents and authorizes this case by case for a limited period.",
      },
    ),
    category: 'Requirement 1: Install and Maintain Network Security Controls',
  },
  '2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_1.title',
      { defaultMessage: 'Secure configuration processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how secure configurations are applied to every system component, and they are defined and understood.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_1_1.title',
      { defaultMessage: 'Requirement 2 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 2 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_1_2.title',
      { defaultMessage: 'Requirement 2 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 2 activities are written down, assigned, and understood.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2.title',
      {
        defaultMessage:
          'Secure configuration and management of system components',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2.description',
      {
        defaultMessage:
          'System components are set up and administered in a secure way.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_1.title',
      { defaultMessage: 'System configuration standards' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_1.description',
      {
        defaultMessage:
          'Configuration standards are written, applied and maintained. They cover every system component, address all known vulnerabilities, follow industry hardening standards or vendor hardening advice, are updated as new vulnerabilities are found (Requirement 6.3.1), and are applied and checked when a new system is set up, before or right after it joins production.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_2.title',
      { defaultMessage: 'Vendor default accounts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_2.description',
      {
        defaultMessage:
          'If a vendor default account will be used, its default password is changed as Requirement 8.3.6 describes. If the account will stay unused, it is deleted or disabled.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_3.title',
      { defaultMessage: 'Primary functions with different security levels' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_3.description',
      {
        defaultMessage:
          'Primary functions that need different security levels are handled in one of three ways: one primary function per system component, isolation of functions that share a component, or securing all functions on a component to the level of the most demanding one.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_4.title',
      { defaultMessage: 'Only necessary functionality enabled' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_4.description',
      {
        defaultMessage:
          'Only the services, protocols, daemons and functions that are needed are enabled. All other functionality is removed or disabled.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_5.title',
      { defaultMessage: 'Insecure services, protocols and daemons' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_5.description',
      {
        defaultMessage:
          'When any insecure service, protocol or daemon exists on a system, the business reason for it is documented, and extra security features that lower the risk of using it are documented and applied.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_6.title',
      { defaultMessage: 'System security parameters' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_6.description',
      {
        defaultMessage:
          'Security parameters on each system are configured in a way that prevents the system from being misused.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.2.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_7.title',
      { defaultMessage: 'Encrypted non-console administrative access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_2_7.description',
      {
        defaultMessage:
          'Every form of administrative access that does not happen at the console is encrypted with strong cryptography.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_3.title',
      { defaultMessage: 'Secure wireless environments' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_3.description',
      {
        defaultMessage:
          'Wireless environments are set up and administered securely.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_3_1.title',
      { defaultMessage: 'Wireless vendor defaults' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_3_1.description',
      {
        defaultMessage:
          'For wireless environments that connect to the CDE or carry account data, every wireless vendor default is changed at installation or confirmed as secure. This includes default encryption keys, access point passwords, SNMP defaults and any other security-related default.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '2.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_3_2.title',
      { defaultMessage: 'Wireless encryption key changes' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req2_3_2.description',
      {
        defaultMessage:
          'For wireless environments that connect to the CDE or carry account data, the encryption keys are changed when someone who knows a key leaves the company or the job that needed it, and when a key is suspected or known to be compromised.',
      },
    ),
    category:
      'Requirement 2: Apply Secure Configurations to All System Components',
  },
  '3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_1.title',
      { defaultMessage: 'Stored account data processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how stored account data is protected, and they are defined and understood.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_1_1.title',
      { defaultMessage: 'Requirement 3 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 3 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_1_2.title',
      { defaultMessage: 'Requirement 3 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 3 activities are written down, assigned, and understood.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_2.title',
      { defaultMessage: 'Minimal storage of account data' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_2.description',
      {
        defaultMessage:
          'The amount of stored account data is kept as low as possible.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_2_1.title',
      { defaultMessage: 'Data retention and disposal' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_2_1.description',
      {
        defaultMessage:
          'Policies, procedures and processes on retention and disposal minimize stored account data. They cover every location of stored account data and any SAD kept before authorization completes (a best practice only until its effective date), limit amount and retention time to legal, regulatory or business needs, and set specific retention rules defining the retention period, with a documented business justification. Data no longer needed under the retention policy is securely deleted or made unrecoverable, and at least every three months a process confirms this for data past its retention period.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3.title',
      { defaultMessage: 'No SAD storage after authorization' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3.description',
      {
        defaultMessage:
          'Sensitive authentication data (SAD) is never kept once authorization is complete.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1.title',
      { defaultMessage: 'SAD not retained after authorization' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1.description',
      {
        defaultMessage:
          'SAD is never kept after authorization, not even in encrypted form. All SAD that is received is made unrecoverable once the authorization process ends.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1_1.title',
      { defaultMessage: 'No storage of full track data' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1_1.description',
      {
        defaultMessage:
          'Complete track contents, for any track, are not kept after the authorization process ends.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1_2.title',
      { defaultMessage: 'No storage of the card verification code' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1_2.description',
      {
        defaultMessage:
          'No card verification code is kept after the authorization process ends.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1_3.title',
      { defaultMessage: 'No storage of the PIN or PIN block' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_1_3.description',
      {
        defaultMessage:
          'Neither the PIN nor the PIN block is kept after the authorization process ends.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_2.title',
      { defaultMessage: 'Encryption of SAD stored before authorization' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_2.description',
      {
        defaultMessage:
          'Any SAD that is stored electronically before authorization completes is encrypted with strong cryptography.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_3.title',
      { defaultMessage: 'SAD storage by issuers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_3_3.description',
      {
        defaultMessage:
          'For issuers, and companies supporting issuing services, that store SAD: any SAD stored is limited to what a legitimate issuing business need requires and is secured. It is also encrypted with strong cryptography (a best practice only until its effective date).',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_4.title',
      { defaultMessage: 'Restricted display and copying of PAN' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_4.description',
      {
        defaultMessage:
          'Viewing the full PAN and copying PAN are both restricted.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_4_1.title',
      { defaultMessage: 'PAN masking on display' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_4_1.description',
      {
        defaultMessage:
          'PAN is masked when shown, so that at most the BIN and the last four digits are visible. Only personnel who have a legitimate business need are able to view more digits.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_4_2.title',
      { defaultMessage: 'No PAN copy over remote access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_4_2.description',
      {
        defaultMessage:
          'When remote-access technologies are used, technical controls stop all personnel from copying or moving PAN. The only exception is people with explicit, documented permission and a defined, legitimate business reason.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5.title',
      { defaultMessage: 'PAN secured wherever stored' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5.description',
      {
        defaultMessage:
          'The primary account number (PAN) is protected in every place where it is stored.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1.title',
      { defaultMessage: 'PAN unreadable wherever stored' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1.description',
      {
        defaultMessage:
          'PAN is made unreadable wherever stored, using one-way strong-cryptography hashes of the whole PAN, truncation (hashing cannot replace the truncated part), index tokens, or strong cryptography with key-management processes and procedures. Where hashed and truncated versions, or different truncation formats, of one PAN exist, extra controls stop them from being correlated to rebuild the original PAN.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.5.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1_1.title',
      { defaultMessage: 'Keyed cryptographic hashes for PAN' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1_1.description',
      {
        defaultMessage:
          'Hashes that make PAN unreadable under the first option of Requirement 3.5.1 must be keyed cryptographic hashes that cover the whole PAN. Their keys are managed as Requirement 3.6 and Requirement 3.7 describe.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.5.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1_2.title',
      { defaultMessage: 'Limits on disk-level encryption for PAN' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1_2.description',
      {
        defaultMessage:
          'When PAN is made unreadable with disk or partition encryption (not file, column or field database encryption), that encryption is used only on removable electronic media, or on non-removable media only when PAN is also made unreadable by another method satisfying Requirement 3.5.1.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.5.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1_3.title',
      { defaultMessage: 'Management of disk-level encryption' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_5_1_3.description',
      {
        defaultMessage:
          "When disk or partition encryption protects PAN, logical access is managed apart from the operating system's own authentication and access control. Decryption keys are not tied to user accounts, and the authentication factors that unlock the data are stored securely.",
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6.title',
      { defaultMessage: 'Protection of cryptographic keys' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6.description',
      {
        defaultMessage:
          'Cryptographic keys that protect stored account data are kept secure.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1.title',
      { defaultMessage: 'Key protection procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1.description',
      {
        defaultMessage:
          'Defined procedures are in place that keep the keys securing stored account data from being disclosed or misused. Key access is limited to the fewest custodians needed. Key-encrypting keys are no weaker than the keys they protect and are kept apart from them, and keys are held securely in as few places and forms as possible.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.6.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_1.title',
      { defaultMessage: 'Documented cryptographic architecture' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_1.description',
      {
        defaultMessage:
          'For service providers only, a maintained document describes the cryptographic architecture. It details all algorithms, protocols and keys that protect stored account data, with key strength and expiry date, and describes how each key is used. It covers preventing the same keys from being used in both production and test (a best practice only until its effective date), and inventories any HSMs, KMS and other SCDs used for key management, with device type and location, in support of Requirement 12.3.4.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.6.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_2.title',
      { defaultMessage: 'Storage forms for secret and private keys' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_2.description',
      {
        defaultMessage:
          'Secret and private keys protecting stored account data are always kept in at least one of these forms: encrypted under a key-encrypting key no weaker than the data-encrypting key and stored apart from it; in a secure cryptographic device such as an HSM or PTS-approved POI device; or as two or more full-length components or shares, per an industry-accepted method.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.6.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_3.title',
      { defaultMessage: 'Limited access to cleartext key components' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_3.description',
      {
        defaultMessage:
          'Only the smallest number of custodians that is truly needed can access cleartext components of cryptographic keys.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.6.1.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_4.title',
      { defaultMessage: 'Fewest key storage locations' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_6_1_4.description',
      {
        defaultMessage:
          'Cryptographic keys are kept in as few locations as possible.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7.title',
      { defaultMessage: 'Key lifecycle management' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7.description',
      {
        defaultMessage:
          'Where stored account data is protected with cryptography, processes and procedures for managing keys through their whole lifecycle are defined and applied.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_1.title',
      { defaultMessage: 'Strong key generation' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_1.description',
      {
        defaultMessage:
          'Key-management policies and procedures in place cover the generation of strong keys for protecting stored account data.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_2.title',
      { defaultMessage: 'Secure key distribution' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_2.description',
      {
        defaultMessage:
          'Key-management policies and procedures in place cover distributing the keys that protect stored account data in a secure way.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_3.title',
      { defaultMessage: 'Secure key storage' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_3.description',
      {
        defaultMessage:
          'Key-management policies and procedures in place cover storing the keys that protect stored account data in a secure way.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_4.title',
      { defaultMessage: 'Key changes at end of cryptoperiod' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_4.description',
      {
        defaultMessage:
          'Key-management policies and procedures in place cover changing keys when their cryptoperiod ends, as set by the vendor or the key owner, following industry good practice and guidelines. Each key type in use has a defined cryptoperiod and a process for changing it when that period ends.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_5.title',
      { defaultMessage: 'Key retirement, replacement or destruction' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_5.description',
      {
        defaultMessage:
          "Key-management policies and procedures in place cover retiring, replacing or destroying keys that protect stored account data, as needed: when a key's defined cryptoperiod ends; when its integrity is weakened, including when someone knowing a cleartext component exits the company or the role needing it; or on suspected or known compromise. Retired or replaced keys are never used for encryption.",
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_6.title',
      { defaultMessage: 'Split knowledge and dual control' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_6.description',
      {
        defaultMessage:
          'Policies and procedures for key management are in place for manual cleartext key-management operations done by personnel, and they require split knowledge and dual control for those operations.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_7.title',
      { defaultMessage: 'Prevention of unauthorized key substitution' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_7.description',
      {
        defaultMessage:
          'Key-management policies and procedures in place prevent anyone from swapping in different cryptographic keys without being authorized to do so.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_8.title',
      { defaultMessage: 'Key custodian acknowledgment' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_8.description',
      {
        defaultMessage:
          'Key-management policies and procedures in place require key custodians to formally confirm, on paper or electronically, that they know and accept the duties that come with the custodian role.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '3.7.9': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_9.title',
      { defaultMessage: 'Key-sharing guidance for customers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req3_7_9.description',
      {
        defaultMessage:
          'For service providers only: when cryptographic keys are shared with customers for sending or storing account data, guidance on sending, storing and updating the keys securely is documented and given to those customers.',
      },
    ),
    category: 'Requirement 3: Protect Stored Account Data',
  },
  '4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_1.title',
      { defaultMessage: 'Transmission encryption processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how cardholder data is protected with strong cryptography when sent over open, public networks, and they are defined and understood.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_1_1.title',
      { defaultMessage: 'Requirement 4 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 4 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_1_2.title',
      { defaultMessage: 'Requirement 4 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 4 activities are written down, assigned, and understood.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2.title',
      { defaultMessage: 'PAN protected in transmission' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2.description',
      {
        defaultMessage:
          'Strong cryptography protects PAN whenever it is being transmitted.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_1.title',
      { defaultMessage: 'Strong cryptography for PAN in transit' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_1.description',
      {
        defaultMessage:
          'Strong cryptography and security protocols protect PAN over open, public networks. Untrusted keys and certificates are rejected; certificates are confirmed valid, unexpired and unrevoked (a best practice only until its effective date). Protocols allow only secure versions or configurations, cannot fall back to or use insecure algorithms, versions, implementations or key sizes, and encryption strength fits the method in use.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.2.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_1_1.title',
      { defaultMessage: 'Inventory of trusted keys and certificates' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_1_1.description',
      {
        defaultMessage:
          'An inventory is kept of the trusted keys and certificates that the entity uses to protect PAN in transit.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.2.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_1_2.title',
      { defaultMessage: 'Strong cryptography on wireless networks' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_1_2.description',
      {
        defaultMessage:
          'Wireless networks that carry PAN or connect to the CDE follow industry best practices to apply strong cryptography for both authentication and transmission.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '4.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_2.title',
      { defaultMessage: 'PAN in end-user messaging' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req4_2_2.description',
      {
        defaultMessage:
          'Whenever PAN is sent through end-user messaging technologies, it is protected with strong cryptography.',
      },
    ),
    category:
      'Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
  },
  '5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_1.title',
      { defaultMessage: 'Anti-malware processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how all systems and networks are protected from malware, and they are defined and understood.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_1_1.title',
      { defaultMessage: 'Requirement 5 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 5 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_1_2.title',
      { defaultMessage: 'Requirement 5 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 5 activities are written down, assigned, and understood.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2.title',
      { defaultMessage: 'Malware prevention and detection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2.description',
      {
        defaultMessage: 'Malware is prevented, or it is found and dealt with.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_1.title',
      { defaultMessage: 'Anti-malware deployment' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_1.description',
      {
        defaultMessage:
          'Anti-malware solutions run on every system component, except components that the periodic evaluations of Requirement 5.2.3 show face no malware risk.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_2.title',
      { defaultMessage: 'Anti-malware capabilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_2.description',
      {
        defaultMessage:
          'The anti-malware solution detects every known type of malware and removes, blocks or contains it.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_3.title',
      { defaultMessage: 'Evaluation of components not at risk from malware' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_3.description',
      {
        defaultMessage:
          'Components considered not at risk from malware are evaluated periodically. The evaluation keeps a documented list of them, reviews new malware threats against them, and confirms whether they still need no anti-malware protection.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.2.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_3_1.title',
      { defaultMessage: 'Frequency of not-at-risk evaluations' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_2_3_1.description',
      {
        defaultMessage:
          'How often components not at risk from malware are re-evaluated is set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3.title',
      { defaultMessage: 'Active and maintained anti-malware' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3.description',
      {
        defaultMessage:
          'Anti-malware mechanisms and processes stay active, are kept up to date, and are monitored.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_1.title',
      { defaultMessage: 'Automatic anti-malware updates' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_1.description',
      {
        defaultMessage:
          'The anti-malware solution stays current through automatic updates.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_2.title',
      { defaultMessage: 'Anti-malware scanning' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_2.description',
      {
        defaultMessage:
          'The anti-malware solution either runs periodic scans along with active scans or real-time scans, or it continuously analyzes the behavior of systems or processes.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_2_1.title',
      { defaultMessage: 'Frequency of periodic malware scans' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_2_1.description',
      {
        defaultMessage:
          'When periodic scans are used for Requirement 5.3.2, their frequency is set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_3.title',
      { defaultMessage: 'Anti-malware for removable media' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_3.description',
      {
        defaultMessage:
          'When removable media is plugged in, connected or mounted, the anti-malware solution scans it automatically or continuously analyzes the behavior of systems or processes.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_4.title',
      { defaultMessage: 'Anti-malware audit logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_4.description',
      {
        defaultMessage:
          'Audit logs of the anti-malware solution are turned on and kept as Requirement 10.5.1 describes.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.3.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_5.title',
      { defaultMessage: 'Anti-malware tamper protection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_3_5.description',
      {
        defaultMessage:
          'Users cannot turn off or change anti-malware mechanisms, unless management documents and authorizes it case by case for a limited time.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_4.title',
      { defaultMessage: 'Anti-phishing mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_4.description',
      {
        defaultMessage:
          'Mechanisms are in place that protect users from phishing attacks.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '5.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_4_1.title',
      { defaultMessage: 'Phishing detection and protection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req5_4_1.description',
      {
        defaultMessage:
          'Phishing attacks are detected, and personnel are protected from them, by processes and automated mechanisms in place.',
      },
    ),
    category:
      'Requirement 5: Protect All Systems and Networks from Malicious Software',
  },
  '6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_1.title',
      {
        defaultMessage: 'Secure systems and software processes and mechanisms',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how secure systems and software are developed and maintained, and they are defined and understood.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_1_1.title',
      { defaultMessage: 'Requirement 6 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 6 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_1_2.title',
      { defaultMessage: 'Requirement 6 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 6 activities are written down, assigned, and understood.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2.title',
      { defaultMessage: 'Secure development of bespoke and custom software' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2.description',
      {
        defaultMessage: 'Bespoke and custom software is built in a secure way.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_1.title',
      { defaultMessage: 'Secure software development' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_1.description',
      {
        defaultMessage:
          'Bespoke and custom software is built following industry standards or good practice for secure development, in line with PCI DSS (secure authentication and logging, for example), with security considered at every stage of the development lifecycle.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_2.title',
      { defaultMessage: 'Secure development training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_2.description',
      {
        defaultMessage:
          'Developers of bespoke and custom software get training at least every 12 months on software security for their role and languages, secure design and secure coding, and on any security testing tools they use to find vulnerabilities.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_3.title',
      { defaultMessage: 'Code review before release' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_3.description',
      {
        defaultMessage:
          'Before bespoke and custom software goes to production or to customers, code is reviewed against secure coding guidelines, checked for existing and emerging vulnerabilities, and fixed as needed before release.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.2.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_3_1.title',
      { defaultMessage: 'Manual code review' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_3_1.description',
      {
        defaultMessage:
          'When manual code reviews are done for bespoke and custom software before release to production, the code changes are reviewed by someone other than the author who knows code-review methods and secure coding practices. Management reviews and approves the changes before release.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.2.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_4.title',
      { defaultMessage: 'Secure software engineering techniques' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_2_4.description',
      {
        defaultMessage:
          'Software development personnel define and use engineering techniques or other methods to prevent or reduce common attacks, and linked vulnerabilities, in custom and bespoke software. The attacks covered include, among others, injection flaws such as SQL, LDAP or XPath injection; attacks on data or its structures, such as on buffers, pointers and shared data; misuse of weak or inappropriate cryptography; abuse or bypass of business logic, including XSS and CSRF; attacks on identification, authentication or authorization mechanisms; and any high-risk vulnerabilities found by the Requirement 6.3.1 process.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3.title',
      { defaultMessage: 'Vulnerability identification and handling' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3.description',
      { defaultMessage: 'Security vulnerabilities are found and dealt with.' },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3_1.title',
      { defaultMessage: 'Vulnerability identification and risk ranking' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3_1.description',
      {
        defaultMessage:
          'New vulnerabilities are found through recognized industry sources, CERT alerts included, and ranked by risk using industry practice and potential impact. Rankings flag at least all high-risk and critical vulnerabilities, and cover bespoke, custom and third-party software such as operating systems and databases.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3_2.title',
      { defaultMessage: 'Software inventory' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3_2.description',
      {
        defaultMessage:
          'An inventory covers bespoke and custom software and any third-party components built into it, and is kept to support vulnerability and patch management.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3_3.title',
      { defaultMessage: 'Security patching' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_3_3.description',
      {
        defaultMessage:
          'All system components get applicable security patches. Patches for critical vulnerabilities, per the Requirement 6.3.1 ranking, go in within one month of release. Other patches go in within a time frame the entity sets from its assessment of the risk.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4.title',
      { defaultMessage: 'Protection of public-facing web applications' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4.description',
      {
        defaultMessage:
          'Web applications that are exposed to the public are protected from attacks.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4_1.title',
      {
        defaultMessage: 'Ongoing protection of public-facing web applications',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4_1.description',
      {
        defaultMessage:
          'Public-facing web applications get ongoing handling of new threats and vulnerabilities and protection from known attacks. Either application security specialists review them with manual or automated tools or methods, at least every 12 months and after each significant change, covering at least all common software attacks of 6.2.4, with all vulnerabilities ranked per 6.3.1 and corrected, then the application re-evaluated. Or an automated solution in front of them continually detects and stops web-based attacks, runs, stays current as applicable, generates audit logs, and blocks attacks or alerts for immediate investigation.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4_2.title',
      { defaultMessage: 'Automated web attack prevention' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4_2.description',
      {
        defaultMessage:
          'An automated technical solution placed before each public-facing web application continually detects and stops web-based attacks. It stays running and, as applicable, up to date, produces audit logs, and either blocks attacks or raises an alert that is investigated at once.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4_3.title',
      { defaultMessage: 'Payment page script management' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_4_3.description',
      {
        defaultMessage:
          "Every payment page script loaded and run in the consumer's browser is confirmed as authorized and has its integrity assured. An inventory of all such scripts is kept with a written business or technical reason for each one.",
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5.title',
      { defaultMessage: 'Secure change management' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5.description',
      {
        defaultMessage:
          'Changes to every system component are handled securely.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_1.title',
      { defaultMessage: 'Change control procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_1.description',
      {
        defaultMessage:
          'Production changes to all system components follow set procedures that record the reason and description, the security impact, and documented approval by authorized parties. Changes are tested so they do not harm system security, and every bespoke and custom software update is tested against Requirement 6.2.4 before deployment. Procedures handle failed changes and bring systems back to a secure state.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_2.title',
      { defaultMessage: 'Confirmation after significant change' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_2.description',
      {
        defaultMessage:
          'After a significant change, all relevant PCI DSS requirements are confirmed as in place on every new or changed system and network, and documentation is updated where needed.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_3.title',
      { defaultMessage: 'Separation of pre-production and production' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_3.description',
      {
        defaultMessage:
          'Pre-production environments are kept apart from production environments, and access controls enforce that separation.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_4.title',
      { defaultMessage: 'Separation of roles across environments' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_4.description',
      {
        defaultMessage:
          'Roles and functions are split between production and pre-production for accountability, so that a change reaches production only after it is reviewed and approved.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_5.title',
      { defaultMessage: 'No live PANs in pre-production' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_5.description',
      {
        defaultMessage:
          'Real PANs are never used in pre-production environments, unless those environments are inside the CDE and protected under all applicable PCI DSS requirements.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '6.5.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_6.title',
      { defaultMessage: 'Removal of test data and accounts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req6_5_6.description',
      {
        defaultMessage:
          'All test accounts and test data are deleted from system components before those systems go live in production.',
      },
    ),
    category: 'Requirement 6: Develop and Maintain Secure Systems and Software',
  },
  '7.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_1.title',
      { defaultMessage: 'Need-to-know access processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how access to cardholder data and to system components is limited to business need to know, and they are defined and understood.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_1_1.title',
      { defaultMessage: 'Requirement 7 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 7 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_1_2.title',
      { defaultMessage: 'Requirement 7 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 7 activities are written down, assigned, and understood.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2.title',
      { defaultMessage: 'Access definition and assignment' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2.description',
      {
        defaultMessage:
          'Who can access which system components and data is properly defined, and access is granted according to that definition.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_1.title',
      { defaultMessage: 'Access control model' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_1.description',
      {
        defaultMessage:
          "A defined access control model grants access that fits what the business and its users need, is based on each user's job classification and function, and gives only the least privileges the job requires.",
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_2.title',
      { defaultMessage: 'Access assignment by job and least privilege' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_2.description',
      {
        defaultMessage:
          'Users, privileged users included, get access based on their job classification and function and on the least privileges their duties need.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_3.title',
      { defaultMessage: 'Approval of privileges' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_3.description',
      {
        defaultMessage: 'Authorized personnel approve each required privilege.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_4.title',
      { defaultMessage: 'Review of user accounts and access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_4.description',
      {
        defaultMessage:
          'All user accounts and their privileges, third-party and vendor accounts included, are reviewed at least every six months to confirm access still fits each job. Inappropriate access is corrected, and management confirms that access remains appropriate.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_5.title',
      { defaultMessage: 'Application and system account privileges' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_5.description',
      {
        defaultMessage:
          'Application and system accounts get only the least privileges needed for the system or application to work, and each account can reach only the specific systems, applications or processes that require it.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_5_1.title',
      { defaultMessage: 'Review of application and system account access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_5_1.description',
      {
        defaultMessage:
          'All access that application and system accounts hold, with the related privileges, is reviewed periodically, at a frequency set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1, to confirm it still fits the function. Inappropriate access is corrected, and management confirms that access remains appropriate.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.2.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_6.title',
      { defaultMessage: 'Restricted queries of stored cardholder data' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_2_6.description',
      {
        defaultMessage:
          'Users reach stored cardholder data only through applications or other programmatic means, with their actions limited by role and least privilege. Only the responsible administrators can access or query the data stores directly.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3.title',
      { defaultMessage: 'Access control systems' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3.description',
      {
        defaultMessage:
          'Access to system components and their data is managed through one or more access control systems.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3_1.title',
      { defaultMessage: 'Need-to-know access control system' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3_1.description',
      {
        defaultMessage:
          "An access control system covers every system component and limits access based on each user's need to know.",
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3_2.title',
      { defaultMessage: 'Enforcement of assigned permissions' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3_2.description',
      {
        defaultMessage:
          'The access control system enforces the permissions given to people, applications and systems according to their job classification and function.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '7.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3_3.title',
      { defaultMessage: 'Default deny-all' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req7_3_3.description',
      {
        defaultMessage:
          'The access control system is set to deny all access by default.',
      },
    ),
    category:
      'Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know',
  },
  '8.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_1.title',
      {
        defaultMessage:
          'User identification and authentication processes and mechanisms',
      },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how users are identified and their access to system components is authenticated, and they are defined and understood.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_1_1.title',
      { defaultMessage: 'Requirement 8 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 8 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_1_2.title',
      { defaultMessage: 'Requirement 8 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 8 activities are written down, assigned, and understood.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2.title',
      { defaultMessage: 'User identification and account lifecycle' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2.description',
      {
        defaultMessage:
          'IDs and accounts of users and administrators are tightly controlled from the moment they are created until they are removed.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_1.title',
      { defaultMessage: 'Unique user IDs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_1.description',
      {
        defaultMessage:
          'Each user gets a unique ID before being allowed to reach any system component or any cardholder data.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_2.title',
      { defaultMessage: 'Shared and generic IDs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_2.description',
      {
        defaultMessage:
          'Group, shared or generic IDs and other shared credentials are used only by exception when truly needed. Such use is blocked by default, limited in time, justified in writing and approved by management, the individual is identified before access, and every action traces back to one person.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_3.title',
      { defaultMessage: 'Unique factors per customer for service providers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_3.description',
      {
        defaultMessage:
          'Service providers that can remotely reach customer premises use a separate set of authentication factors for every customer premises they access.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_4.title',
      { defaultMessage: 'Management of user IDs and factors' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_4.description',
      {
        defaultMessage:
          'Creating, deleting and changing user IDs, credentials and other identifier objects needs proper approval, and each change grants only the privileges written in that approval.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_5.title',
      { defaultMessage: 'Revocation for terminated users' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_5.description',
      { defaultMessage: 'Terminated users lose their access immediately.' },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_6.title',
      { defaultMessage: 'Inactive accounts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_6.description',
      {
        defaultMessage:
          'User accounts that have been inactive for 90 days are removed or disabled.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_7.title',
      { defaultMessage: 'Third-party remote access accounts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_7.description',
      {
        defaultMessage:
          'Accounts that third parties use to reach, support or maintain system components remotely are enabled only for the time needed and disabled otherwise. Their use is watched for any unexpected activity.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.2.8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_8.title',
      { defaultMessage: 'Idle session timeout' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_2_8.description',
      {
        defaultMessage:
          'When a session stays inactive for over 15 minutes, the user has to authenticate again before the terminal or session can be used.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3.title',
      { defaultMessage: 'Strong user and administrator authentication' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3.description',
      {
        defaultMessage:
          'Strong authentication is put in place and managed for users and administrators.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_1.title',
      { defaultMessage: 'Authentication factors' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_1.description',
      {
        defaultMessage:
          'Every user and administrator access to system components is authenticated with at least one factor: something the user knows (password or passphrase), has (token or smart card) or is (biometric).',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_2.title',
      { defaultMessage: 'Protection of authentication factors' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_2.description',
      {
        defaultMessage:
          'Strong cryptography makes every authentication factor unreadable while it is sent and while it is stored, on all system components.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_3.title',
      { defaultMessage: 'Identity check before factor changes' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_3.description',
      {
        defaultMessage:
          'Before any authentication factor is changed, the identity of the user it belongs to is verified.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_4.title',
      { defaultMessage: 'Account lockout' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_4.description',
      {
        defaultMessage:
          'Failed authentication attempts are limited: the user ID is locked after at most 10 attempts, and stays locked for at least 30 minutes or until the identity of the user is confirmed.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_5.title',
      { defaultMessage: 'Initial and reset passwords' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_5.description',
      {
        defaultMessage:
          'When passwords or passphrases are used for Requirement 8.3.1, each user gets a unique value when first set and on every reset, and must change it right after the first use.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_6.title',
      { defaultMessage: 'Password complexity' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_6.description',
      {
        defaultMessage:
          'When passwords or passphrases serve as factors for Requirement 8.3.1, each one is at least 12 characters long (8 if the system cannot support 12) and contains both letters and numbers.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_7.title',
      { defaultMessage: 'Password history' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_7.description',
      {
        defaultMessage:
          'Users cannot set a new password or passphrase that matches any of their four most recent ones.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_8.title',
      { defaultMessage: 'Authentication guidance for users' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_8.description',
      {
        defaultMessage:
          'Authentication policies and procedures are written and given to all users. They explain how to choose strong factors and protect them, tell users not to reuse old passwords, and tell them to change a password they suspect or know is compromised and report the incident.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.9': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_9.title',
      { defaultMessage: 'Single-factor password rotation' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_9.description',
      {
        defaultMessage:
          'When a password or passphrase is the only factor for user access, it is either changed at least every 90 days, or account security posture is analyzed dynamically and access to resources is decided automatically in real time.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.10': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_10.title',
      { defaultMessage: 'Password guidance for customer users' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_10.description',
      {
        defaultMessage:
          'For service providers only: where customer users access cardholder data with a password or passphrase as the only factor, those customers get guidance on changing passwords periodically, and on when and in which situations to change them.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.10.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_10_1.title',
      { defaultMessage: 'Customer single-factor password rotation' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_10_1.description',
      {
        defaultMessage:
          'For service providers only: where customer users log in with a password or passphrase as the only factor, the password is either changed at least every 90 days, or account security posture is analyzed dynamically and access to resources is decided automatically in real time.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.3.11': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_11.title',
      { defaultMessage: 'Individual physical and logical tokens' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_3_11.description',
      {
        defaultMessage:
          'Where physical or logical tokens, smart cards or certificates serve as factors, each one is assigned to a single user and never shared. Physical or logical controls make sure nobody but that user can use it to gain access.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4.title',
      { defaultMessage: 'Multi-factor authentication into the CDE' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4.description',
      {
        defaultMessage:
          'Multi-factor authentication (MFA) is in place to protect access into the cardholder data environment.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4_1.title',
      { defaultMessage: 'MFA for administrative non-console access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4_1.description',
      {
        defaultMessage:
          'Personnel with administrative access must use MFA every time they access the CDE other than from the console.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4_2.title',
      { defaultMessage: 'MFA for all non-console CDE access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4_2.description',
      {
        defaultMessage:
          'MFA is required every time anyone accesses the CDE other than from the console, whatever their role.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4_3.title',
      { defaultMessage: 'MFA for remote access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_4_3.description',
      {
        defaultMessage:
          "MFA is required for all remote access that starts outside the entity's own network and could reach or affect the CDE.",
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_5.title',
      { defaultMessage: 'Secure MFA configuration' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_5.description',
      {
        defaultMessage:
          'MFA systems are configured so that they cannot be misused.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_5_1.title',
      { defaultMessage: 'MFA system requirements' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_5_1.description',
      {
        defaultMessage:
          'The MFA system is not open to replay attacks, and no user, administrators included, can bypass it unless an exception is specifically documented and approved by management for a limited time. It uses at least two different factor types and grants access only after all factors succeed.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6.title',
      { defaultMessage: 'Management of application and system accounts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6.description',
      {
        defaultMessage:
          'Application and system accounts, and the authentication factors tied to them, are used only under tight control.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6_1.title',
      { defaultMessage: 'Interactive login with system accounts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6_1.description',
      {
        defaultMessage:
          'If system or application accounts can log in interactively, such use is blocked by default and allowed only by exception. It is limited in time, justified in writing and approved by management, the person is identified before access, and every action traces back to one person.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.6.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6_2.title',
      { defaultMessage: 'No hard-coded passwords' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6_2.description',
      {
        defaultMessage:
          'Passwords or passphrases of application or system accounts that allow interactive login are never written into scripts, configuration or property files, or custom and bespoke source code.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '8.6.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6_3.title',
      { defaultMessage: 'Protection of system account passwords' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req8_6_3.description',
      {
        defaultMessage:
          'Passwords or passphrases of application and system accounts are changed periodically, at a frequency set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1, and when compromise is suspected or confirmed. Their complexity matches how often they are changed.',
      },
    ),
    category:
      'Requirement 8: Identify Users and Authenticate Access to System Components',
  },
  '9.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_1.title',
      { defaultMessage: 'Physical access processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how physical access to cardholder data is restricted, and they are defined and understood.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_1_1.title',
      { defaultMessage: 'Requirement 9 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 9 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_1_2.title',
      { defaultMessage: 'Requirement 9 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 9 activities are written down, assigned, and understood.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2.title',
      { defaultMessage: 'Physical entry controls' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2.description',
      {
        defaultMessage:
          'Physical access controls govern who can enter facilities and reach systems that hold cardholder data.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_1.title',
      { defaultMessage: 'Facility entry controls' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_1.description',
      {
        defaultMessage:
          'Suitable entry controls at the facility limit who can physically reach the systems in the CDE.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.2.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_1_1.title',
      { defaultMessage: 'Monitoring of sensitive areas' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_1_1.description',
      {
        defaultMessage:
          'Cameras, access control mechanisms, or both, monitor each person entering and leaving sensitive areas in the CDE. The devices are protected against tampering and disabling, the collected data is reviewed and matched against other entries, and it is kept at least three months unless the law says otherwise.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_2.title',
      { defaultMessage: 'Public network jacks' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_2.description',
      {
        defaultMessage:
          'Physical or logical controls limit the use of network jacks in the facility that the public can reach.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_3.title',
      { defaultMessage: 'Physical access to network hardware' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_3.description',
      {
        defaultMessage:
          'Who can physically reach wireless access points, gateways, networking and communications hardware, and telecom lines in the facility is restricted.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.2.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_4.title',
      { defaultMessage: 'Locked consoles in sensitive areas' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_2_4.description',
      {
        defaultMessage:
          'Consoles in sensitive areas are locked when nobody is using them.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3.title',
      { defaultMessage: 'Personnel and visitor physical access' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3.description',
      {
        defaultMessage:
          'Physical access for staff and for visitors is authorized and managed.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_1.title',
      { defaultMessage: 'Personnel physical access procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_1.description',
      {
        defaultMessage:
          "Procedures authorize and manage staff physical access to the CDE. They cover identifying personnel, handling changes to a person's access needs, revoking identification, and making sure only authorized people can use the identification process or system.",
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.3.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_1_1.title',
      { defaultMessage: 'Personnel access to sensitive areas' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_1_1.description',
      {
        defaultMessage:
          "Staff access to sensitive areas in the CDE is authorized based on each person's job function. It is revoked at once on termination, and all keys, access cards and other access mechanisms are returned or disabled.",
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_2.title',
      { defaultMessage: 'Visitor access procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_2.description',
      {
        defaultMessage:
          'Procedures authorize and manage visitor access to the CDE. Visitors are authorized before they enter, escorted at all times, and given an expiring badge or other identification that clearly sets them apart from personnel.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_3.title',
      { defaultMessage: 'Return of visitor badges' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_3.description',
      {
        defaultMessage:
          'Visitors hand back their badge or identification, or it is deactivated, before they leave the facility or when it expires.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_4.title',
      { defaultMessage: 'Visitor logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_3_4.description',
      {
        defaultMessage:
          "A visitor log keeps a physical record of visits to the facility and to sensitive areas. It records the visitor's name and organization, the date and time, and who authorized the access, and it is kept at least three months unless the law says otherwise.",
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4.title',
      { defaultMessage: 'Secure handling of media' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4.description',
      {
        defaultMessage:
          'Media that holds cardholder data is stored, accessed, distributed and destroyed in a secure way.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_1.title',
      { defaultMessage: 'Physical security of media' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_1.description',
      {
        defaultMessage:
          'Every piece of media that holds cardholder data is kept physically secure.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_1_1.title',
      { defaultMessage: 'Offline media backups' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_1_1.description',
      {
        defaultMessage:
          'Offline backup media that holds cardholder data is kept in a location that is secure.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_1_2.title',
      { defaultMessage: 'Review of backup location security' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_1_2.description',
      {
        defaultMessage:
          'The security of each location that stores offline backup media with cardholder data is checked at least every 12 months.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_2.title',
      { defaultMessage: 'Media classification' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_2.description',
      {
        defaultMessage:
          'Every piece of media that holds cardholder data is classified according to how sensitive the data is.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_3.title',
      { defaultMessage: 'Media sent offsite' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_3.description',
      {
        defaultMessage:
          'Media with cardholder data that leaves the facility is logged and sent by secure courier or another delivery method that can be tracked accurately. The offsite tracking logs record where the media is.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_4.title',
      { defaultMessage: 'Management approval for media movement' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_4.description',
      {
        defaultMessage:
          'Management approves every movement of media with cardholder data out of the facility, including media handed out to individuals.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_5.title',
      { defaultMessage: 'Electronic media inventory logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_5.description',
      {
        defaultMessage:
          'Inventory logs are kept of every piece of electronic media that holds cardholder data.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_5_1.title',
      { defaultMessage: 'Electronic media inventory checks' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_5_1.description',
      {
        defaultMessage:
          'An inventory of the electronic media that holds cardholder data is carried out at least every 12 months.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_6.title',
      { defaultMessage: 'Destruction of hard-copy materials' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_6.description',
      {
        defaultMessage:
          'Paper records with cardholder data are destroyed once the business or the law no longer requires them, by cross-cut shredding, incineration or pulping so the data cannot be rebuilt. Until then they are kept in secure containers.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.4.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_7.title',
      { defaultMessage: 'Destruction of electronic media' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_4_7.description',
      {
        defaultMessage:
          'Once electronic media that holds cardholder data is no longer required for business or legal purposes, either the media is destroyed or the data on it is made unrecoverable so it cannot be rebuilt.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5.title',
      { defaultMessage: 'Protection of POI devices' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5.description',
      {
        defaultMessage:
          'Devices at the point of interaction (POI) are guarded against tampering and against being swapped without authorization.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1.title',
      { defaultMessage: 'POI device protection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1.description',
      {
        defaultMessage:
          'POI devices that read payment card data by direct physical contact with the card are guarded against tampering and unauthorized substitution. A list of the devices is kept, the devices are inspected periodically, and personnel are trained to spot suspicious behavior and report tampering or unauthorized substitution.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.5.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_1.title',
      { defaultMessage: 'POI device list' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_1.description',
      {
        defaultMessage:
          'A current list of POI devices is kept, with the make and model, location, and serial number or other unique identifier of each device.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.5.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_2.title',
      { defaultMessage: 'POI device inspections' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_2.description',
      {
        defaultMessage:
          'The surfaces of POI devices are inspected periodically to find signs of tampering or unauthorized substitution.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.5.1.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_2_1.title',
      { defaultMessage: 'Frequency of POI inspections' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_2_1.description',
      {
        defaultMessage:
          'How often POI devices are inspected, and what kind of inspection is done, is set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '9.5.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_3.title',
      { defaultMessage: 'POI tampering awareness training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req9_5_1_3.description',
      {
        defaultMessage:
          'Personnel in POI environments are trained to spot attempted tampering or replacement of devices. Training covers verifying third parties who say they are repair or maintenance staff before they modify or troubleshoot devices, verification before devices are installed, replaced or returned, noticing suspicious behavior around devices, and reporting to appropriate personnel that behavior and signs of tampering or substitution.',
      },
    ),
    category: 'Requirement 9: Restrict Physical Access to Cardholder Data',
  },
  '10.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_1.title',
      { defaultMessage: 'Logging and monitoring processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how every access to cardholder data and to system components is logged and monitored, and they are defined and understood.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_1_1.title',
      { defaultMessage: 'Requirement 10 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 10 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_1_2.title',
      { defaultMessage: 'Requirement 10 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 10 activities are written down, assigned, and understood.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2.title',
      { defaultMessage: 'Audit logging' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2.description',
      {
        defaultMessage:
          'Audit logs are in place to help detect anomalies and suspicious activity, and to support forensic analysis of events.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1.title',
      { defaultMessage: 'Audit logs enabled' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1.description',
      {
        defaultMessage:
          'Audit logging is turned on and running for every system component and for cardholder data.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_1.title',
      { defaultMessage: 'Logging of user access to cardholder data' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_1.description',
      {
        defaultMessage:
          'Audit logs record every access to cardholder data that an individual user makes.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_2.title',
      { defaultMessage: 'Logging of administrative actions' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_2.description',
      {
        defaultMessage:
          'Audit logs record every action taken by a person with administrative access, including each time they use an application or system account interactively.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_3.title',
      { defaultMessage: 'Logging of access to audit logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_3.description',
      {
        defaultMessage:
          'Audit logs record every access made to the audit logs themselves.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_4.title',
      { defaultMessage: 'Logging of invalid access attempts' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_4.description',
      {
        defaultMessage:
          'Audit logs record every logical access attempt that is invalid.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_5.title',
      { defaultMessage: 'Logging of credential changes' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_5.description',
      {
        defaultMessage:
          'Audit logs record every change to identification and authentication credentials. This includes new accounts, privilege elevation, and any addition, change or deletion of accounts with administrative access.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_6.title',
      { defaultMessage: 'Logging of audit log start and stop' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_6.description',
      {
        defaultMessage:
          'Audit logs record when new audit logs are initialized and when existing audit logs are started, stopped or paused.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.1.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_7.title',
      { defaultMessage: 'Logging of system-level objects' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_1_7.description',
      {
        defaultMessage:
          'Audit logs record every time an object at the system level is created or deleted.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_2.title',
      { defaultMessage: 'Audit log event details' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_2_2.description',
      {
        defaultMessage:
          'For each auditable event, the audit log records who did it, what type of event it was, when it happened, whether it succeeded or failed, where it came from, and the name or identity of the affected data, component, resource or service.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3.title',
      { defaultMessage: 'Audit log protection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3.description',
      {
        defaultMessage:
          'Audit logs are protected so that nobody can destroy them or change them without authorization.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_1.title',
      { defaultMessage: 'Read access to audit logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_1.description',
      {
        defaultMessage:
          'Only people whose job requires it are allowed to read audit log files.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_2.title',
      { defaultMessage: 'Protection of audit logs from changes' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_2.description',
      {
        defaultMessage:
          'Audit log files are protected so that no individual can change them.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_3.title',
      { defaultMessage: 'Central backup of audit logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_3.description',
      {
        defaultMessage:
          'Audit log files, those of external-facing technologies included, are backed up without delay to a secure log server that is internal and central, or to other media that is hard to modify.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_4.title',
      { defaultMessage: 'Integrity monitoring of audit logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_3_4.description',
      {
        defaultMessage:
          'File integrity monitoring or another change-detection mechanism runs on audit logs, so that any change to existing log data raises an alert.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4.title',
      { defaultMessage: 'Audit log review' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4.description',
      {
        defaultMessage:
          'Audit logs are reviewed to find anomalies or suspicious activity.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_1.title',
      { defaultMessage: 'Daily log review' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_1.description',
      {
        defaultMessage:
          'At least once a day, these audit logs are reviewed: all security events, and the logs of all components that handle CHD or SAD, of all critical components, and of all servers and components with security functions such as network security controls, IDS/IPS and authentication servers.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.4.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_1_1.title',
      { defaultMessage: 'Automated log review' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_1_1.description',
      {
        defaultMessage:
          'Audit log reviews are carried out with automated mechanisms.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_2.title',
      { defaultMessage: 'Periodic review of other logs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_2.description',
      {
        defaultMessage:
          'The logs of every other system component, meaning those that Requirement 10.4.1 does not cover, are also reviewed on a periodic basis.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.4.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_2_1.title',
      { defaultMessage: 'Frequency of other log reviews' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_2_1.description',
      {
        defaultMessage:
          'How often the logs of all other components (those outside Requirement 10.4.1) get reviewed is set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_3.title',
      { defaultMessage: 'Follow-up of review findings' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_4_3.description',
      {
        defaultMessage:
          'Exceptions and anomalies that the log review process uncovers are dealt with.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_5.title',
      { defaultMessage: 'Audit log retention' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_5.description',
      {
        defaultMessage:
          'The history of audit logs is kept and remains available for analysis.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_5_1.title',
      { defaultMessage: 'Audit log retention period' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_5_1.description',
      {
        defaultMessage:
          'Audit log history is kept for at least 12 months, and at least the last three months can be analyzed right away.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6.title',
      { defaultMessage: 'Time synchronization' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6.description',
      {
        defaultMessage:
          'Time-synchronization mechanisms keep time settings consistent across all systems.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6_1.title',
      { defaultMessage: 'Clock synchronization' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6_1.description',
      {
        defaultMessage:
          'System clocks and time are kept in sync by means of time-synchronization technology.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.6.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6_2.title',
      { defaultMessage: 'Correct and consistent system time' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6_2.description',
      {
        defaultMessage:
          'Systems keep correct and consistent time. Designated central time servers are the only ones that take time from external sources, based on TAI or UTC and only from specific industry-accepted sources. They peer with each other when there are several, and internal systems take time only from them.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.6.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6_3.title',
      { defaultMessage: 'Protection of time settings' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_6_3.description',
      {
        defaultMessage:
          'Access to time data is limited to personnel with a business need, and every change to the time configuration of critical systems is logged, monitored and reviewed.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7.title',
      { defaultMessage: 'Critical security control failures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7.description',
      {
        defaultMessage:
          'When a critical security control system fails, the failure is found, reported and handled without delay.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.7.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7_1.title',
      { defaultMessage: 'Control failure detection for service providers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7_1.description',
      {
        defaultMessage:
          'For service providers only: any failure of a critical security control system is promptly detected, alerted on and addressed. The systems include, among others, network security controls, IDS/IPS, file integrity monitoring, anti-malware, physical and logical access controls, audit logging, and segmentation controls if used.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.7.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7_2.title',
      { defaultMessage: 'Control failure detection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7_2.description',
      {
        defaultMessage:
          'Any failure of a critical security control is promptly detected, alerted on and fixed. The controls include network security controls, intrusion detection and prevention, change detection, anti-malware, physical and logical access controls, audit logging and log review, segmentation controls if used, and automated security testing if used.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '10.7.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7_3.title',
      { defaultMessage: 'Response to control failures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req10_7_3.description',
      {
        defaultMessage:
          'Any failure of a critical security control system is responded to promptly. The response includes, among other steps, restoring the function, documenting how long the failure lasted, its cause and the fix, handling security issues that arose meanwhile, deciding on further action, preventing the cause from recurring, and resuming monitoring.',
      },
    ),
    category:
      'Requirement 10: Log and Monitor All Access to System Components and Cardholder Data',
  },
  '11.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_1.title',
      { defaultMessage: 'Security testing processes and mechanisms' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_1.description',
      {
        defaultMessage:
          'Processes and mechanisms set out how the security of systems and networks is tested on a regular basis, and they are defined and understood.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_1_1.title',
      { defaultMessage: 'Requirement 11 policies and procedures' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_1_1.description',
      {
        defaultMessage:
          'All security policies and operating procedures for Requirement 11 are written down, kept current, followed in practice, and known to everyone they affect.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_1_2.title',
      { defaultMessage: 'Requirement 11 roles and responsibilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_1_2.description',
      {
        defaultMessage:
          'Roles and duties for carrying out the Requirement 11 activities are written down, assigned, and understood.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_2.title',
      { defaultMessage: 'Wireless access point monitoring' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_2.description',
      {
        defaultMessage:
          'Wireless access points are found and watched, and unauthorized ones are dealt with.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_2_1.title',
      { defaultMessage: 'Detection of wireless access points' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_2_1.description',
      {
        defaultMessage:
          'Testing for Wi-Fi access points, and detection and identification of every authorized and unauthorized one, happen at least every three months. Where monitoring is automated, personnel get alerts.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_2_2.title',
      { defaultMessage: 'Inventory of authorized access points' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_2_2.description',
      {
        defaultMessage:
          'A list is kept of the wireless access points that are authorized, with a documented business reason for each one.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3.title',
      { defaultMessage: 'Identification and handling of vulnerabilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3.description',
      {
        defaultMessage:
          'Internal and external vulnerabilities are found, prioritized and dealt with on a regular basis.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1.title',
      { defaultMessage: 'Scans of internal vulnerabilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1.description',
      {
        defaultMessage:
          'Internal vulnerability scans run at least every three months with an up-to-date tool, by qualified and independent personnel. High-risk and critical vulnerabilities, ranked per Requirement 6.3.1, are fixed, and rescans confirm that they are.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1_1.title',
      { defaultMessage: 'Other applicable vulnerabilities' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1_1.description',
      {
        defaultMessage:
          "All other applicable vulnerabilities, those below high-risk or critical in the entity's Requirement 6.3.1 ranking, are handled according to the risk set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1, with rescans as needed.",
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1_2.title',
      { defaultMessage: 'Authenticated internal scanning' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1_2.description',
      {
        defaultMessage:
          'Internal scans use authenticated scanning with enough privileges. Systems that cannot accept scan credentials are documented, and scan accounts that allow interactive login are managed as Requirement 8.2.2 describes.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1_3.title',
      { defaultMessage: 'Internal scans after significant change' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_1_3.description',
      {
        defaultMessage:
          'After any significant change, internal scans are run by qualified and independent personnel (a QSA or ASV is not required). High-risk and critical vulnerabilities, ranked per Requirement 6.3.1, are fixed, with rescans as needed.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_2.title',
      { defaultMessage: 'External vulnerability scans' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_2.description',
      {
        defaultMessage:
          'External scans are run at least every three months by an Approved Scanning Vendor (ASV) that PCI SSC has approved. Vulnerabilities are fixed until the scan passes under the ASV Program Guide, with rescans as needed to confirm it.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.3.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_2_1.title',
      { defaultMessage: 'External scans after significant change' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_3_2_1.description',
      {
        defaultMessage:
          'After any significant change, external scans are run by qualified and independent personnel (a QSA or ASV is not required). Vulnerabilities with a CVSS score of 4.0 or more are fixed, with rescans as needed.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4.title',
      { defaultMessage: 'Penetration testing' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4.description',
      {
        defaultMessage:
          'Penetration tests are run regularly from inside and outside, and the exploitable vulnerabilities and weaknesses they find are fixed.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_1.title',
      { defaultMessage: 'Penetration testing methodology' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_1.description',
      {
        defaultMessage:
          'The entity defines, documents and applies a penetration testing method based on industry-accepted approaches. It covers the whole CDE perimeter and critical systems, internal and external testing, tests of scope-reduction and any segmentation controls, application-layer tests finding at least the Requirement 6.2.4 vulnerabilities, and network-layer tests of all network-function components and operating systems. It reviews threats and vulnerabilities seen in the last 12 months, documents how risk from security weaknesses and exploitable vulnerabilities found in testing is assessed and addressed, and keeps test and remediation results 12+ months.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_2.title',
      { defaultMessage: 'Internal penetration testing' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_2.description',
      {
        defaultMessage:
          "Internal penetration tests follow the entity's method and run at least every 12 months and after each significant upgrade or change to infrastructure or applications. A qualified tester, internal or external and organizationally independent, performs them (a QSA or ASV is not required).",
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_3.title',
      { defaultMessage: 'External penetration testing' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_3.description',
      {
        defaultMessage:
          "External penetration tests follow the entity's method and run at least every 12 months and after each significant upgrade or change to infrastructure or applications. A qualified tester, internal or external and organizationally independent, performs them (a QSA or ASV is not required).",
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_4.title',
      { defaultMessage: 'Correction of penetration test findings' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_4.description',
      {
        defaultMessage:
          'Exploitable vulnerabilities and weaknesses found in penetration tests are fixed according to their risk, as assessed under Requirement 6.3.1, and the test is repeated to confirm the fixes.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_5.title',
      { defaultMessage: 'Segmentation testing' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_5.description',
      {
        defaultMessage:
          "Where segmentation separates the CDE from other networks, its controls are penetration tested at least every 12 months and after each change to them. Tests cover all segmentation controls and methods in use, follow the entity's defined methodology, and confirm the controls are operational and effective and keep the CDE isolated from every out-of-scope system, and that any isolation of systems with differing security levels works (Requirement 2.2.3). A qualified, organizationally independent internal resource or external third party performs them (not necessarily a QSA or ASV).",
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_6.title',
      { defaultMessage: 'Segmentation testing for service providers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_6.description',
      {
        defaultMessage:
          "For service providers only: where segmentation separates the CDE from other networks, its controls are penetration tested at least every six months and after each change to them. Tests cover all segmentation controls and methods in use, follow the entity's defined methodology, and confirm the controls are operational and effective and keep the CDE isolated from every out-of-scope system, and that any isolation of systems with differing security levels works (Requirement 2.2.3). A qualified, organizationally independent internal resource or external third party performs them (not necessarily a QSA or ASV).",
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.4.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_7.title',
      { defaultMessage: 'Penetration test support for tenants' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_4_7.description',
      {
        defaultMessage:
          'Multi-tenant service providers help their customers carry out external penetration testing as described in Requirement 11.4.3 and Requirement 11.4.4.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5.title',
      { defaultMessage: 'Intrusion and file change detection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5.description',
      {
        defaultMessage:
          'Network intrusions and unexpected changes to files are detected, and a response follows.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5_1.title',
      { defaultMessage: 'Intrusion detection and prevention' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5_1.description',
      {
        defaultMessage:
          'Intrusion detection or prevention watches all traffic at the CDE perimeter and at critical points inside it, alerts personnel to suspected compromises, and keeps all engines, baselines and signatures up to date.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.5.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5_1_1.title',
      { defaultMessage: 'Covert malware channel detection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5_1_1.description',
      {
        defaultMessage:
          'For service providers only: covert malware communication channels are found by intrusion detection or prevention, which alerts on or blocks them and handles them.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.5.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5_2.title',
      { defaultMessage: 'Change detection on critical files' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_5_2.description',
      {
        defaultMessage:
          'A change-detection mechanism, such as file integrity monitoring, alerts personnel to unauthorized changes, additions or deletions of critical files and compares those files at least once a week.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_6.title',
      { defaultMessage: 'Payment page change detection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_6.description',
      {
        defaultMessage:
          'Unauthorized changes made to payment pages are detected, and a response follows.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '11.6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_6_1.title',
      { defaultMessage: 'Payment page tamper detection' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req11_6_1.description',
      {
        defaultMessage:
          'A mechanism detecting changes and tampering alerts personnel to unauthorized changes, including indicators of compromise, additions and deletions, to security-relevant HTTP headers and payment page scripts the consumer browser receives. It evaluates those headers and pages at least weekly, or at a frequency set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1.',
      },
    ),
    category: 'Requirement 11: Test Security of Systems and Networks Regularly',
  },
  '12.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1.title',
      { defaultMessage: 'Information security policy' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1.description',
      {
        defaultMessage:
          "A complete security policy that guides how the entity's information assets are protected is known and kept current.",
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_1.title',
      { defaultMessage: 'Overall information security policy' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_1.description',
      {
        defaultMessage:
          'An overall security policy is set up, published, maintained, and shared with all relevant personnel and with relevant vendors and business partners.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_2.title',
      { defaultMessage: 'Policy review' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_2.description',
      {
        defaultMessage:
          'The security policy is checked at least every 12 months and changed when needed to reflect new business objectives or new risks to the environment.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_3.title',
      { defaultMessage: 'Security roles in the policy' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_3.description',
      {
        defaultMessage:
          'The security policy clearly sets out information security roles and duties for all personnel, and every person knows and confirms their own security duties.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.1.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_4.title',
      { defaultMessage: 'Executive responsibility for security' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_1_4.description',
      {
        defaultMessage:
          'Information security is formally made the responsibility of a CISO or of another executive management member who knows information security.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_2.title',
      { defaultMessage: 'Acceptable use policies' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_2.description',
      {
        defaultMessage:
          'Policies that state how end-user technologies may be used are defined and put into practice.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_2_1.title',
      { defaultMessage: 'End-user technology use policies' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_2_1.description',
      {
        defaultMessage:
          'Policies on how end-user technologies may be used are written down and applied. They require explicit approval by authorized parties, state which uses are acceptable, and list the hardware and software products the company approves for employee use.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3.title',
      { defaultMessage: 'Risk management for the CDE' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3.description',
      {
        defaultMessage:
          'Risks to the CDE are formally identified, assessed and managed.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_1.title',
      { defaultMessage: 'Targeted risk analysis' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_1.description',
      {
        defaultMessage:
          'Every targeted risk analysis that a PCI DSS requirement asks for is documented. It identifies the assets protected, the threats the requirement guards against, and the factors behind the likelihood or impact of a threat, and it determines and justifies how the frequency or processes the entity defines for the requirement reduce that likelihood or impact. Each analysis is reviewed at least every 12 months to confirm its results are still valid, and redone when that annual review shows it is needed.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_2.title',
      { defaultMessage: 'Risk analysis for the customized approach' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_2.description',
      {
        defaultMessage:
          'A targeted risk analysis is done for each requirement met with the customized approach. It includes documented evidence for every element of Appendix D, at least a controls matrix and a risk analysis, approval by senior management, and a repeat at least every 12 months.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_3.title',
      { defaultMessage: 'Review of cipher suites and protocols' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_3.description',
      {
        defaultMessage:
          'Cipher suites and cryptographic protocols that are in use are documented and checked at least every 12 months. This includes at least a current inventory of all of them with purpose and location, active tracking of industry trends on whether all remain viable, and a documented plan for expected changes in cryptographic vulnerabilities.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_4.title',
      { defaultMessage: 'Review of hardware and software technologies' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_3_4.description',
      {
        defaultMessage:
          'Hardware and software in use are checked at least every 12 months. The review confirms vendors still ship security fixes promptly and that the technology still supports PCI DSS compliance of the entity, records industry announcements and trends such as end-of-life plans, and includes a senior-management-approved plan to remediate outdated technology.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4.title',
      { defaultMessage: 'PCI DSS compliance management' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4.description',
      { defaultMessage: 'Compliance with PCI DSS is managed.' },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4_1.title',
      { defaultMessage: 'Executive responsibility for compliance' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4_1.description',
      {
        defaultMessage:
          'For service providers only: executive management takes responsibility for protecting cardholder data and for a program that keeps PCI DSS compliance. This includes overall accountability for staying compliant and a program charter that is communicated to executive management.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4_2.title',
      { defaultMessage: 'Quarterly operational reviews' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4_2.description',
      {
        defaultMessage:
          'For service providers only: at least every three months, a review checks that personnel follow every security policy and operational procedure. Someone other than the task owner performs the review, which covers at least daily log reviews, network security control configuration reviews, configuration standards for new systems, security alert response and change management.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.4.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4_2_1.title',
      { defaultMessage: 'Documentation of quarterly reviews' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_4_2_1.description',
      {
        defaultMessage:
          'For service providers only: each review done under Requirement 12.4.2 is documented with its results, the documented remediation for any task found not performed, and review and sign-off of the results by the personnel in charge of the PCI DSS compliance program.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5.title',
      { defaultMessage: 'PCI DSS scope' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5.description',
      {
        defaultMessage:
          'The scope of PCI DSS is written down and confirmed as correct.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_1.title',
      { defaultMessage: 'Inventory of in-scope components' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_1.description',
      {
        defaultMessage:
          'An inventory of the system components in PCI DSS scope, with a description of what each one does or is used for, is kept current.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.5.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_2.title',
      { defaultMessage: 'Scope confirmation' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_2.description',
      {
        defaultMessage:
          'The entity documents and confirms PCI DSS scope at least every 12 months and after each significant change in the in-scope environment. It covers at least all data flows for payment stages and acceptance channels, all data-flow diagrams, updated per 1.2.4, every place storing, processing or sending account data (including outside the current CDE, CHD applications, transmissions and backups), all components in, connected to or affecting CDE security, all segmentation controls and segmented environments with out-of-scope reasons, and all third-party connections with CDE access, then confirms all are in scope.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.5.2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_2_1.title',
      { defaultMessage: 'Scope confirmation for service providers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_2_1.description',
      {
        defaultMessage:
          'For service providers only: the entity documents and confirms its PCI DSS scope at least every six months and after significant changes to the in-scope environment, covering every element listed in Requirement 12.5.2.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.5.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_3.title',
      { defaultMessage: 'Organizational change and scope' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_5_3.description',
      {
        defaultMessage:
          'For service providers only: a significant change to the organizational structure triggers a documented internal review of its impact on PCI DSS scope and on how controls apply, with the results reported to executive management.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6.title',
      { defaultMessage: 'Ongoing security awareness' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6.description',
      {
        defaultMessage:
          'Security awareness education is carried out continuously, not as a one-time event.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_1.title',
      { defaultMessage: 'Security awareness program' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_1.description',
      {
        defaultMessage:
          "A formal security awareness program teaches every member of staff about the entity's security policy and procedures and about their own part in protecting cardholder data.",
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.6.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_2.title',
      { defaultMessage: 'Awareness program review' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_2.description',
      {
        defaultMessage:
          'The security awareness program is checked at least every 12 months and changed where needed to cover new threats and vulnerabilities to cardholder or sensitive authentication data, or changes to what personnel are told about their role.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.6.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_3.title',
      { defaultMessage: 'Security awareness training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_3.description',
      {
        defaultMessage:
          'Personnel get security awareness training when hired and at least every 12 months, through several communication methods. At least every 12 months they confirm that they have read the security policy and procedures and understand them.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.6.3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_3_1.title',
      { defaultMessage: 'Threat awareness in training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_3_1.description',
      {
        defaultMessage:
          'Security awareness training covers threats and vulnerabilities that could affect cardholder or sensitive authentication data, including at least phishing and related attacks and social engineering.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.6.3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_3_2.title',
      { defaultMessage: 'Acceptable use in training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_6_3_2.description',
      {
        defaultMessage:
          'Security awareness training explains how end-user technologies may be used, in line with the policies of Requirement 12.2.1.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_7.title',
      { defaultMessage: 'Personnel screening' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_7.description',
      {
        defaultMessage:
          'Personnel are screened to lower the risk that comes from insider threats.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.7.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_7_1.title',
      { defaultMessage: 'Pre-hire screening' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_7_1.description',
      {
        defaultMessage:
          'Candidates who will be able to access the CDE are screened before hire, within the limits of local laws, to reduce the risk of insider attacks.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8.title',
      { defaultMessage: 'Third-party service provider risk' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8.description',
      {
        defaultMessage:
          'The risk that relationships with third-party service providers (TPSPs) bring to information assets is managed.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.8.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_1.title',
      { defaultMessage: 'List of TPSPs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_1.description',
      {
        defaultMessage:
          'A list is kept of every TPSP that receives account data or could affect its security, with a description of the services each one provides.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.8.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_2.title',
      { defaultMessage: 'Written agreements with TPSPs' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_2.description',
      {
        defaultMessage:
          "Written agreements are kept with every TPSP that receives account data or could affect CDE security. In them, each TPSP accepts that it is responsible for securing the account data it holds or handles for the entity, or as far as it could affect the entity's cardholder or sensitive authentication data.",
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.8.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_3.title',
      { defaultMessage: 'TPSP engagement process' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_3.description',
      {
        defaultMessage:
          'An established process governs how TPSPs are engaged, with proper due diligence done before any engagement starts.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.8.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_4.title',
      { defaultMessage: 'Monitoring of TPSP compliance' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_4.description',
      {
        defaultMessage:
          'A program is in place to check the PCI DSS compliance status of each TPSP at least every 12 months.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.8.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_5.title',
      { defaultMessage: 'TPSP responsibility matrix' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_8_5.description',
      {
        defaultMessage:
          'Records are kept of which PCI DSS requirements each TPSP manages, which the entity manages, and which the two share.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.9': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_9.title',
      { defaultMessage: 'TPSP support for customer compliance' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_9.description',
      {
        defaultMessage:
          'Third-party service providers (TPSPs) help their customers with their PCI DSS compliance.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.9.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_9_1.title',
      { defaultMessage: 'TPSP written acknowledgment' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_9_1.description',
      {
        defaultMessage:
          "Service providers give customers written agreements in which they accept that they are responsible for securing the account data they hold or handle for the customer, or as far as they could affect that customer's cardholder or sensitive authentication data.",
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.9.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_9_2.title',
      { defaultMessage: 'TPSP information for customers' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_9_2.description',
      {
        defaultMessage:
          'When a customer asks, service providers share their PCI DSS compliance status (Requirement 12.8.4) and which requirements they, the customer or both are responsible for (Requirement 12.8.5), for every service that meets a requirement for customers or could affect their data.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10.title',
      { defaultMessage: 'Incident response' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10.description',
      {
        defaultMessage:
          'Security incidents, suspected or confirmed, that could affect the CDE get an immediate response.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_1.title',
      { defaultMessage: 'Incident response plan' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_1.description',
      {
        defaultMessage:
          "An incident response plan is in place and ready to activate for any suspected or confirmed security incident. It includes, among others, roles and responsibilities, communication and contact strategies, with at least notice to payment brands and acquirers; procedures with specific steps to contain and mitigate each type of incident; procedures for business recovery and continuity; processes for data backup; analysis of the legal rules on reporting compromises; coverage of and responses for all critical system components; and reference to or inclusion of the payment brands' incident response procedures.",
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_2.title',
      { defaultMessage: 'Incident plan review and testing' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_2.description',
      {
        defaultMessage:
          'At least every 12 months, the incident response plan is reviewed with its content updated as needed, and it is tested, covering every element of Requirement 12.10.1.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_3.title',
      { defaultMessage: '24/7 incident response staff' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_3.description',
      {
        defaultMessage:
          'Specific personnel are designated and available around the clock, 24/7, to handle any security incident that is suspected or confirmed.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_4.title',
      { defaultMessage: 'Incident response training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_4.description',
      {
        defaultMessage:
          'Personnel who handle suspected or confirmed security incidents get suitable, periodic training on their incident response duties.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_4_1.title',
      { defaultMessage: 'Frequency of incident response training' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_4_1.description',
      {
        defaultMessage:
          'How often incident response personnel are trained is set in the targeted risk analysis of the entity, done following all elements of Requirement 12.3.1.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_5.title',
      { defaultMessage: 'Security alerts in the incident plan' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_5.description',
      {
        defaultMessage:
          'The incident response plan covers watching and acting on alerts from security monitoring systems. These include IDS/IPS, network security controls, change detection for critical files, the payment page change and tamper detection mechanism (a best practice only until its effective date), and detection of wireless access points that are not authorized.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_6.title',
      { defaultMessage: 'Incident plan improvement' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_6.description',
      {
        defaultMessage:
          'The incident response plan is changed and improved over time based on lessons learned and on developments in the industry.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
  '12.10.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_7.title',
      { defaultMessage: 'Response to unexpected stored PAN' },
    ),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.pciDssRequirements.req12_10_7.description',
      {
        defaultMessage:
          'Incident response procedures start when stored PAN is found where it is not expected. They decide what to do with PAN outside the CDE (retrieve, securely delete or move it into the current CDE, as applicable), check if sensitive authentication data sits with it, trace where the data came from and how, and fix the leak or process gap.',
      },
    ),
    category:
      'Requirement 12: Support Information Security with Organizational Policies and Programs',
  },
};
