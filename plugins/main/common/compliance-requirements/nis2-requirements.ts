/*
 * Wazuh app - Module for NIS2 requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Source: https://eur-lex.europa.eu/eli/dir/2022/2555/oj
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@osd/i18n';
export const nis2RequirementsFile = {
  '21.1': i18n.translate('wazuh.complianceTable.nis2Requirements.21_1', {
    defaultMessage:
      'Member States shall ensure that essential and important entities take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems.',
  }),
  '21.2.a': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_a', {
    defaultMessage:
      'Policies on risk analysis and information system security.',
  }),
  '21.2.a.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_a_1',
    {
      defaultMessage:
        'Establish, maintain and regularly review a documented information security risk management process covering identification, analysis and evaluation of cybersecurity risks.',
    },
  ),
  '21.2.a.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_a_2',
    {
      defaultMessage:
        'Define and enforce information security policies approved by senior management and communicated to all relevant personnel.',
    },
  ),
  '21.2.a.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_a_3',
    {
      defaultMessage:
        'Conduct periodic security assessments of network and information systems to verify that controls remain effective and proportionate to identified risks.',
    },
  ),
  '21.2.b': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_b', {
    defaultMessage: 'Incident handling.',
  }),
  '21.2.b.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_b_1',
    {
      defaultMessage:
        'Implement procedures for the detection, classification and initial triage of cybersecurity incidents affecting network and information systems.',
    },
  ),
  '21.2.b.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_b_2',
    {
      defaultMessage:
        'Define and test an incident response plan including roles, escalation paths, communication procedures and recovery actions.',
    },
  ),
  '21.2.b.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_b_3',
    {
      defaultMessage:
        'Conduct post-incident reviews to identify root causes, lessons learned and improvements to prevent recurrence.',
    },
  ),
  '21.2.b.4': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_b_4',
    {
      defaultMessage:
        'Maintain records of incidents, response actions taken and outcomes for audit and regulatory purposes.',
    },
  ),
  '21.2.c': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_c', {
    defaultMessage:
      'Business continuity, such as backup management and disaster recovery, and crisis management.',
  }),
  '21.2.c.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_c_1',
    {
      defaultMessage:
        'Establish and regularly test backup procedures ensuring that critical data and system configurations can be restored within defined recovery time objectives.',
    },
  ),
  '21.2.c.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_c_2',
    {
      defaultMessage:
        'Develop, maintain and periodically test a disaster recovery plan covering failover, system restoration and resumption of essential services.',
    },
  ),
  '21.2.c.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_c_3',
    {
      defaultMessage:
        'Define and exercise a crisis management plan that addresses severe or widespread cybersecurity incidents, including coordination with competent authorities.',
    },
  ),
  '21.2.d': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_d', {
    defaultMessage:
      'Supply chain security, including security-related aspects concerning the relationships between each entity and its direct suppliers or service providers.',
  }),
  '21.2.d.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_d_1',
    {
      defaultMessage:
        'Maintain an up-to-date inventory of direct suppliers and service providers that have access to or process data on behalf of the entity.',
    },
  ),
  '21.2.d.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_d_2',
    {
      defaultMessage:
        'Assess the cybersecurity posture of direct suppliers and service providers and include security requirements in contractual agreements.',
    },
  ),
  '21.2.d.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_d_3',
    {
      defaultMessage:
        'Monitor ongoing compliance of suppliers and service providers with agreed security requirements and review those requirements when significant changes occur.',
    },
  ),
  '21.2.e': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_e', {
    defaultMessage:
      'Security in network and information systems acquisition, development and maintenance, including vulnerability handling and disclosure.',
  }),
  '21.2.e.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_e_1',
    {
      defaultMessage:
        'Integrate security requirements into the procurement and acquisition process for network and information systems, components and services.',
    },
  ),
  '21.2.e.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_e_2',
    {
      defaultMessage:
        'Apply secure development practices throughout the software development lifecycle, including code review, static analysis and security testing.',
    },
  ),
  '21.2.e.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_e_3',
    {
      defaultMessage:
        'Establish a vulnerability management process to identify, prioritise, remediate and track vulnerabilities affecting network and information systems.',
    },
  ),
  '21.2.e.4': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_e_4',
    {
      defaultMessage:
        'Implement a coordinated vulnerability disclosure policy enabling researchers and third parties to report vulnerabilities in a responsible manner.',
    },
  ),
  '21.2.f': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_f', {
    defaultMessage:
      'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures.',
  }),
  '21.2.f.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_f_1',
    {
      defaultMessage:
        'Define security metrics and key performance indicators to measure the effectiveness of cybersecurity controls on a continuous basis.',
    },
  ),
  '21.2.f.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_f_2',
    {
      defaultMessage:
        'Conduct periodic internal or external cybersecurity audits and penetration tests to validate the effectiveness of implemented controls.',
    },
  ),
  '21.2.f.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_f_3',
    {
      defaultMessage:
        'Report results of effectiveness assessments to senior management and use findings to drive continual improvement of the security programme.',
    },
  ),
  '21.2.g': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_g', {
    defaultMessage: 'Basic cyber hygiene practices and cybersecurity training.',
  }),
  '21.2.g.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_g_1',
    {
      defaultMessage:
        'Enforce baseline cyber hygiene measures including timely patching, endpoint protection, use of strong authentication and network segmentation.',
    },
  ),
  '21.2.g.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_g_2',
    {
      defaultMessage:
        'Provide role-based cybersecurity awareness training to all staff, with enhanced technical training for personnel with security responsibilities.',
    },
  ),
  '21.2.g.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_g_3',
    {
      defaultMessage:
        'Conduct regular simulated phishing and social-engineering exercises to test and improve staff security awareness.',
    },
  ),
  '21.2.h': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_h', {
    defaultMessage:
      'Policies and procedures regarding the use of cryptography and, where appropriate, encryption.',
  }),
  '21.2.h.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_h_1',
    {
      defaultMessage:
        'Define a cryptography policy that specifies approved algorithms, key lengths, protocols and use cases for protecting data at rest and in transit.',
    },
  ),
  '21.2.h.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_h_2',
    {
      defaultMessage:
        'Implement key management procedures covering key generation, distribution, storage, rotation, revocation and destruction.',
    },
  ),
  '21.2.h.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_h_3',
    {
      defaultMessage:
        'Enforce encryption of sensitive data in transit using strong protocols (e.g., TLS 1.2+) and protect sensitive data at rest with appropriate encryption mechanisms.',
    },
  ),
  '21.2.i': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_i', {
    defaultMessage:
      'Human resources security, access control policies and asset management.',
  }),
  '21.2.i.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_i_1',
    {
      defaultMessage:
        'Apply personnel security controls including background checks, confidentiality agreements and security responsibilities during onboarding, employment and offboarding.',
    },
  ),
  '21.2.i.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_i_2',
    {
      defaultMessage:
        'Implement access control policies based on least-privilege and need-to-know principles, and review access rights regularly and upon role changes.',
    },
  ),
  '21.2.i.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_i_3',
    {
      defaultMessage:
        'Manage privileged access through dedicated accounts, just-in-time access mechanisms and enhanced monitoring of privileged sessions.',
    },
  ),
  '21.2.i.4': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_i_4',
    {
      defaultMessage:
        'Maintain a complete and up-to-date inventory of hardware, software and data assets, with ownership, classification and criticality assigned to each asset.',
    },
  ),
  '21.2.j': i18n.translate('wazuh.complianceTable.nis2Requirements.21_2_j', {
    defaultMessage:
      'The use of multi-factor authentication or continuous authentication solutions, secured voice, video and text communications and secured emergency communication systems within the entity, where appropriate.',
  }),
  '21.2.j.1': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_j_1',
    {
      defaultMessage:
        'Enforce multi-factor authentication for all remote access, privileged accounts and access to critical systems or sensitive data.',
    },
  ),
  '21.2.j.2': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_j_2',
    {
      defaultMessage:
        'Protect internal voice, video and text communications through end-to-end encryption or equivalent security controls.',
    },
  ),
  '21.2.j.3': i18n.translate(
    'wazuh.complianceTable.nis2Requirements.21_2_j_3',
    {
      defaultMessage:
        'Establish and maintain secured out-of-band emergency communication channels that remain operational during a cybersecurity incident.',
    },
  ),
  '23': i18n.translate('wazuh.complianceTable.nis2Requirements.23', {
    defaultMessage:
      'Reporting obligations. Essential and important entities shall notify, without undue delay, the competent authority or the CSIRT of any incident that has a significant impact on the provision of their services (a significant incident).',
  }),
  '23.1': i18n.translate('wazuh.complianceTable.nis2Requirements.23_1', {
    defaultMessage:
      "Notify the competent authority or CSIRT without undue delay, and in any event within 24 hours of becoming aware, of any significant incident affecting the provision of the entity's services.",
  }),
  '23.2': i18n.translate('wazuh.complianceTable.nis2Requirements.23_2', {
    defaultMessage:
      'Submit an incident notification to the competent authority or CSIRT within 72 hours of becoming aware of a significant incident, including an initial assessment of severity, impact and indicators of compromise.',
  }),
  '23.3': i18n.translate('wazuh.complianceTable.nis2Requirements.23_3', {
    defaultMessage:
      'Provide a final incident report to the competent authority no later than one month after submission of the incident notification, including a detailed description of the incident, root cause analysis, cross-border impact and remediation measures taken.',
  }),
  '23.4': i18n.translate('wazuh.complianceTable.nis2Requirements.23_4', {
    defaultMessage:
      "Notify significant incidents to recipients of the entity's services that are likely to be adversely affected, where early notification is necessary to prevent or limit the impact of the incident.",
  }),
};
