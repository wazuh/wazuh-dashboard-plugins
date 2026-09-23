/*
 * Wazuh app - Module for GDPR requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@osd/i18n';
export const gdprRequirementsFile = {
  '25': i18n.translate('wazuh.complianceTable.gdprRequirements.25', {
    defaultMessage:
      'Data protection by design and by default. Implement appropriate technical and organisational measures designed to implement data-protection principles effectively and to integrate the necessary safeguards into the processing.',
  }),
  '32': i18n.translate('wazuh.complianceTable.gdprRequirements.32', {
    defaultMessage:
      'Security of processing. Implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including pseudonymisation and encryption of personal data.',
  }),
  '33': i18n.translate('wazuh.complianceTable.gdprRequirements.33', {
    defaultMessage:
      'Notification of a personal data breach to the supervisory authority. In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority.',
  }),
  'II_5.1.b': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.II_5_1_b',
    {
      defaultMessage:
        'Purpose limitation - Personal data shall be collected for specified, explicit and legitimate purposes and not further processed in a manner that is incompatible with those purposes.',
    },
  ),
  'II_5.1.f': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.II_5_1_f',
    {
      defaultMessage:
        'Ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services, verifying its modifications, accesses, locations and guarantee the safety of them.File sharing protection and file sharing technologies that meet the requirements of data protection.',
    },
  ),
  'III_14.2.c': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.III_14_2_c',
    {
      defaultMessage: ' Restrict the processing of personal data temporarily.',
    },
  ),
  III_17: i18n.translate('wazuh.complianceTable.gdprRequirements.III_17', {
    defaultMessage: ' Permanently erase personal information of a subject.',
  }),
  'IV_24.2': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_24_2', {
    defaultMessage:
      'Be able to demonstrate compliance with the GDPR by complying with data protection policies.',
  }),
  'IV_25.1': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_25_1', {
    defaultMessage:
      'Data protection by design - Implement appropriate technical and organisational measures, such as pseudonymisation, which are designed to implement data-protection principles in an effective manner and to integrate necessary safeguards into the processing.',
  }),
  IV_28: i18n.translate('wazuh.complianceTable.gdprRequirements.IV_28', {
    defaultMessage:
      ' Ensure data protection during processing, through technical and organizational measures.',
  }),
  'IV_30.1': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_30_1', {
    defaultMessage:
      'Records of processing activities - Each controller shall maintain a record of processing activities under its responsibility, containing the purposes, categories of data subjects and data, recipients, transfers, retention periods and security measures.',
  }),
  'IV_30.1.g': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.IV_30_1_g',
    {
      defaultMessage:
        'It is necessary to keep all processing activities documented, to carry out an inventory of data from beginning to end and an audit, in order to know all the places where personal and sensitive data are located, processed, stored or transmitted.',
    },
  ),
  'IV_32.1.a': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.IV_32_1_a',
    {
      defaultMessage:
        'Security of processing - The pseudonymisation and encryption of personal data.',
    },
  ),
  'IV_32.1.b': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.IV_32_1_b',
    {
      defaultMessage:
        'Security of processing - The ability to ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services.',
    },
  ),
  'IV_32.1.c': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.IV_32_1_c',
    {
      defaultMessage:
        'Data Loss Prevention (DLP) capabilities to examine data flows and identify personal data that is not subject to adequate safeguards or authorizations. DLP tools can block or quarantine such data flows. Classify current data appropriately to determine specific categories of data that will be subject to the GDPR.',
    },
  ),
  'IV_32.1.d': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.IV_32_1_d',
    {
      defaultMessage:
        'Security of processing - A process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures for ensuring the security of the processing.',
    },
  ),
  'IV_32.2': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_32_2', {
    defaultMessage:
      'Account management tools that closely monitor actions taken by standard administrators and users who use standard or privileged account credentials are required to control access to data. ',
  }),
  IV_33: i18n.translate('wazuh.complianceTable.gdprRequirements.IV_33', {
    defaultMessage:
      ' Notify the supervisory authority of a violation of the data in 72 hours and in certain cases, the injured parties.',
  }),
  'IV_33.1': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_33_1', {
    defaultMessage:
      'Notification of a personal data breach to the supervisory authority without undue delay and, where feasible, not later than 72 hours after having become aware of it.',
  }),
  'IV_34.1': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_34_1', {
    defaultMessage:
      'Communication of a personal data breach to the data subject without undue delay, when the breach is likely to result in a high risk to the rights and freedoms of natural persons.',
  }),
  'IV_35.1': i18n.translate('wazuh.complianceTable.gdprRequirements.IV_35_1', {
    defaultMessage:
      'Perform a data protection impact evaluation for high risk processes. Implement appropriate technical measures to safeguard the rights and freedoms of data subjects, informed by an assessment of the risks to these rights and freedoms.',
  }),
  'IV_35.7.d': i18n.translate(
    'wazuh.complianceTable.gdprRequirements.IV_35_7_d',
    {
      defaultMessage:
        'Capabilities for identification, blocking and forensic investigation of data breaches by malicious actors, through compromised credentials, unauthorized network access, persistent threats and verification of the correct operation of all components.Network perimeter and endpoint security tools to prevent unauthorized access to the network, prevent the entry of unwanted data types and malicious threats. Anti-malware and anti-ransomware to prevent malware and ransomware threats from entering your devices.A behavioral analysis that uses machine intelligence to identify people who do anomalous things on the network, in order to give early visibility and alert employees who start to become corrupt.',
    },
  ),
  'V_5.1.f': i18n.translate('wazuh.complianceTable.gdprRequirements.V_5_1_f', {
    defaultMessage:
      'Integrity and confidentiality - Personal data shall be processed in a manner that ensures appropriate security of the personal data, including protection against unauthorised or unlawful processing and against accidental loss, destruction or damage, using appropriate technical or organisational measures.',
  }),
};
