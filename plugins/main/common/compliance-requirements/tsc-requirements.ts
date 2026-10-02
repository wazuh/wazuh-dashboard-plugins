/*
 * Wazuh app - Module for TSC requirements
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
 * Framework: tsc
 * Catalog version: 1.0.0
 * Edition: 2017 (TSP section 100, version including the March 2020 revisions)
 * Source: AICPA, TSP section 100, 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy (version including the March 2020 revisions)
 * Controls: 69
 */
import { i18n } from '@osd/i18n';
import { ComplianceRequirement } from './types';

export const tscRequirementsFile: Record<string, ComplianceRequirement> = {
  'CC1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC1_1.title',
      { defaultMessage: 'Integrity and ethical values' },
    ),
    description:
      'COSO Principle 1: The entity demonstrates a commitment to integrity and ethical values.',
    category: 'CONTROL ENVIRONMENT',
  },
  'CC1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC1_2.title',
      {
        defaultMessage: 'Board independence and oversight of internal control',
      },
    ),
    description:
      'COSO Principle 2: The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control.',
    category: 'CONTROL ENVIRONMENT',
  },
  'CC1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC1_3.title',
      { defaultMessage: 'Structures, reporting lines and authorities' },
    ),
    description:
      'COSO Principle 3: Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in the pursuit of objectives.',
    category: 'CONTROL ENVIRONMENT',
  },
  'CC1.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC1_4.title',
      {
        defaultMessage: 'Attracting, developing and retaining competent staff',
      },
    ),
    description:
      'COSO Principle 4: The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives.',
    category: 'CONTROL ENVIRONMENT',
  },
  'CC1.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC1_5.title',
      { defaultMessage: 'Accountability for internal control duties' },
    ),
    description:
      'COSO Principle 5: The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives.',
    category: 'CONTROL ENVIRONMENT',
  },
  'CC2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC2_1.title',
      { defaultMessage: 'Quality information for internal control' },
    ),
    description:
      'COSO Principle 13: The entity obtains or generates and uses relevant, quality information to support the functioning of internal control.',
    category: 'COMMUNICATION AND INFORMATION',
  },
  'CC2.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC2_2.title',
      { defaultMessage: 'Internal communication on internal control' },
    ),
    description:
      'COSO Principle 14: The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control.',
    category: 'COMMUNICATION AND INFORMATION',
  },
  'CC2.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC2_3.title',
      { defaultMessage: 'External communication on internal control matters' },
    ),
    description:
      'COSO Principle 15: The entity communicates with external parties regarding matters affecting the functioning of internal control.',
    category: 'COMMUNICATION AND INFORMATION',
  },
  'CC3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC3_1.title',
      {
        defaultMessage:
          'Clear objectives for risk identification and assessment',
      },
    ),
    description:
      'COSO Principle 6: The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives.',
    category: 'RISK ASSESSMENT',
  },
  'CC3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC3_2.title',
      { defaultMessage: 'Identification and analysis of risks to objectives' },
    ),
    description:
      'COSO Principle 7: The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed.',
    category: 'RISK ASSESSMENT',
  },
  'CC3.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC3_3.title',
      { defaultMessage: 'Fraud risk in risk assessment' },
    ),
    description:
      'COSO Principle 8: The entity considers the potential for fraud in assessing risks to the achievement of objectives.',
    category: 'RISK ASSESSMENT',
  },
  'CC3.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC3_4.title',
      { defaultMessage: 'Changes affecting the internal control system' },
    ),
    description:
      'COSO Principle 9: The entity identifies and assesses changes that could significantly impact the system of internal control.',
    category: 'RISK ASSESSMENT',
  },
  'CC4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC4_1.title',
      {
        defaultMessage: 'Ongoing and separate evaluations of internal control',
      },
    ),
    description:
      'COSO Principle 16: The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning.',
    category: 'MONITORING ACTIVITIES',
  },
  'CC4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC4_2.title',
      { defaultMessage: 'Reporting of internal control deficiencies' },
    ),
    description:
      'COSO Principle 17: The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action, including senior management and the board of directors, as appropriate.',
    category: 'MONITORING ACTIVITIES',
  },
  'CC5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC5_1.title',
      { defaultMessage: 'Control activities that mitigate risks' },
    ),
    description:
      'COSO Principle 10: The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels.',
    category: 'CONTROL ACTIVITIES',
  },
  'CC5.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC5_2.title',
      { defaultMessage: 'General controls over technology' },
    ),
    description:
      'COSO Principle 11: The entity also selects and develops general control activities over technology to support the achievement of objectives.',
    category: 'CONTROL ACTIVITIES',
  },
  'CC5.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC5_3.title',
      {
        defaultMessage:
          'Control activities deployed through policies and procedures',
      },
    ),
    description:
      'COSO Principle 12: The entity deploys control activities through policies that establish what is expected and in procedures that put policies into action.',
    category: 'CONTROL ACTIVITIES',
  },
  'CC6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_1.title',
      { defaultMessage: 'Logical access security over information assets' },
    ),
    description:
      'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity’s objectives.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_2.title',
      {
        defaultMessage:
          'User registration, authorization and credential removal',
      },
    ),
    description:
      'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity. For those users whose access is administered by the entity, user system credentials are removed when user access is no longer authorized.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_3.title',
      {
        defaultMessage:
          'Access changes by role, duty or system design, with segregation of duties and least privilege',
      },
    ),
    description:
      'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes, giving consideration to the concepts of least privilege and segregation of duties, to meet the entity’s objectives.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_4.title',
      { defaultMessage: 'Restriction of physical access' },
    ),
    description:
      'The entity restricts physical access to facilities and protected information assets (for example, data center facilities, backup media storage, and other sensitive locations) to authorized personnel to meet the entity’s objectives.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_5.title',
      {
        defaultMessage:
          'Physical asset protection kept until data recovery is diminished and not required',
      },
    ),
    description:
      'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished and is no longer required to meet the entity’s objectives.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_6.title',
      { defaultMessage: 'Logical access protection against external threats' },
    ),
    description:
      'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_7.title',
      {
        defaultMessage:
          'Control of information transmission, movement and removal',
      },
    ),
    description:
      'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal to meet the entity’s objectives.',
    category: 'Logical and Physical Access Controls',
  },
  'CC6.8': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC6_8.title',
      {
        defaultMessage:
          'Prevention and detection of unauthorized or malicious software',
      },
    ),
    description:
      'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software to meet the entity’s objectives.',
    category: 'Logical and Physical Access Controls',
  },
  'CC7.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC7_1.title',
      {
        defaultMessage:
          'Detection of configuration changes and new vulnerabilities',
      },
    ),
    description:
      'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
    category: 'System Operations',
  },
  'CC7.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC7_2.title',
      { defaultMessage: 'Monitoring of system components for anomalies' },
    ),
    description:
      'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity’s ability to meet its objectives; anomalies are analyzed to determine whether they represent security events.',
    category: 'System Operations',
  },
  'CC7.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC7_3.title',
      { defaultMessage: 'Evaluation of security events' },
    ),
    description:
      'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
    category: 'System Operations',
  },
  'CC7.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC7_4.title',
      { defaultMessage: 'Incident response' },
    ),
    description:
      'The entity responds to identified security incidents by executing a defined incident-response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
    category: 'System Operations',
  },
  'CC7.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC7_5.title',
      { defaultMessage: 'Recovery from security incidents' },
    ),
    description:
      'The entity identifies, develops, and implements activities to recover from identified security incidents.',
    category: 'System Operations',
  },
  'CC8.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC8_1.title',
      { defaultMessage: 'Authorization and implementation of changes' },
    ),
    description:
      'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
    category: 'Change Management',
  },
  'CC9.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC9_1.title',
      { defaultMessage: 'Mitigation of business disruption risks' },
    ),
    description:
      'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
    category: 'Risk Mitigation',
  },
  'CC9.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqCC9_2.title',
      { defaultMessage: 'Vendor and business partner risk management' },
    ),
    description:
      'The entity assesses and manages risks associated with vendors and business partners.',
    category: 'Risk Mitigation',
  },
  'A1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqA1_1.title',
      { defaultMessage: 'Processing capacity management' },
    ),
    description:
      'The entity maintains, monitors, and evaluates current processing capacity and use of system components (infrastructure, data, and software) to manage capacity demand and to enable the implementation of additional capacity to help meet its objectives.',
    category: 'ADDITIONAL CRITERIA FOR AVAILABILITY',
  },
  'A1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqA1_2.title',
      {
        defaultMessage:
          'Environmental protections, backup and recovery infrastructure',
      },
    ),
    description:
      'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure to meet its objectives.',
    category: 'ADDITIONAL CRITERIA FOR AVAILABILITY',
  },
  'A1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqA1_3.title',
      { defaultMessage: 'Testing of recovery plan procedures' },
    ),
    description:
      'The entity tests recovery plan procedures supporting system recovery to meet its objectives.',
    category: 'ADDITIONAL CRITERIA FOR AVAILABILITY',
  },
  'C1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqC1_1.title',
      {
        defaultMessage:
          'Identification and maintenance of confidential information',
      },
    ),
    description:
      'The entity identifies and maintains confidential information to meet the entity’s objectives related to confidentiality.',
    category: 'ADDITIONAL CRITERIA FOR CONFIDENTIALITY',
  },
  'C1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqC1_2.title',
      { defaultMessage: 'Disposal of confidential information' },
    ),
    description:
      'The entity disposes of confidential information to meet the entity’s objectives related to confidentiality.',
    category: 'ADDITIONAL CRITERIA FOR CONFIDENTIALITY',
  },
  'PI1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqPI1_1.title',
      { defaultMessage: 'Quality information on processing objectives' },
    ),
    description:
      'The entity obtains or generates, uses, and communicates relevant, quality information regarding the objectives related to processing, including definitions of data processed and product and service specifications, to support the use of products and services.',
    category:
      'ADDITIONAL CRITERIA FOR PROCESSING INTEGRITY (OVER THE PROVISION OF SERVICES OR THE PRODUCTION, MANUFACTURING, OR DISTRIBUTION OF GOODS)',
  },
  'PI1.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqPI1_2.title',
      { defaultMessage: 'Controls over system inputs' },
    ),
    description:
      'The entity implements policies and procedures over system inputs, including controls over completeness and accuracy, to result in products, services, and reporting to meet the entity’s objectives.',
    category:
      'ADDITIONAL CRITERIA FOR PROCESSING INTEGRITY (OVER THE PROVISION OF SERVICES OR THE PRODUCTION, MANUFACTURING, OR DISTRIBUTION OF GOODS)',
  },
  'PI1.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqPI1_3.title',
      { defaultMessage: 'Controls over system processing' },
    ),
    description:
      'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet the entity’s objectives.',
    category:
      'ADDITIONAL CRITERIA FOR PROCESSING INTEGRITY (OVER THE PROVISION OF SERVICES OR THE PRODUCTION, MANUFACTURING, OR DISTRIBUTION OF GOODS)',
  },
  'PI1.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqPI1_4.title',
      { defaultMessage: 'Complete, accurate and timely output' },
    ),
    description:
      'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely in accordance with specifications to meet the entity’s objectives.',
    category:
      'ADDITIONAL CRITERIA FOR PROCESSING INTEGRITY (OVER THE PROVISION OF SERVICES OR THE PRODUCTION, MANUFACTURING, OR DISTRIBUTION OF GOODS)',
  },
  'PI1.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqPI1_5.title',
      {
        defaultMessage:
          'Complete, accurate and timely storage of inputs and outputs',
      },
    ),
    description:
      'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely in accordance with system specifications to meet the entity’s objectives.',
    category:
      'ADDITIONAL CRITERIA FOR PROCESSING INTEGRITY (OVER THE PROVISION OF SERVICES OR THE PRODUCTION, MANUFACTURING, OR DISTRIBUTION OF GOODS)',
  },
  'P1.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP1_0.title',
      { defaultMessage: 'Privacy: notice and communication of objectives' },
    ),
    description:
      'Privacy Criteria Related to Notice and Communication of Objectives Related to Privacy',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P1.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP1_1.title',
      { defaultMessage: 'Privacy notice to data subjects' },
    ),
    description:
      'The entity provides notice to data subjects about its privacy practices to meet the entity’s objectives related to privacy. The notice is updated and communicated to data subjects in a timely manner for changes to the entity’s privacy practices, including changes in the use of personal information, to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P2.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP2_0.title',
      { defaultMessage: 'Privacy: choice and consent' },
    ),
    description: 'Privacy Criteria Related to Choice and Consent',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P2.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP2_1.title',
      {
        defaultMessage:
          'Communication of choices and consent for personal information',
      },
    ),
    description:
      'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information to the data subjects and the consequences, if any, of each choice. Explicit consent for the collection, use, retention, disclosure, and disposal of personal information is obtained from data subjects or other authorized persons, if required. Such consent is obtained only for the intended purpose of the information to meet the entity’s objectives related to privacy. The entity’s basis for determining implicit consent for the collection, use, retention, disclosure, and disposal of personal information is documented.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P3.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP3_0.title',
      { defaultMessage: 'Privacy: collection' },
    ),
    description: 'Privacy Criteria Related to Collection',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P3.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP3_1.title',
      {
        defaultMessage:
          'Collection of personal information in line with privacy objectives',
      },
    ),
    description:
      'Personal information is collected consistent with the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P3.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP3_2.title',
      { defaultMessage: 'Explicit consent before collection' },
    ),
    description:
      'For information requiring explicit consent, the entity communicates the need for such consent as well as the consequences of a failure to provide consent for the request for personal information and obtains the consent prior to the collection of the information to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P4.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP4_0.title',
      { defaultMessage: 'Privacy: use, retention and disposal' },
    ),
    description: 'Privacy Criteria Related to Use, Retention, and Disposal',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P4.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP4_1.title',
      { defaultMessage: 'Limits on use of personal information' },
    ),
    description:
      'The entity limits the use of personal information to the purposes identified in the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P4.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP4_2.title',
      { defaultMessage: 'Retention of personal information' },
    ),
    description:
      'The entity retains personal information consistent with the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P4.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP4_3.title',
      { defaultMessage: 'Secure disposal of personal information' },
    ),
    description:
      'The entity securely disposes of personal information to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P5.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP5_0.title',
      { defaultMessage: 'Privacy: access' },
    ),
    description: 'Privacy Criteria Related to Access',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P5.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP5_1.title',
      { defaultMessage: 'Data subject access to personal information' },
    ),
    description:
      'The entity grants identified and authenticated data subjects the ability to access their stored personal information for review and, upon request, provides physical or electronic copies of that information to data subjects to meet the entity’s objectives related to privacy. If access is denied, data subjects are informed of the denial and reason for such denial, as required, to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P5.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP5_2.title',
      { defaultMessage: 'Correction of personal information' },
    ),
    description:
      'The entity corrects, amends, or appends personal information based on information provided by data subjects and communicates such information to third parties, as committed or required, to meet the entity’s objectives related to privacy. If a request for correction is denied, data subjects are informed of the denial and reason for such denial to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_0.title',
      { defaultMessage: 'Privacy: disclosure and notification' },
    ),
    description: 'Privacy Criteria Related to Disclosure and Notification',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_1.title',
      { defaultMessage: 'Disclosure to third parties with explicit consent' },
    ),
    description:
      'The entity discloses personal information to third parties with the explicit consent of data subjects and such consent is obtained prior to disclosure to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.2': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_2.title',
      { defaultMessage: 'Record of authorized disclosures' },
    ),
    description:
      'The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.3': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_3.title',
      { defaultMessage: 'Record of unauthorized disclosures and breaches' },
    ),
    description:
      'The entity creates and retains a complete, accurate, and timely record of detected or reported unauthorized disclosures (including breaches) of personal information to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.4': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_4.title',
      { defaultMessage: 'Privacy commitments from vendors and third parties' },
    ),
    description:
      'The entity obtains privacy commitments from vendors and other third parties who have access to personal information to meet the entity’s objectives related to privacy. The entity assesses those parties’ compliance on a periodic and as-needed basis and takes corrective action, if necessary.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.5': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_5.title',
      { defaultMessage: 'Vendor notice of unauthorized disclosures' },
    ),
    description:
      'The entity obtains commitments from vendors and other third parties with access to personal information to notify the entity in the event of actual or suspected unauthorized disclosures of personal information. Such notifications are reported to appropriate personnel and acted on in accordance with established incident-response procedures to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.6': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_6.title',
      { defaultMessage: 'Breach and incident notification' },
    ),
    description:
      'The entity provides notification of breaches and incidents to affected data subjects, regulators, and others to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P6.7': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP6_7.title',
      {
        defaultMessage: 'Accounting of personal information for data subjects',
      },
    ),
    description:
      'The entity provides data subjects with an accounting of the personal information held and disclosure of the data subjects’ personal information, upon the data subjects’ request, to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P7.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP7_0.title',
      { defaultMessage: 'Privacy: quality' },
    ),
    description: 'Privacy Criteria Related to Quality',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P7.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP7_1.title',
      { defaultMessage: 'Accurate and complete personal information' },
    ),
    description:
      'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information to meet the entity’s objectives related to privacy.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P8.0': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP8_0.title',
      { defaultMessage: 'Privacy: monitoring and enforcement' },
    ),
    description: 'Privacy Criteria Related to Monitoring and Enforcement',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
  'P8.1': {
    title: i18n.translate(
      'wazuh.regulatoryCompliance.tscRequirements.reqP8_1.title',
      { defaultMessage: 'Inquiry, complaint and dispute handling' },
    ),
    description:
      'The entity implements a process for receiving, addressing, resolving, and communicating the resolution of inquiries, complaints, and disputes from data subjects and others and periodically monitors compliance to meet the entity’s objectives related to privacy. Corrections and other necessary actions related to identified deficiencies are made or taken in a timely manner.',
    category: 'ADDITIONAL CRITERIA FOR PRIVACY',
  },
};
