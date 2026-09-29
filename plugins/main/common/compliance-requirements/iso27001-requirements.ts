/*
 * Wazuh app - Module for ISO 27001 requirements
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
 * Framework: iso_27001
 * Catalog version: 1.0.0
 * Edition: 2022
 * Source: ISO/IEC 27002:2022(E) Information security controls, official preview pages (table of contents), published by ISO/IEC and distributed by ANSI
 * Controls: 93
 */
import { i18n } from '@osd/i18n';
import { ComplianceRequirement } from './types';

export const iso27001RequirementsFile: Record<string, ComplianceRequirement> = {
  'A.5.1': {
    title: 'Policies for information security',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_1.description',
      {
        defaultMessage:
          'The organization keeps a written security policy plus supporting policies on specific topics, all approved by management. The people who must follow them know them, and they are reviewed on a schedule and after major changes.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.2': {
    title: 'Information security roles and responsibilities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_2.description',
      {
        defaultMessage:
          'Every security task has a named owner. Who does what to protect information, and with what authority, is written down and given to specific people.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.3': {
    title: 'Segregation of duties',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_3.description',
      {
        defaultMessage:
          'Tasks that could conflict, such as requesting and approving the same change, are split between different people. This limits fraud, abuse and mistakes that nobody notices.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.4': {
    title: 'Management responsibilities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_4.description',
      {
        defaultMessage:
          'Managers require staff and contractors to follow the security policy and procedures, and they lead by example in applying them day to day.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.5': {
    title: 'Contact with authorities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_5.description',
      {
        defaultMessage:
          'The organization knows which regulators, law enforcement and other public bodies it must contact about security matters, and keeps those contacts current.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.6': {
    title: 'Contact with special interest groups',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_6.description',
      {
        defaultMessage:
          'Security staff stay connected with industry groups, forums and professional associations to share knowledge, receive early warnings and keep their skills up to date.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.7': {
    title: 'Threat intelligence',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_7.description',
      {
        defaultMessage:
          'Information about current and emerging threats is gathered and analysed, and the results are used to adjust defences and security decisions.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.8': {
    title: 'Information security in project management',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_8.description',
      {
        defaultMessage:
          'Security is built into every project from planning to closure, whatever the type of project. Project risks to information are identified and handled as part of the project work.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.9': {
    title: 'Inventory of information and other associated assets',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_9.description',
      {
        defaultMessage:
          'An up-to-date list of information, systems and other assets is maintained, and each item has an owner who is accountable for its protection.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.10': {
    title: 'Acceptable use of information and other associated assets',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_10.description',
      {
        defaultMessage:
          'People know what they may and may not do with company information, devices and other assets. Written rules and handling procedures cover allowed use, and they are applied in daily work.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.11': {
    title: 'Return of assets',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_11.description',
      {
        defaultMessage:
          'When people leave, change role, or a contract or agreement ends, they give back the company devices, data and other assets they hold, and this return is checked.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.12': {
    title: 'Classification of information',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_12.description',
      {
        defaultMessage:
          'Each item of information gets a sensitivity level set by how much harm its disclosure, corruption or loss would cause, plus legal and stakeholder demands. The level then decides how it is protected.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.13': {
    title: 'Labelling of information',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_13.description',
      {
        defaultMessage:
          'Information carries marks that show its classification, applied through agreed procedures, so anyone handling it knows how to treat it.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.14': {
    title: 'Information transfer',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_14.description',
      {
        defaultMessage:
          'Moving information inside the organization or to outside parties, by any channel, follows defined rules, procedures or agreements that keep it protected in transit.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.15': {
    title: 'Access control',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_15.description',
      {
        defaultMessage:
          'Who may reach information and systems, physically and logically, is decided by business and security needs and written into access rules.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.16': {
    title: 'Identity management',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_16.description',
      {
        defaultMessage:
          'Identities of users and systems are created, maintained and retired through a managed lifecycle, so each account maps to one accountable person or process.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.17': {
    title: 'Authentication information',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_17.description',
      {
        defaultMessage:
          'Passwords, keys, tokens and other secrets are issued, changed and revoked through a controlled process, and users are told how to keep them safe.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.18': {
    title: 'Access rights',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_18.description',
      {
        defaultMessage:
          'Each user gets only the permissions their job needs. Permissions are checked on a schedule, updated when someone moves roles, and taken away when they are no longer justified.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.19': {
    title: 'Information security in supplier relationships',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_19.description',
      {
        defaultMessage:
          'Risks that come from using the products and services of suppliers are identified, and processes are in place to keep those risks under control.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.20': {
    title: 'Addressing information security within supplier agreements',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_20.description',
      {
        defaultMessage:
          'Contracts with each supplier state the security requirements that apply to that relationship, so obligations on both sides are clear and enforceable.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.21': {
    title: 'Managing information security in the ICT supply chain',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_21.description',
      {
        defaultMessage:
          'Security risks in the chain of technology products and services, including components that suppliers source from others, are identified and managed.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.22': {
    title: 'Monitoring, review and change management of supplier services',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_22.description',
      {
        defaultMessage:
          'Supplier security practices and service delivery are checked regularly, and changes to supplier services are assessed and controlled before they take effect.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.23': {
    title: 'Information security for use of cloud services',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_23.description',
      {
        defaultMessage:
          "Cloud services are chosen, run and exited under agreed processes that reflect the organization's security needs. This covers shared responsibility with the provider and a plan to move data out safely.",
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.24': {
    title: 'Information security incident management planning and preparation',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_24.description',
      {
        defaultMessage:
          'Before any incident happens, the organization sets up its incident handling process, names who does what, and tells those people. This lets the team respond fast and consistently when an incident occurs.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.25': {
    title: 'Assessment and decision on information security events',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_25.description',
      {
        defaultMessage:
          'Security events are evaluated to decide whether they count as incidents, so real incidents are recognised early and handled quickly.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.26': {
    title: 'Response to information security incidents',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_26.description',
      {
        defaultMessage:
          'Confirmed incidents are handled by following documented response procedures, from first containment through to full recovery.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.27': {
    title: 'Learning from information security incidents',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_27.description',
      {
        defaultMessage:
          'Lessons from past incidents are fed back into the security controls to reduce the chance or the impact of similar incidents in the future.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.28': {
    title: 'Collection of evidence',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_28.description',
      {
        defaultMessage:
          'When an event may lead to legal or disciplinary action, evidence is gathered and preserved through defined procedures so it stays trustworthy.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.29': {
    title: 'Information security during disruption',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_29.description',
      {
        defaultMessage:
          'Security stays at a suitable level during disruptions, with plans that keep protection in place while the organization recovers.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.30': {
    title: 'ICT readiness for business continuity',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_30.description',
      {
        defaultMessage:
          'Technology services are prepared, tested and kept ready so they can support business continuity objectives during and after a disruption.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.31': {
    title: 'Legal, statutory, regulatory and contractual requirements',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_31.description',
      {
        defaultMessage:
          'The organization keeps a current register of the laws, regulations and contract terms that bear on information security, and records how it plans to comply with each one.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.32': {
    title: 'Intellectual property rights',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_32.description',
      {
        defaultMessage:
          'Procedures protect intellectual property, such as software licences and copyrighted material, and prevent its unlawful use.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.33': {
    title: 'Protection of records',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_33.description',
      {
        defaultMessage:
          'Business records are kept safe from being lost, altered, destroyed or seen by the wrong people for their full retention period.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.34': {
    title: 'Privacy and protection of PII',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_34.description',
      {
        defaultMessage:
          'Personal data is handled in line with privacy laws, regulations and contracts, and the organization can show that it meets those obligations.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.35': {
    title: 'Independent review of information security',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_35.description',
      {
        defaultMessage:
          'An auditor or team not involved in the work checks the security management approach and how it runs in practice. This happens on a set schedule and whenever something important changes.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.36': {
    title:
      'Compliance with policies, rules and standards for information security',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_36.description',
      {
        defaultMessage:
          'Regular checks confirm that people and systems actually follow the security policy, the topic rules and the agreed standards.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.5.37': {
    title: 'Documented operating procedures',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_5_37.description',
      {
        defaultMessage:
          'Step-by-step instructions for running and maintaining systems, such as start-up, backup and recovery, are recorded and kept where the staff who use them can find them.',
      },
    ),
    category: 'Organizational controls',
  },
  'A.6.1': {
    title: 'Screening',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_1.description',
      {
        defaultMessage:
          'People are screened before they join and again over time where the role calls for it. Checks respect local law and ethics and scale with the job, the data accessed and the risks.',
      },
    ),
    category: 'People controls',
  },
  'A.6.2': {
    title: 'Terms and conditions of employment',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_2.description',
      {
        defaultMessage:
          'Employment contracts set out the security responsibilities of both the employee and the organization, so each side knows its obligations from the first day.',
      },
    ),
    category: 'People controls',
  },
  'A.6.3': {
    title: 'Information security awareness, education and training',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_3.description',
      {
        defaultMessage:
          'Everyone who handles company information, including relevant contractors, learns the security basics and the skills their job needs. Content is refreshed regularly as policies, procedures and threats change.',
      },
    ),
    category: 'People controls',
  },
  'A.6.4': {
    title: 'Disciplinary process',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_4.description',
      {
        defaultMessage:
          'A formal disciplinary process, known to all staff, deals with people who break the security policy and makes consequences predictable and fair.',
      },
    ),
    category: 'People controls',
  },
  'A.6.5': {
    title: 'Responsibilities after termination or change of employment',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_5.description',
      {
        defaultMessage:
          'Some duties, like keeping company information secret, still apply after someone leaves or moves to another job. Those duties are explained to the person and followed up.',
      },
    ),
    category: 'People controls',
  },
  'A.6.6': {
    title: 'Confidentiality or non-disclosure agreements',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_6.description',
      {
        defaultMessage:
          'Staff, contractors and partners sign non-disclosure terms that match how sensitive the information they handle is. The terms are kept on record and revisited when needs change or on a periodic basis.',
      },
    ),
    category: 'People controls',
  },
  'A.6.7': {
    title: 'Remote working',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_7.description',
      {
        defaultMessage:
          'Remote and home workers follow security measures that protect the company information they use outside the office.',
      },
    ),
    category: 'People controls',
  },
  'A.6.8': {
    title: 'Information security event reporting',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_6_8.description',
      {
        defaultMessage:
          'Staff have a clear and quick channel to report any security event they observe or suspect, so it reaches the right people in time.',
      },
    ),
    category: 'People controls',
  },
  'A.7.1': {
    title: 'Physical security perimeters',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_1.description',
      {
        defaultMessage:
          'Areas that hold information and systems are enclosed by defined physical boundaries, such as walls, fences or controlled doors, that match the value of what they protect.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.2': {
    title: 'Physical entry',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_2.description',
      {
        defaultMessage:
          'Entry points and physical access controls, such as badges or locks, ensure that only authorised people get into secure areas.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.3': {
    title: 'Securing offices, rooms and facilities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_3.description',
      {
        defaultMessage:
          'Offices, rooms and facilities are designed and built with physical protection that fits the sensitivity of the information and equipment they contain.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.4': {
    title: 'Physical security monitoring',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_4.description',
      {
        defaultMessage:
          'Premises are watched continuously, for example with cameras, guards or alarms, to detect unauthorised physical access.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.5': {
    title: 'Protecting against physical and environmental threats',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_5.description',
      {
        defaultMessage:
          'Facilities are protected against natural disasters, fire, flooding, power problems and deliberate physical attacks on the infrastructure.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.6': {
    title: 'Working in secure areas',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_6.description',
      {
        defaultMessage:
          'Specific rules govern how people work inside secure areas, such as supervision of visitors and limits on recording devices, and those rules are applied.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.7': {
    title: 'Clear desk and clear screen',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_7.description',
      {
        defaultMessage:
          'Desks are kept free of papers and removable media, and screens are locked or cleared whenever they are left unattended.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.8': {
    title: 'Equipment siting and protection',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_8.description',
      {
        defaultMessage:
          'Equipment is placed and protected in a way that reduces physical and environmental risks and prevents unauthorised access to it.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.9': {
    title: 'Security of assets off-premises',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_9.description',
      {
        defaultMessage:
          'Laptops and other assets used away from company sites are protected against loss, theft and misuse.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.10': {
    title: 'Storage media',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_10.description',
      {
        defaultMessage:
          'Removable and fixed storage media are tracked from purchase to disposal. Their use, transport and destruction follow the handling rules for the classification of the data they hold.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.11': {
    title: 'Supporting utilities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_11.description',
      {
        defaultMessage:
          'Systems are shielded from outages of electricity, cooling, water or telecommunications, through measures like backup power and regular checks of these services.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.12': {
    title: 'Cabling security',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_12.description',
      {
        defaultMessage:
          'Power and data cables are routed and protected so they cannot easily be tapped, disrupted or physically damaged.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.13': {
    title: 'Equipment maintenance',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_13.description',
      {
        defaultMessage:
          'Hardware receives upkeep according to supplier guidance and by authorised staff, so faults do not cause data loss, corruption or exposure.',
      },
    ),
    category: 'Physical controls',
  },
  'A.7.14': {
    title: 'Secure disposal or re-use of equipment',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_7_14.description',
      {
        defaultMessage:
          'Before any device with storage is thrown away or reused, staff confirm that licensed programs and sensitive data on it have been wiped or destroyed beyond recovery.',
      },
    ),
    category: 'Physical controls',
  },
  'A.8.1': {
    title: 'User endpoint devices',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_1.description',
      {
        defaultMessage:
          'Laptops, phones and other user devices are configured and managed so the company data they hold or can reach stays protected.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.2': {
    title: 'Privileged access rights',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_2.description',
      {
        defaultMessage:
          'Administrator and other privileged accounts are limited to the people who need them, granted only for that need and closely managed.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.3': {
    title: 'Information access restriction',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_3.description',
      {
        defaultMessage:
          'Each user can open only the data and application functions their role allows, as set by the access control policy.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.4': {
    title: 'Access to source code',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_4.description',
      {
        defaultMessage:
          'Only authorised developers and tools can view or change the code base, build tooling and shared libraries. This prevents unauthorised changes, hidden functionality and leaks of intellectual property.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.5': {
    title: 'Secure authentication',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_5.description',
      {
        defaultMessage:
          'Users and systems prove who they are through strong authentication, such as multi-factor login, matched to the sensitivity of what they access.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.6': {
    title: 'Capacity management',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_6.description',
      {
        defaultMessage:
          'Teams watch how much processing, storage, network and staff capacity is used, and plan ahead so resources keep pace with demand.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.7': {
    title: 'Protection against malware',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_7.description',
      {
        defaultMessage:
          'Technical defences against malware are in place on systems and networks, and users are made aware of how malware spreads.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.8': {
    title: 'Management of technical vulnerabilities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_8.description',
      {
        defaultMessage:
          'The organization tracks newly published weaknesses in the software and hardware it runs, judges how exposed it is to each, and patches or mitigates them in time.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.9': {
    title: 'Configuration management',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_9.description',
      {
        defaultMessage:
          'Systems, applications and network devices run from approved, documented baseline settings, and changes from that baseline are monitored and reviewed.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.10': {
    title: 'Information deletion',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_10.description',
      {
        defaultMessage:
          'Data that has no further business or legal purpose is securely erased from systems, devices and storage media.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.11': {
    title: 'Data masking',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_11.description',
      {
        defaultMessage:
          'Sensitive data is masked or hidden in line with access policies, business needs and legal requirements.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.12': {
    title: 'Data leakage prevention',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_12.description',
      {
        defaultMessage:
          'Measures detect and stop sensitive information from being disclosed or extracted without authorisation from systems, networks and devices.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.13': {
    title: 'Information backup',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_13.description',
      {
        defaultMessage:
          'The organization keeps copies of its data, software and system images as its backup policy sets out, and restores from them on a regular basis to prove the copies work.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.14': {
    title: 'Redundancy of information processing facilities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_14.description',
      {
        defaultMessage:
          'Processing facilities are built with enough duplicate components and capacity to keep services running when a single part fails.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.15': {
    title: 'Logging',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_15.description',
      {
        defaultMessage:
          'Systems keep records of user actions, errors and security events. Those records are protected from tampering and are reviewed to spot problems.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.16': {
    title: 'Monitoring activities',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_16.description',
      {
        defaultMessage:
          'Teams look for unusual behaviour in network traffic, systems and applications, and investigate alerts to decide whether an incident is under way.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.17': {
    title: 'Clock synchronization',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_17.description',
      {
        defaultMessage:
          'All systems take their time from agreed reference clocks, so timestamps match and events from different systems can be put in the right order.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.18': {
    title: 'Use of privileged utility programs',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_18.description',
      {
        defaultMessage:
          'Utilities that can bypass operating system or application security controls are available to very few authorised administrators, and each use is limited, approved and logged.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.19': {
    title: 'Installation of software on operational systems',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_19.description',
      {
        defaultMessage:
          'Installing software on production systems follows procedures and controls that keep those systems secure and stable.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.20': {
    title: 'Networks security',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_20.description',
      {
        defaultMessage:
          'Network infrastructure, including routers, switches and firewalls, is hardened, administered and supervised so that the data flowing between connected systems stays protected from compromise.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.21': {
    title: 'Security of network services',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_21.description',
      {
        defaultMessage:
          'Each network service, whether run in-house or bought from a provider, has agreed security functions and service levels. These are put in place and tracked so the service keeps meeting them.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.22': {
    title: 'Segregation of networks',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_22.description',
      {
        defaultMessage:
          'Networks are divided into separate zones, for example by function or sensitivity, so users and systems only reach the segments they need.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.23': {
    title: 'Web filtering',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_23.description',
      {
        defaultMessage:
          'Access to external websites is restricted, for example by category or reputation, so users are less exposed to malware, phishing and other harmful content.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.24': {
    title: 'Use of cryptography',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_24.description',
      {
        defaultMessage:
          'The organization decides where encryption and other cryptography are used, and how keys are generated, stored, rotated and destroyed, and then follows those rules.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.25': {
    title: 'Secure development life cycle',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_25.description',
      {
        defaultMessage:
          'Software and systems are developed following secure development rules at every stage of their lifecycle, from design to retirement.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.26': {
    title: 'Application security requirements',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_26.description',
      {
        defaultMessage:
          'Before an application is built or bought, its security needs, such as login, input checks and data protection, are worked out, written into the requirements and signed off.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.27': {
    title: 'Secure system architecture and engineering principles',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_27.description',
      {
        defaultMessage:
          'The organization sets secure design principles, such as defence in depth and least privilege, and every new or changed system follows them. The principles are kept current as threats and technology change.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.28': {
    title: 'Secure coding',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_28.description',
      {
        defaultMessage:
          'Developers write code following secure coding practices, so common weaknesses are not introduced into the software.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.29': {
    title: 'Security testing in development and acceptance',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_29.description',
      {
        defaultMessage:
          'Security tests are planned and run during development, and systems pass security acceptance checks before going live.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.30': {
    title: 'Outsourced development',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_30.description',
      {
        defaultMessage:
          'When software is built by an outside company, the organization sets the security terms, oversees the work and checks the delivered result against its security requirements.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.31': {
    title: 'Separation of development, test and production environments',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_31.description',
      {
        defaultMessage:
          'Code is built and tested in environments kept apart from live systems, so work in progress cannot affect production and each environment has its own protection.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.32': {
    title: 'Change management',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_32.description',
      {
        defaultMessage:
          'Changes to systems and processing facilities go through a formal change management process with review and approval before release.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.33': {
    title: 'Test information',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_33.description',
      {
        defaultMessage:
          'Data used in testing is picked with care and given the same protection as live data. Real personal or confidential data is avoided or masked where possible.',
      },
    ),
    category: 'Technological controls',
  },
  'A.8.34': {
    title: 'Protection of information systems during audit testing',
    description: i18n.translate(
      'wazuh.regulatoryCompliance.iso27001Requirements.reqA_8_34.description',
      {
        defaultMessage:
          'Audit work and technical testing on live systems are scoped, scheduled and approved by system owners and management beforehand, so they cause as little disruption as possible.',
      },
    ),
    category: 'Technological controls',
  },
};
