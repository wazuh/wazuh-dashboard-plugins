/*
 * Wazuh app - Module for ISO 27001 requirements
 * Copyright (C) 2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@osd/i18n';
export const iso27001RequirementsFile = {
  // 'A.5': 'Information Security Policies.',
  'A.5.1': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_5_1', {
    defaultMessage:
      'Management direction of information security - To provide management direction and support for information security in accordance with business requirements and relevant laws and regulations',
  }),
  'A.5.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_5_1_1',
    {
      defaultMessage:
        'Policies for Information Security - The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness',
    },
  ),
  'A.5.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_5_1_2',
    {
      defaultMessage:
        'Review of the policies for information security - The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness.',
    },
  ),
  // 'A.6': 'Organization of Information Security',
  'A.6.1': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_6_1', {
    defaultMessage:
      'Internal organization - Establish a management framework to initiate and control the implementation and operation of information security within the organization.',
  }),
  'A.6.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_1_1',
    {
      defaultMessage:
        'Information security roles and responsibilities - All information security responsibilities shall be defined and allocated.',
    },
  ),
  'A.6.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_1_2',
    {
      defaultMessage:
        "Segregation of duties - Conflicting duties and areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of the organization's assets.",
    },
  ),
  'A.6.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_1_3',
    {
      defaultMessage:
        'Contact with authorities - Appropriate contacts with relevant authorities shall be maintained.',
    },
  ),
  'A.6.1.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_1_4',
    {
      defaultMessage:
        'Contact with special interest groups - Appropriate contacts with special interest groups or other specialist security forums and professional associations shall be maintained.',
    },
  ),
  'A.6.1.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_1_5',
    {
      defaultMessage:
        'Information security in project management - Information security shall be addressed in project management, regardless of the type of project.',
    },
  ),
  'A.6.2': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_6_2', {
    defaultMessage:
      'Mobile devices and teleworking - Ensure the security of teleworking and the use of mobile devices.',
  }),
  'A.6.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_2_1',
    {
      defaultMessage:
        'Mobile device policy - A policy and supporting security measures shall be adopted to manage the risks introduced by using mobile devices.',
    },
  ),
  'A.6.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_6_2_2',
    {
      defaultMessage:
        'Teleworking - A policy and supporting security measures shall be implemented to protect information accessed, processed or stored at teleworking sites.',
    },
  ),
  // 'A.7': 'Human Resource Security',
  'A.7.1': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_7_1', {
    defaultMessage:
      'Prior to employment - Ensure that employees and contractors understand their responsibilities and are suitable for their roles.',
  }),
  'A.7.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_7_1_1',
    {
      defaultMessage:
        'Screening - Background verification checks shall be carried out in accordance with laws, regulations, ethics, and business requirements.',
    },
  ),
  'A.7.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_7_1_2',
    {
      defaultMessage:
        'Terms and conditions of employment - Contracts shall state employee, contractor, and organizational responsibilities for information security.',
    },
  ),
  'A.7.2': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_7_2', {
    defaultMessage:
      'During employment - Ensure employees and contractors are aware of and fulfil their information security responsibilities.',
  }),
  'A.7.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_7_2_1',
    {
      defaultMessage:
        'Management responsibilities - Management shall require all personnel to apply information security in accordance with established policies and procedures.',
    },
  ),
  'A.7.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_7_2_2',
    {
      defaultMessage:
        'Information security awareness, education and training - All employees and relevant contractors shall receive appropriate awareness training and regular updates.',
    },
  ),
  'A.7.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_7_2_3',
    {
      defaultMessage:
        'Disciplinary process - A formal disciplinary process shall exist to address information security breaches.',
    },
  ),
  'A.7.3': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_7_3', {
    defaultMessage:
      'Termination and change of employment - Protect the organization’s interests during employment changes or termination.',
  }),
  'A.7.3.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_7_3_1',
    {
      defaultMessage:
        'Termination or change of employment responsibilities - Post‑employment information security responsibilities shall be defined, communicated, and enforced.',
    },
  ),
  // 'A.8': 'Asset Management',
  'A.8.1': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_8_1', {
    defaultMessage:
      'Responsibility for assets - Identify organizational assets and define protection responsibilities.',
  }),
  'A.8.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_1_1',
    {
      defaultMessage:
        'Inventory of assets - Assets shall be identified and an inventory maintained.',
    },
  ),
  'A.8.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_1_2',
    {
      defaultMessage:
        'Ownership of assets - Assets in the inventory shall be owned.',
    },
  ),
  'A.8.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_1_3',
    {
      defaultMessage:
        'Acceptable use of assets - Rules for acceptable use of information and associated assets shall be documented and implemented.',
    },
  ),
  'A.8.1.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_1_4',
    {
      defaultMessage:
        'Return of assets - All organizational assets shall be returned upon termination of employment or contract.',
    },
  ),
  'A.8.2': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_8_2', {
    defaultMessage:
      'Information classification - Ensure information receives appropriate protection.',
  }),
  'A.8.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_2_1',
    {
      defaultMessage:
        'Classification of information - Information shall be classified based on legal requirements, value, criticality, and sensitivity.',
    },
  ),
  'A.8.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_2_2',
    {
      defaultMessage:
        'Labeling of information - Procedures for information labelling shall be developed and implemented.',
    },
  ),
  'A.8.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_2_3',
    {
      defaultMessage:
        'Handling of assets - Procedures for handling assets shall follow the information classification scheme.',
    },
  ),
  'A.8.3': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_8_3', {
    defaultMessage:
      'Media handling - Prevent unauthorized disclosure, modification, removal, or destruction of information stored on media.',
  }),
  'A.8.3.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_3_1',
    {
      defaultMessage:
        'Management of removable media - Procedures shall be implemented for managing removable media in accordance with the classification scheme.',
    },
  ),
  'A.8.3.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_3_2',
    {
      defaultMessage:
        'Disposal of media - Media shall be disposed of securely using formal procedures.',
    },
  ),
  'A.8.3.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_3_3',
    {
      defaultMessage:
        'Physical media transfer - Media shall be protected against unauthorized access, misuse, or corruption during transport.',
    },
  ),
  // 'A.9': 'Access Control',
  'A.9.1': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_9_1', {
    defaultMessage:
      'Business requirements of access control - Limit access to information and processing facilities.',
  }),
  'A.9.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_1_1',
    {
      defaultMessage:
        'Access control policy - An access control policy shall be established, documented, and reviewed.',
    },
  ),
  'A.9.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_1_2',
    {
      defaultMessage:
        'Access to networks and network services - Users shall only be provided access to authorized network services.',
    },
  ),
  'A.9.2': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_9_2', {
    defaultMessage:
      'User access management - Ensure authorized access and prevent unauthorized access.',
  }),
  'A.9.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_2_1',
    {
      defaultMessage:
        'User registration and de-registration - A formal process shall be implemented to assign and revoke access rights.',
    },
  ),
  'A.9.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_2_2',
    {
      defaultMessage:
        'User access provisioning - A formal process shall assign or revoke access rights for all user types.',
    },
  ),
  'A.9.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_2_3',
    {
      defaultMessage:
        'Management of privileged access rights - Allocation and use of privileged access rights shall be restricted and controlled.',
    },
  ),
  'A.9.2.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_2_4',
    {
      defaultMessage:
        'Management of secret authentication information - Allocation of secret authentication information shall be controlled through a formal process.',
    },
  ),
  'A.9.2.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_2_5',
    {
      defaultMessage:
        'Review of user access rights - Asset owners shall review user access rights at regular intervals.',
    },
  ),
  'A.9.2.6': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_2_6',
    {
      defaultMessage:
        'Removal or adjustment of access rights - Access rights of all employees and external users shall be removed upon termination or adjusted upon change of employment or contract.',
    },
  ),
  'A.9.3': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_9_3', {
    defaultMessage:
      'User responsibilities - Prevent unauthorized access to systems and applications.',
  }),
  'A.9.3.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_3_1',
    {
      defaultMessage:
        'User responsibilities - Users shall be accountable for safeguarding their authentication information.',
    },
  ),
  'A.9.4': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_9_4', {
    defaultMessage:
      'System and application access control - Prevent unauthorized access to systems and applications.',
  }),
  'A.9.4.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_4_1',
    {
      defaultMessage:
        'Information access restriction - Access to information and application system functions shall be restricted in accordance with the access control policy.',
    },
  ),
  'A.9.4.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_4_2',
    {
      defaultMessage:
        'Secure log-on procedures - Where required by policy, access to systems and applications shall be controlled by a secure log‑on procedure.',
    },
  ),
  'A.9.4.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_4_3',
    {
      defaultMessage:
        'Password management system - Password management systems shall be interactive and ensure quality passwords.',
    },
  ),
  'A.9.4.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_4_4',
    {
      defaultMessage:
        'Use of privileged utility programs - Use of utility programs capable of overriding system or application controls shall be restricted and tightly controlled.',
    },
  ),
  'A.9.4.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_9_4_5',
    {
      defaultMessage:
        'Access control to program source code - Access to program source code shall be restricted.',
    },
  ),
  // 'A.10': 'Cryptography',
  'A.10.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_10_1',
    {
      defaultMessage:
        'Cryptographic controls - Ensure proper and effective use of cryptography to protect confidentiality, authenticity, and integrity of information.',
    },
  ),
  'A.10.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_10_1_1',
    {
      defaultMessage:
        'Policy on the use of cryptographic controls - A policy for the use of cryptographic controls to protect information shall be developed and implemented.',
    },
  ),
  'A.10.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_10_1_2',
    {
      defaultMessage:
        'Key management - A policy on the use, protection, and lifecycle management of cryptographic keys shall be developed and implemented.',
    },
  ),
  // 'A.11': 'Physical and Environmental Security',
  'A.11.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1',
    {
      defaultMessage:
        'Secure areas - Prevent unauthorized physical access, damage, and interference to information and information processing facilities.',
    },
  ),
  'A.11.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1_1',
    {
      defaultMessage:
        'Physical security perimeter - Security perimeters shall be defined and used to protect areas containing sensitive or critical information and processing facilities.',
    },
  ),
  'A.11.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1_2',
    {
      defaultMessage:
        'Physical entry controls - Secure areas shall be protected by appropriate entry controls to ensure only authorized personnel are allowed access.',
    },
  ),
  'A.11.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1_3',
    {
      defaultMessage:
        'Securing offices, rooms and facilities - Physical security for offices, rooms, and facilities shall be designed and applied.',
    },
  ),
  'A.11.1.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1_4',
    {
      defaultMessage:
        'Protecting against external and environmental threats - Physical protection against natural disasters, malicious attacks, or accidents shall be designed and applied.',
    },
  ),
  'A.11.1.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1_5',
    {
      defaultMessage:
        'Working in secure areas - Procedures for working in secure areas shall be designed and applied.',
    },
  ),
  'A.11.1.6': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_1_6',
    {
      defaultMessage:
        'Delivery and loading areas - Access points such as delivery and loading areas shall be controlled and, if possible, isolated from information processing facilities to avoid unauthorized access.',
    },
  ),
  'A.11.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2',
    {
      defaultMessage:
        'Equipment - Prevent loss, damage, theft, or compromise of assets and avoid operational interruptions.',
    },
  ),
  'A.11.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_1',
    {
      defaultMessage:
        'Equipment siting and protection - Equipment shall be sited and protected to reduce risks from environmental threats, hazards, and unauthorized access.',
    },
  ),
  'A.11.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_2',
    {
      defaultMessage:
        'Supporting utilities - Equipment shall be protected from power failures and other disruptions caused by failures in supporting utilities.',
    },
  ),
  'A.11.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_3',
    {
      defaultMessage:
        'Cabling security - Power and telecommunications cabling carrying data or supporting information services shall be protected from interception, interference, or damage.',
    },
  ),
  'A.11.2.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_4',
    {
      defaultMessage:
        'Equipment maintenance - Equipment shall be correctly maintained to ensure continued availability and integrity.',
    },
  ),
  'A.11.2.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_5',
    {
      defaultMessage:
        'Removal of assets - Equipment, information, or software shall not be taken off‑site without prior authorization.',
    },
  ),
  'A.11.2.6': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_6',
    {
      defaultMessage:
        'Security of equipment and assets off‑premises - Security shall be applied to off‑site assets, considering the different risks of working outside the organization’s premises.',
    },
  ),
  'A.11.2.7': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_7',
    {
      defaultMessage:
        'Secure disposal or re‑use of equipment - All equipment containing storage media shall be verified to ensure sensitive data and licensed software have been removed or securely overwritten before disposal or re‑use.',
    },
  ),
  'A.11.2.8': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_8',
    {
      defaultMessage:
        'Unattended user equipment - Users shall ensure that unattended equipment has appropriate protection.',
    },
  ),
  'A.11.2.9': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_11_2_9',
    {
      defaultMessage:
        'Clear desk and clear screen policy - A clear desk policy for papers and removable media, and a clear screen policy for information processing facilities, shall be adopted.',
    },
  ),
  // 'A.12': 'Operations Security',
  'A.12.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_1',
    {
      defaultMessage:
        'Operational procedures and responsibilities - Ensure correct and secure operations of information processing facilities.',
    },
  ),
  'A.12.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_1_1',
    {
      defaultMessage:
        'Documented operating procedures - Operating procedures shall be documented and made available to all users who need them.',
    },
  ),
  'A.12.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_1_2',
    {
      defaultMessage:
        'Change management - Changes to the organization, business processes, information processing facilities, and systems that affect information security shall be controlled.',
    },
  ),
  'A.12.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_1_3',
    {
      defaultMessage:
        'Capacity management - Resource usage shall be monitored, tuned, and projected to ensure required system performance.',
    },
  ),
  'A.12.1.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_1_4',
    {
      defaultMessage:
        'Separation of development, testing and operational environments - These environments shall be separated to reduce risks of unauthorized access or changes to the operational environment.',
    },
  ),
  'A.12.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_2',
    {
      defaultMessage:
        'Protection from malware - Ensure information and information processing facilities are protected against malware.',
    },
  ),
  'A.12.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_2_1',
    {
      defaultMessage:
        'Controls against malware - Detection, prevention, and recovery controls against malware shall be implemented, combined with appropriate user awareness.',
    },
  ),
  'A.12.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_3',
    { defaultMessage: 'Backup - Protect against loss of data.' },
  ),
  'A.12.3.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_3_1',
    {
      defaultMessage:
        'Information backup - Backup copies of information, software, and system images shall be taken and tested regularly in accordance with an agreed backup policy.',
    },
  ),
  'A.12.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_4',
    {
      defaultMessage:
        'Logging and monitoring - Record events and generate evidence.',
    },
  ),
  'A.12.4.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_4_1',
    {
      defaultMessage:
        'Event logging - Event logs recording user activities, exceptions, faults, and information security events shall be produced, kept, and regularly reviewed.',
    },
  ),
  'A.12.4.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_4_2',
    {
      defaultMessage:
        'Protection of log information - Logging facilities and log information shall be protected against tampering and unauthorized access.',
    },
  ),
  'A.12.4.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_4_3',
    {
      defaultMessage:
        'Administrator and operator logs - System administrator and operator activities shall be logged, protected, and regularly reviewed.',
    },
  ),
  'A.12.4.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_4_4',
    {
      defaultMessage:
        'Clock synchronization - Clocks of all relevant information processing systems shall be synchronized to a single reference time source.',
    },
  ),
  'A.12.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_5',
    {
      defaultMessage:
        'Control of operational software - Ensure the integrity of operational systems.',
    },
  ),
  'A.12.5.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_5_1',
    {
      defaultMessage:
        'Installation of software on operational systems - Procedures shall be implemented to control the installation of software on operational systems.',
    },
  ),
  'A.12.6': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_6',
    {
      defaultMessage:
        'Technical vulnerability management - Prevent exploitation of technical vulnerabilities.',
    },
  ),
  'A.12.6.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_6_1',
    {
      defaultMessage:
        'Management of technical vulnerabilities - Information about technical vulnerabilities shall be obtained in a timely manner, exposure evaluated, and appropriate measures taken.',
    },
  ),
  'A.12.6.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_6_2',
    {
      defaultMessage:
        'Restrictions on software installation - Rules governing software installation by users shall be established and implemented.',
    },
  ),
  'A.12.7': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_7',
    {
      defaultMessage:
        'Information systems audit considerations - Minimize the impact of audit activities on operational systems.',
    },
  ),
  'A.12.7.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_12_7_1',
    {
      defaultMessage:
        'Information systems audit controls - Audit requirements and activities shall be carefully planned and agreed to minimize disruptions to business processes.',
    },
  ),
  // 'A.13': 'Communications Security',
  'A.13.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_1',
    {
      defaultMessage:
        'Network security management - Ensure protection of information in networks and supporting information processing facilities.',
    },
  ),
  'A.13.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_1_1',
    {
      defaultMessage:
        'Network controls - Networks shall be managed and controlled to protect information in systems and applications.',
    },
  ),
  'A.13.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_1_2',
    {
      defaultMessage:
        'Security of network services - Security mechanisms, service levels, and management requirements of all network services shall be identified and included in service agreements, whether provided in‑house or outsourced.',
    },
  ),
  'A.13.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_1_3',
    {
      defaultMessage:
        'Segregation in networks - Groups of information services, users, and information systems shall be segregated on networks.',
    },
  ),
  'A.13.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_2',
    {
      defaultMessage:
        'Information transfer - Maintain the security of information transferred within the organization and with external entities.',
    },
  ),
  'A.13.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_2_1',
    {
      defaultMessage:
        'Information transfer policies and procedures - Formal transfer policies, procedures, and controls shall protect information transferred via all communication facilities.',
    },
  ),
  'A.13.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_2_2',
    {
      defaultMessage:
        'Agreements on information transfer - Agreements shall address the secure transfer of business information between the organization and external parties.',
    },
  ),
  'A.13.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_2_3',
    {
      defaultMessage:
        'Electronic messaging - Information involved in electronic messaging shall be appropriately protected.',
    },
  ),
  'A.13.2.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_13_2_4',
    {
      defaultMessage:
        'Confidentiality or non‑disclosure agreements - Requirements for confidentiality or non‑disclosure agreements shall be identified, documented, and regularly reviewed to reflect organizational needs.',
    },
  ),
  // 'A.14': 'System acquisition, development and maintenance',
  'A.14.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_1',
    {
      defaultMessage:
        'Security requirements of information systems - Ensure information security is integrated into information systems across their entire lifecycle, including systems providing services over public networks.',
    },
  ),
  'A.14.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_1_1',
    {
      defaultMessage:
        'Information security requirements analysis and specification - Information security requirements shall be included in requirements for new systems or enhancements to existing systems.',
    },
  ),
  'A.14.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_1_2',
    {
      defaultMessage:
        'Securing application services on public networks - Information in application services passing over public networks shall be protected from fraudulent activity, contract disputes, and unauthorized disclosure or modification.',
    },
  ),
  'A.14.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_1_3',
    {
      defaultMessage:
        'Protecting application service transactions - Information in application service transactions shall be protected to prevent incomplete transmission, misrouting, unauthorized alteration, unauthorized disclosure, duplication, or replay.',
    },
  ),
  'A.14.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2',
    {
      defaultMessage:
        'Security in development and support processes - Ensure information security is designed and implemented within the development lifecycle.',
    },
  ),
  'A.14.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_1',
    {
      defaultMessage:
        'Secure development policy - Rules for secure software and system development shall be established and applied.',
    },
  ),
  'A.14.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_2',
    {
      defaultMessage:
        'System change control procedures - Changes to systems within the development lifecycle shall be controlled through formal change control procedures.',
    },
  ),
  'A.14.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_3',
    {
      defaultMessage:
        'Technical review of applications after operating platform changes - Business‑critical applications shall be reviewed and tested after platform changes to ensure no adverse operational or security impact.',
    },
  ),
  'A.14.2.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_4',
    {
      defaultMessage:
        'Restrictions on changes to software packages - Modifications to software packages shall be discouraged, limited to necessary changes, and strictly controlled.',
    },
  ),
  'A.14.2.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_5',
    {
      defaultMessage:
        'Secure system engineering principles - Principles for engineering secure systems shall be established, documented, maintained, and applied.',
    },
  ),
  'A.14.2.6': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_6',
    {
      defaultMessage:
        'Secure development environment - Secure development environments shall be established and appropriately protected throughout the system development lifecycle.',
    },
  ),
  'A.14.2.7': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_7',
    {
      defaultMessage:
        'Outsourced development - The organization shall supervise and monitor outsourced system development activities.',
    },
  ),
  'A.14.2.8': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_8',
    {
      defaultMessage:
        'System security testing - Security functionality shall be tested during development.',
    },
  ),
  'A.14.2.9': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_2_9',
    {
      defaultMessage:
        'System acceptance testing - Acceptance testing programs and criteria shall be established for new systems, upgrades, and new versions.',
    },
  ),
  'A.14.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_3',
    {
      defaultMessage: 'Test data - Ensure protection of data used for testing.',
    },
  ),
  'A.14.3.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_14_3_1',
    {
      defaultMessage:
        'Protection of test data - Test data shall be selected carefully, protected, and controlled.',
    },
  ),
  // 'A.15': 'Supplier relationships',
  'A.15.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_1',
    {
      defaultMessage:
        'Information security policy for supplier relationships - Ensure protection of organizational assets accessible by suppliers.',
    },
  ),
  'A.15.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_1_1',
    {
      defaultMessage:
        'Information security policy for supplier relationships - Information security requirements for mitigating supplier access risks shall be agreed and documented.',
    },
  ),
  'A.15.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_1_2',
    {
      defaultMessage:
        'Addressing security within supplier agreements - All relevant information security requirements shall be established and agreed with each supplier that may access, process, store, communicate, or provide IT infrastructure components for organizational information.',
    },
  ),
  'A.15.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_1_3',
    {
      defaultMessage:
        'Information and communications technology supply chain - Supplier agreements shall include requirements addressing information security risks associated with ICT services and product supply chains.',
    },
  ),
  'A.15.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_2',
    {
      defaultMessage:
        'Supplier service delivery management - Maintain agreed levels of information security and service delivery in line with supplier agreements.',
    },
  ),
  'A.15.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_2_1',
    {
      defaultMessage:
        'Monitoring and review of supplier services - Organizations shall regularly monitor, review, and audit supplier service delivery.',
    },
  ),
  'A.15.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_15_2_2',
    {
      defaultMessage:
        'Managing changes to supplier services - Changes to supplier‑provided services shall be managed, considering business criticality and reassessed risks.',
    },
  ),
  // 'A.16': 'Information security incident management',
  'A.16.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1',
    {
      defaultMessage:
        'Management of information security incidents and improvements - Ensure a consistent and effective approach to managing information security incidents, including communication of events and weaknesses.',
    },
  ),
  'A.16.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_1',
    {
      defaultMessage:
        'Responsibilities and procedures - Management responsibilities and procedures shall ensure a quick, effective, and orderly response to information security incidents.',
    },
  ),
  'A.16.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_2',
    {
      defaultMessage:
        'Reporting information security events - Information security events shall be reported through appropriate management channels as quickly as possible.',
    },
  ),
  'A.16.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_3',
    {
      defaultMessage:
        'Reporting information security weaknesses - Employees and contractors shall report observed or suspected information security weaknesses in systems or services.',
    },
  ),
  'A.16.1.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_4',
    {
      defaultMessage:
        'Assessment of and decision on information security events - Information security events shall be assessed and classified as incidents when appropriate.',
    },
  ),
  'A.16.1.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_5',
    {
      defaultMessage:
        'Response to information security incidents - Information security incidents shall be responded to according to documented procedures.',
    },
  ),
  'A.16.1.6': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_6',
    {
      defaultMessage:
        'Learning from information security incidents - Knowledge gained from analyzing and resolving incidents shall be used to reduce future likelihood or impact.',
    },
  ),
  'A.16.1.7': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_16_1_7',
    {
      defaultMessage:
        'Collection of evidence - Procedures shall be defined and applied for identifying, collecting, acquiring, and preserving information that may serve as evidence.',
    },
  ),
  // 'A.17': 'Information security aspects of business continuity management',
  'A.17.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_17_1',
    {
      defaultMessage:
        'Information security continuity - Embed information security continuity into the organization’s business continuity management systems.',
    },
  ),
  'A.17.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_17_1_1',
    {
      defaultMessage:
        'Planning information security continuity - The organization shall determine its requirements for information security and continuity during adverse situations such as crises or disasters.',
    },
  ),
  'A.17.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_17_1_2',
    {
      defaultMessage:
        'Implementing information security continuity - The organization shall establish, document, implement, and maintain processes, procedures, and controls to ensure required continuity of information security during adverse situations.',
    },
  ),
  'A.17.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_17_1_3',
    {
      defaultMessage:
        'Verify, review and evaluate information security continuity - Information security continuity controls shall be regularly verified to ensure they remain valid and effective during adverse situations.',
    },
  ),
  'A.17.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_17_2',
    {
      defaultMessage:
        'Redundancies - Ensure availability of information processing facilities.',
    },
  ),
  'A.17.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_17_2_1',
    {
      defaultMessage:
        'Availability of information processing facilities - Information processing facilities shall be implemented with sufficient redundancy to meet availability requirements.',
    },
  ),
  // 'A.18': 'Compliance',
  'A.18.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_1',
    {
      defaultMessage:
        'Compliance with legal and contractual requirements - Avoid breaches of legal, statutory, regulatory, or contractual obligations related to information security.',
    },
  ),
  'A.18.1.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_1_1',
    {
      defaultMessage:
        'Identification of applicable legislation and contractual requirements - All relevant legal, regulatory, and contractual requirements shall be identified, documented, and kept up to date.',
    },
  ),
  'A.18.1.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_1_2',
    {
      defaultMessage:
        'Intellectual property rights - Procedures shall ensure compliance with legal, regulatory, and contractual requirements related to intellectual property rights and use of proprietary software.',
    },
  ),
  'A.18.1.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_1_3',
    {
      defaultMessage:
        'Protection of records - Records shall be protected from loss, destruction, falsification, unauthorized access, and unauthorized release in accordance with applicable requirements.',
    },
  ),
  'A.18.1.4': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_1_4',
    {
      defaultMessage:
        'Privacy and protection of personally identifiable information - Privacy and protection of PII shall be ensured as required by relevant legislation and regulations.',
    },
  ),
  'A.18.1.5': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_1_5',
    {
      defaultMessage:
        'Regulation of cryptographic controls - Cryptographic controls shall be used in compliance with relevant agreements, legislation, and regulations.',
    },
  ),
  'A.18.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_2',
    {
      defaultMessage:
        'Information security reviews - Ensure information security is implemented and operated in accordance with organizational policies and procedures.',
    },
  ),
  'A.18.2.1': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_2_1',
    {
      defaultMessage:
        'Independent review of information security - The organization’s information security approach shall be independently reviewed at planned intervals or when significant changes occur.',
    },
  ),
  'A.18.2.2': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_2_2',
    {
      defaultMessage:
        'Compliance with security policies and standards - Managers shall regularly review compliance of information processing and procedures with security policies, standards, and requirements.',
    },
  ),
  'A.18.2.3': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_18_2_3',
    {
      defaultMessage:
        'Technical compliance review - Information systems shall be regularly reviewed for compliance with the organization’s information security policies and standards.',
    },
  ),
  // ISO/IEC 27001:2022 Annex A numbering
  'A.5.17': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_5_17',
    {
      defaultMessage:
        'Authentication information - Allocation and management of authentication information shall be controlled by a management process, including advising personnel on the appropriate handling of authentication information.',
    },
  ),
  'A.5.18': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_5_18',
    {
      defaultMessage:
        'Access rights - Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization’s topic-specific policy on and rules for access control.',
    },
  ),
  'A.5.24': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_5_24',
    {
      defaultMessage:
        'Information security incident management planning and preparation - The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.',
    },
  ),
  'A.5.30': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_5_30',
    {
      defaultMessage:
        'ICT readiness for business continuity - ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.',
    },
  ),
  'A.8.9': i18n.translate('wazuh.complianceTable.iso27001Requirements.A_8_9', {
    defaultMessage:
      'Configuration management - Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.',
  }),
  'A.8.16': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_16',
    {
      defaultMessage:
        'Monitoring activities - Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.',
    },
  ),
  'A.8.23': i18n.translate(
    'wazuh.complianceTable.iso27001Requirements.A_8_23',
    {
      defaultMessage:
        'Web filtering - Access to external websites shall be managed to reduce exposure to malicious content.',
    },
  ),
};
