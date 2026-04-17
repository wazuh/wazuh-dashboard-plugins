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
export const nis2RequirementsFile = {
  '21.1':
    'Member States shall ensure that essential and important entities take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems.',
  '21.2.a': 'Policies on risk analysis and information system security.',
  '21.2.a.1':
    'Establish, maintain and regularly review a documented information security risk management process covering identification, analysis and evaluation of cybersecurity risks.',
  '21.2.a.2':
    'Define and enforce information security policies approved by senior management and communicated to all relevant personnel.',
  '21.2.a.3':
    'Conduct periodic security assessments of network and information systems to verify that controls remain effective and proportionate to identified risks.',
  '21.2.b': 'Incident handling.',
  '21.2.b.1':
    'Implement procedures for the detection, classification and initial triage of cybersecurity incidents affecting network and information systems.',
  '21.2.b.2':
    'Define and test an incident response plan including roles, escalation paths, communication procedures and recovery actions.',
  '21.2.b.3':
    'Conduct post-incident reviews to identify root causes, lessons learned and improvements to prevent recurrence.',
  '21.2.b.4':
    'Maintain records of incidents, response actions taken and outcomes for audit and regulatory purposes.',
  '21.2.c':
    'Business continuity, such as backup management and disaster recovery, and crisis management.',
  '21.2.c.1':
    'Establish and regularly test backup procedures ensuring that critical data and system configurations can be restored within defined recovery time objectives.',
  '21.2.c.2':
    'Develop, maintain and periodically test a disaster recovery plan covering failover, system restoration and resumption of essential services.',
  '21.2.c.3':
    'Define and exercise a crisis management plan that addresses severe or widespread cybersecurity incidents, including coordination with competent authorities.',
  '21.2.d':
    'Supply chain security, including security-related aspects concerning the relationships between each entity and its direct suppliers or service providers.',
  '21.2.d.1':
    'Maintain an up-to-date inventory of direct suppliers and service providers that have access to or process data on behalf of the entity.',
  '21.2.d.2':
    'Assess the cybersecurity posture of direct suppliers and service providers and include security requirements in contractual agreements.',
  '21.2.d.3':
    'Monitor ongoing compliance of suppliers and service providers with agreed security requirements and review those requirements when significant changes occur.',
  '21.2.e':
    'Security in network and information systems acquisition, development and maintenance, including vulnerability handling and disclosure.',
  '21.2.e.1':
    'Integrate security requirements into the procurement and acquisition process for network and information systems, components and services.',
  '21.2.e.2':
    'Apply secure development practices throughout the software development lifecycle, including code review, static analysis and security testing.',
  '21.2.e.3':
    'Establish a vulnerability management process to identify, prioritise, remediate and track vulnerabilities affecting network and information systems.',
  '21.2.e.4':
    'Implement a coordinated vulnerability disclosure policy enabling researchers and third parties to report vulnerabilities in a responsible manner.',
  '21.2.f':
    'Policies and procedures to assess the effectiveness of cybersecurity risk-management measures.',
  '21.2.f.1':
    'Define security metrics and key performance indicators to measure the effectiveness of cybersecurity controls on a continuous basis.',
  '21.2.f.2':
    'Conduct periodic internal or external cybersecurity audits and penetration tests to validate the effectiveness of implemented controls.',
  '21.2.f.3':
    'Report results of effectiveness assessments to senior management and use findings to drive continual improvement of the security programme.',
  '21.2.g': 'Basic cyber hygiene practices and cybersecurity training.',
  '21.2.g.1':
    'Enforce baseline cyber hygiene measures including timely patching, endpoint protection, use of strong authentication and network segmentation.',
  '21.2.g.2':
    'Provide role-based cybersecurity awareness training to all staff, with enhanced technical training for personnel with security responsibilities.',
  '21.2.g.3':
    'Conduct regular simulated phishing and social-engineering exercises to test and improve staff security awareness.',
  '21.2.h':
    'Policies and procedures regarding the use of cryptography and, where appropriate, encryption.',
  '21.2.h.1':
    'Define a cryptography policy that specifies approved algorithms, key lengths, protocols and use cases for protecting data at rest and in transit.',
  '21.2.h.2':
    'Implement key management procedures covering key generation, distribution, storage, rotation, revocation and destruction.',
  '21.2.h.3':
    'Enforce encryption of sensitive data in transit using strong protocols (e.g., TLS 1.2+) and protect sensitive data at rest with appropriate encryption mechanisms.',
  '21.2.i':
    'Human resources security, access control policies and asset management.',
  '21.2.i.1':
    'Apply personnel security controls including background checks, confidentiality agreements and security responsibilities during onboarding, employment and offboarding.',
  '21.2.i.2':
    'Implement access control policies based on least-privilege and need-to-know principles, and review access rights regularly and upon role changes.',
  '21.2.i.3':
    'Manage privileged access through dedicated accounts, just-in-time access mechanisms and enhanced monitoring of privileged sessions.',
  '21.2.i.4':
    'Maintain a complete and up-to-date inventory of hardware, software and data assets, with ownership, classification and criticality assigned to each asset.',
  '21.2.j':
    'The use of multi-factor authentication or continuous authentication solutions, secured voice, video and text communications and secured emergency communication systems within the entity, where appropriate.',
  '21.2.j.1':
    'Enforce multi-factor authentication for all remote access, privileged accounts and access to critical systems or sensitive data.',
  '21.2.j.2':
    'Protect internal voice, video and text communications through end-to-end encryption or equivalent security controls.',
  '21.2.j.3':
    'Establish and maintain secured out-of-band emergency communication channels that remain operational during a cybersecurity incident.',

  '23.1':
    "Notify the competent authority or CSIRT without undue delay, and in any event within 24 hours of becoming aware, of any significant incident affecting the provision of the entity's services.",
  '23.2':
    'Submit an incident notification to the competent authority or CSIRT within 72 hours of becoming aware of a significant incident, including an initial assessment of severity, impact and indicators of compromise.',
  '23.3':
    'Provide a final incident report to the competent authority no later than one month after submission of the incident notification, including a detailed description of the incident, root cause analysis, cross-border impact and remediation measures taken.',
  '23.4':
    "Notify significant incidents to recipients of the entity's services that are likely to be adversely affected, where early notification is necessary to prevent or limit the impact of the incident.",
};
