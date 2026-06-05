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
export const iso27001RequirementsFile = {
  // 'A.5': 'Information Security Policies.',
  'A.5.1':
    'Management direction of information security - To provide management direction and support for information security in accordance with business requirements and relevant laws and regulations',
  'A.5.1.1':
    'Policies for Information Security - The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness',
  'A.5.1.2':
    'Review of the policies for information security - The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness.',
  // 'A.6': 'Organization of Information Security',
  'A.6.1':
    'Internal organization - Establish a management framework to initiate and control the implementation and operation of information security within the organization.',
  'A.6.1.1':
    'Information security roles and responsibilities - All information security responsibilities shall be defined and allocated.',
  'A.6.1.2':
    "Segregation of duties - Conflicting duties and areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of the organization's assets.",
  'A.6.1.3':
    'Contact with authorities - Appropriate contacts with relevant authorities shall be maintained.',
  'A.6.1.4':
    'Contact with special interest groups - Appropriate contacts with special interest groups or other specialist security forums and professional associations shall be maintained.',
  'A.6.1.5':
    'Information security in project management - Information security shall be addressed in project management, regardless of the type of project.',
  'A.6.2':
    'Mobile devices and teleworking - Ensure the security of teleworking and the use of mobile devices.',
  'A.6.2.1':
    'Mobile device policy - A policy and supporting security measures shall be adopted to manage the risks introduced by using mobile devices.',
  'A.6.2.2':
    'Teleworking - A policy and supporting security measures shall be implemented to protect information accessed, processed or stored at teleworking sites.',
  // 'A.7': 'Human Resource Security',
  'A.7.1':
    'Prior to employment - Ensure that employees and contractors understand their responsibilities and are suitable for their roles.',
  'A.7.1.1':
    'Screening - Background verification checks shall be carried out in accordance with laws, regulations, ethics, and business requirements.',
  'A.7.1.2':
    'Terms and conditions of employment - Contracts shall state employee, contractor, and organizational responsibilities for information security.',
  'A.7.2':
    'During employment - Ensure employees and contractors are aware of and fulfil their information security responsibilities.',
  'A.7.2.1':
    'Management responsibilities - Management shall require all personnel to apply information security in accordance with established policies and procedures.',
  'A.7.2.2':
    'Information security awareness, education and training - All employees and relevant contractors shall receive appropriate awareness training and regular updates.',
  'A.7.2.3':
    'Disciplinary process - A formal disciplinary process shall exist to address information security breaches.',
  'A.7.3':
    'Termination and change of employment - Protect the organization’s interests during employment changes or termination.',
  'A.7.3.1':
    'Termination or change of employment responsibilities - Post‑employment information security responsibilities shall be defined, communicated, and enforced.',
  // 'A.8': 'Asset Management',
  'A.8.1':
    'Responsibility for assets - Identify organizational assets and define protection responsibilities.',
  'A.8.1.1':
    'Inventory of assets - Assets shall be identified and an inventory maintained.',
  'A.8.1.2': 'Ownership of assets - Assets in the inventory shall be owned.',
  'A.8.1.3':
    'Acceptable use of assets - Rules for acceptable use of information and associated assets shall be documented and implemented.',
  'A.8.1.4':
    'Return of assets - All organizational assets shall be returned upon termination of employment or contract.',
  'A.8.2':
    'Information classification - Ensure information receives appropriate protection.',
  'A.8.2.1':
    'Classification of information - Information shall be classified based on legal requirements, value, criticality, and sensitivity.',
  'A.8.2.2':
    'Labeling of information - Procedures for information labelling shall be developed and implemented.',
  'A.8.2.3':
    'Handling of assets - Procedures for handling assets shall follow the information classification scheme.',
  'A.8.3':
    'Media handling - Prevent unauthorized disclosure, modification, removal, or destruction of information stored on media.',
  'A.8.3.1':
    'Management of removable media - Procedures shall be implemented for managing removable media in accordance with the classification scheme.',
  'A.8.3.2':
    'Disposal of media - Media shall be disposed of securely using formal procedures.',
  'A.8.3.3':
    'Physical media transfer - Media shall be protected against unauthorized access, misuse, or corruption during transport.',
  // 'A.9': 'Access Control',
  'A.9.1':
    'Business requirements of access control - Limit access to information and processing facilities.',
  'A.9.1.1':
    'Access control policy - An access control policy shall be established, documented, and reviewed.',
  'A.9.1.2':
    'Access to networks and network services - Users shall only be provided access to authorized network services.',
  'A.9.2':
    'User access management - Ensure authorized access and prevent unauthorized access.',
  'A.9.2.1':
    'User registration and de-registration - A formal process shall be implemented to assign and revoke access rights.',
  'A.9.2.2':
    'User access provisioning - A formal process shall assign or revoke access rights for all user types.',
  'A.9.2.3':
    'Management of privileged access rights - Allocation and use of privileged access rights shall be restricted and controlled.',
  'A.9.2.4':
    'Management of secret authentication information - Allocation of secret authentication information shall be controlled through a formal process.',
  'A.9.2.5':
    'Review of user access rights - Asset owners shall review user access rights at regular intervals.',
  'A.9.2.6':
    'Removal or adjustment of access rights - Access rights of all employees and external users shall be removed upon termination or adjusted upon change of employment or contract.',
  'A.9.3':
    'User responsibilities - Prevent unauthorized access to systems and applications.',
  'A.9.3.1':
    'User responsibilities - Users shall be accountable for safeguarding their authentication information.',
  'A.9.4':
    'System and application access control - Prevent unauthorized access to systems and applications.',
  'A.9.4.1':
    'Information access restriction - Access to information and application system functions shall be restricted in accordance with the access control policy.',
  'A.9.4.2':
    'Secure log-on procedures - Where required by policy, access to systems and applications shall be controlled by a secure log‑on procedure.',
  'A.9.4.3':
    'Password management system - Password management systems shall be interactive and ensure quality passwords.',
  'A.9.4.4':
    'Use of privileged utility programs - Use of utility programs capable of overriding system or application controls shall be restricted and tightly controlled.',
  'A.9.4.5':
    'Access control to program source code - Access to program source code shall be restricted.',
  // 'A.10': 'Cryptography',
  'A.10.1':
    'Cryptographic controls - Ensure proper and effective use of cryptography to protect confidentiality, authenticity, and integrity of information.',
  'A.10.1.1':
    'Policy on the use of cryptographic controls - A policy for the use of cryptographic controls to protect information shall be developed and implemented.',
  'A.10.1.2':
    'Key management - A policy on the use, protection, and lifecycle management of cryptographic keys shall be developed and implemented.',
  // 'A.11': 'Physical and Environmental Security',
  'A.11.1':
    'Secure areas - Prevent unauthorized physical access, damage, and interference to information and information processing facilities.',
  'A.11.1.1':
    'Physical security perimeter - Security perimeters shall be defined and used to protect areas containing sensitive or critical information and processing facilities.',
  'A.11.1.2':
    'Physical entry controls - Secure areas shall be protected by appropriate entry controls to ensure only authorized personnel are allowed access.',
  'A.11.1.3':
    'Securing offices, rooms and facilities - Physical security for offices, rooms, and facilities shall be designed and applied.',
  'A.11.1.4':
    'Protecting against external and environmental threats - Physical protection against natural disasters, malicious attacks, or accidents shall be designed and applied.',
  'A.11.1.5':
    'Working in secure areas - Procedures for working in secure areas shall be designed and applied.',
  'A.11.1.6':
    'Delivery and loading areas - Access points such as delivery and loading areas shall be controlled and, if possible, isolated from information processing facilities to avoid unauthorized access.',
  'A.11.2':
    'Equipment - Prevent loss, damage, theft, or compromise of assets and avoid operational interruptions.',
  'A.11.2.1':
    'Equipment siting and protection - Equipment shall be sited and protected to reduce risks from environmental threats, hazards, and unauthorized access.',
  'A.11.2.2':
    'Supporting utilities - Equipment shall be protected from power failures and other disruptions caused by failures in supporting utilities.',
  'A.11.2.3':
    'Cabling security - Power and telecommunications cabling carrying data or supporting information services shall be protected from interception, interference, or damage.',
  'A.11.2.4':
    'Equipment maintenance - Equipment shall be correctly maintained to ensure continued availability and integrity.',
  'A.11.2.5':
    'Removal of assets - Equipment, information, or software shall not be taken off‑site without prior authorization.',
  'A.11.2.6':
    'Security of equipment and assets off‑premises - Security shall be applied to off‑site assets, considering the different risks of working outside the organization’s premises.',
  'A.11.2.7':
    'Secure disposal or re‑use of equipment - All equipment containing storage media shall be verified to ensure sensitive data and licensed software have been removed or securely overwritten before disposal or re‑use.',
  'A.11.2.8':
    'Unattended user equipment - Users shall ensure that unattended equipment has appropriate protection.',
  'A.11.2.9':
    'Clear desk and clear screen policy - A clear desk policy for papers and removable media, and a clear screen policy for information processing facilities, shall be adopted.',
  // 'A.12': 'Operations Security',
  'A.12.1':
    'Operational procedures and responsibilities - Ensure correct and secure operations of information processing facilities.',
  'A.12.1.1':
    'Documented operating procedures - Operating procedures shall be documented and made available to all users who need them.',
  'A.12.1.2':
    'Change management - Changes to the organization, business processes, information processing facilities, and systems that affect information security shall be controlled.',
  'A.12.1.3':
    'Capacity management - Resource usage shall be monitored, tuned, and projected to ensure required system performance.',
  'A.12.1.4':
    'Separation of development, testing and operational environments - These environments shall be separated to reduce risks of unauthorized access or changes to the operational environment.',
  'A.12.2':
    'Protection from malware - Ensure information and information processing facilities are protected against malware.',
  'A.12.2.1':
    'Controls against malware - Detection, prevention, and recovery controls against malware shall be implemented, combined with appropriate user awareness.',
  'A.12.3': 'Backup - Protect against loss of data.',
  'A.12.3.1':
    'Information backup - Backup copies of information, software, and system images shall be taken and tested regularly in accordance with an agreed backup policy.',
  'A.12.4': 'Logging and monitoring - Record events and generate evidence.',
  'A.12.4.1':
    'Event logging - Event logs recording user activities, exceptions, faults, and information security events shall be produced, kept, and regularly reviewed.',
  'A.12.4.2':
    'Protection of log information - Logging facilities and log information shall be protected against tampering and unauthorized access.',
  'A.12.4.3':
    'Administrator and operator logs - System administrator and operator activities shall be logged, protected, and regularly reviewed.',
  'A.12.4.4':
    'Clock synchronization - Clocks of all relevant information processing systems shall be synchronized to a single reference time source.',
  'A.12.5':
    'Control of operational software - Ensure the integrity of operational systems.',
  'A.12.5.1':
    'Installation of software on operational systems - Procedures shall be implemented to control the installation of software on operational systems.',
  'A.12.6':
    'Technical vulnerability management - Prevent exploitation of technical vulnerabilities.',
  'A.12.6.1':
    'Management of technical vulnerabilities - Information about technical vulnerabilities shall be obtained in a timely manner, exposure evaluated, and appropriate measures taken.',
  'A.12.6.2':
    'Restrictions on software installation - Rules governing software installation by users shall be established and implemented.',
  'A.12.7':
    'Information systems audit considerations - Minimize the impact of audit activities on operational systems.',
  'A.12.7.1':
    'Information systems audit controls - Audit requirements and activities shall be carefully planned and agreed to minimize disruptions to business processes.',
  // 'A.13': 'Communications Security',
  'A.13.1':
    'Network security management - Ensure protection of information in networks and supporting information processing facilities.',
  'A.13.1.1':
    'Network controls - Networks shall be managed and controlled to protect information in systems and applications.',
  'A.13.1.2':
    'Security of network services - Security mechanisms, service levels, and management requirements of all network services shall be identified and included in service agreements, whether provided in‑house or outsourced.',
  'A.13.1.3':
    'Segregation in networks - Groups of information services, users, and information systems shall be segregated on networks.',
  'A.13.2':
    'Information transfer - Maintain the security of information transferred within the organization and with external entities.',
  'A.13.2.1':
    'Information transfer policies and procedures - Formal transfer policies, procedures, and controls shall protect information transferred via all communication facilities.',
  'A.13.2.2':
    'Agreements on information transfer - Agreements shall address the secure transfer of business information between the organization and external parties.',
  'A.13.2.3':
    'Electronic messaging - Information involved in electronic messaging shall be appropriately protected.',
  'A.13.2.4':
    'Confidentiality or non‑disclosure agreements - Requirements for confidentiality or non‑disclosure agreements shall be identified, documented, and regularly reviewed to reflect organizational needs.',
  // 'A.14': 'System acquisition, development and maintenance',
  'A.14.1':
    'Security requirements of information systems - Ensure information security is integrated into information systems across their entire lifecycle, including systems providing services over public networks.',
  'A.14.1.1':
    'Information security requirements analysis and specification - Information security requirements shall be included in requirements for new systems or enhancements to existing systems.',
  'A.14.1.2':
    'Securing application services on public networks - Information in application services passing over public networks shall be protected from fraudulent activity, contract disputes, and unauthorized disclosure or modification.',
  'A.14.1.3':
    'Protecting application service transactions - Information in application service transactions shall be protected to prevent incomplete transmission, misrouting, unauthorized alteration, unauthorized disclosure, duplication, or replay.',
  'A.14.2':
    'Security in development and support processes - Ensure information security is designed and implemented within the development lifecycle.',
  'A.14.2.1':
    'Secure development policy - Rules for secure software and system development shall be established and applied.',
  'A.14.2.2':
    'System change control procedures - Changes to systems within the development lifecycle shall be controlled through formal change control procedures.',
  'A.14.2.3':
    'Technical review of applications after operating platform changes - Business‑critical applications shall be reviewed and tested after platform changes to ensure no adverse operational or security impact.',
  'A.14.2.4':
    'Restrictions on changes to software packages - Modifications to software packages shall be discouraged, limited to necessary changes, and strictly controlled.',
  'A.14.2.5':
    'Secure system engineering principles - Principles for engineering secure systems shall be established, documented, maintained, and applied.',
  'A.14.2.6':
    'Secure development environment - Secure development environments shall be established and appropriately protected throughout the system development lifecycle.',
  'A.14.2.7':
    'Outsourced development - The organization shall supervise and monitor outsourced system development activities.',
  'A.14.2.8':
    'System security testing - Security functionality shall be tested during development.',
  'A.14.2.9':
    'System acceptance testing - Acceptance testing programs and criteria shall be established for new systems, upgrades, and new versions.',
  'A.14.3': 'Test data - Ensure protection of data used for testing.',
  'A.14.3.1':
    'Protection of test data - Test data shall be selected carefully, protected, and controlled.',
  // 'A.15': 'Supplier relationships',
  'A.15.1':
    'Information security policy for supplier relationships - Ensure protection of organizational assets accessible by suppliers.',
  'A.15.1.1':
    'Information security policy for supplier relationships - Information security requirements for mitigating supplier access risks shall be agreed and documented.',
  'A.15.1.2':
    'Addressing security within supplier agreements - All relevant information security requirements shall be established and agreed with each supplier that may access, process, store, communicate, or provide IT infrastructure components for organizational information.',
  'A.15.1.3':
    'Information and communications technology supply chain - Supplier agreements shall include requirements addressing information security risks associated with ICT services and product supply chains.',
  'A.15.2':
    'Supplier service delivery management - Maintain agreed levels of information security and service delivery in line with supplier agreements.',
  'A.15.2.1':
    'Monitoring and review of supplier services - Organizations shall regularly monitor, review, and audit supplier service delivery.',
  'A.15.2.2':
    'Managing changes to supplier services - Changes to supplier‑provided services shall be managed, considering business criticality and reassessed risks.',
  // 'A.16': 'Information security incident management',
  'A.16.1':
    'Management of information security incidents and improvements - Ensure a consistent and effective approach to managing information security incidents, including communication of events and weaknesses.',
  'A.16.1.1':
    'Responsibilities and procedures - Management responsibilities and procedures shall ensure a quick, effective, and orderly response to information security incidents.',
  'A.16.1.2':
    'Reporting information security events - Information security events shall be reported through appropriate management channels as quickly as possible.',
  'A.16.1.3':
    'Reporting information security weaknesses - Employees and contractors shall report observed or suspected information security weaknesses in systems or services.',
  'A.16.1.4':
    'Assessment of and decision on information security events - Information security events shall be assessed and classified as incidents when appropriate.',
  'A.16.1.5':
    'Response to information security incidents - Information security incidents shall be responded to according to documented procedures.',
  'A.16.1.6':
    'Learning from information security incidents - Knowledge gained from analyzing and resolving incidents shall be used to reduce future likelihood or impact.',
  'A.16.1.7':
    'Collection of evidence - Procedures shall be defined and applied for identifying, collecting, acquiring, and preserving information that may serve as evidence.',
  // 'A.17': 'Information security aspects of business continuity management',
  'A.17.1':
    'Information security continuity - Embed information security continuity into the organization’s business continuity management systems.',
  'A.17.1.1':
    'Planning information security continuity - The organization shall determine its requirements for information security and continuity during adverse situations such as crises or disasters.',
  'A.17.1.2':
    'Implementing information security continuity - The organization shall establish, document, implement, and maintain processes, procedures, and controls to ensure required continuity of information security during adverse situations.',
  'A.17.1.3':
    'Verify, review and evaluate information security continuity - Information security continuity controls shall be regularly verified to ensure they remain valid and effective during adverse situations.',
  'A.17.2':
    'Redundancies - Ensure availability of information processing facilities.',
  'A.17.2.1':
    'Availability of information processing facilities - Information processing facilities shall be implemented with sufficient redundancy to meet availability requirements.',
  // 'A.18': 'Compliance',
  'A.18.1':
    'Compliance with legal and contractual requirements - Avoid breaches of legal, statutory, regulatory, or contractual obligations related to information security.',
  'A.18.1.1':
    'Identification of applicable legislation and contractual requirements - All relevant legal, regulatory, and contractual requirements shall be identified, documented, and kept up to date.',
  'A.18.1.2':
    'Intellectual property rights - Procedures shall ensure compliance with legal, regulatory, and contractual requirements related to intellectual property rights and use of proprietary software.',
  'A.18.1.3':
    'Protection of records - Records shall be protected from loss, destruction, falsification, unauthorized access, and unauthorized release in accordance with applicable requirements.',
  'A.18.1.4':
    'Privacy and protection of personally identifiable information - Privacy and protection of PII shall be ensured as required by relevant legislation and regulations.',
  'A.18.1.5':
    'Regulation of cryptographic controls - Cryptographic controls shall be used in compliance with relevant agreements, legislation, and regulations.',
  'A.18.2':
    'Information security reviews - Ensure information security is implemented and operated in accordance with organizational policies and procedures.',
  'A.18.2.1':
    'Independent review of information security - The organization’s information security approach shall be independently reviewed at planned intervals or when significant changes occur.',
  'A.18.2.2':
    'Compliance with security policies and standards - Managers shall regularly review compliance of information processing and procedures with security policies, standards, and requirements.',
  'A.18.2.3':
    'Technical compliance review - Information systems shall be regularly reviewed for compliance with the organization’s information security policies and standards.',
};
