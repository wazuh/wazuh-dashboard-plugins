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
 import { i18n } from '@kbn/i18n';

 const sharingProtection = i18n.translate(
   'wazuh.complianceRequirements.gdpr.sharingProtection',
   {
     defaultMessage:
       'Ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services, verifying its modifications, accesses, locations and guarantee the safety of them.File sharing protection and file sharing technologies that meet the requirements of data protection.',
   },
 );

  const restrictPersonalDataSharing = i18n.translate(
    'wazuh.complianceRequirements.gdpr.restrictPersonalDataSharing',
    {
      defaultMessage: ' Restrict the processing of personal data temporarily.',
    },
  );

  const personalInfoErase = i18n.translate(
    'wazuh.complianceRequirements.gdpr.personalInfoErase',
    {
      defaultMessage: ' Permanently erase personal information of a subject.',
    },
  );

  const dataProtectionPolicy = i18n.translate(
    'wazuh.complianceRequirements.gdpr.dataProtectionPolicy',
    {
      defaultMessage:
        'Be able to demonstrate compliance with the GDPR by complying with data protection policies.',
    },
  );

  const ensureDatProtection = i18n.translate(
    'wazuh.complianceRequirements.gdpr.ensureDatProtection',
    {
      defaultMessage:
        ' Ensure data protection during processing, through technical and organizational measures.',
    },
  );

  const dataLocation = i18n.translate(
    'wazuh.complianceRequirements.gdpr.dataLocation',
    {
      defaultMessage:
        'It is necessary to keep all processing activities documented, to carry out an inventory of data from beginning to end and an audit, in order to know all the places where personal and sensitive data are located, processed, stored or transmitted.',
    },
  );

  const dataLossPrevention = i18n.translate(
    'wazuh.complianceRequirements.gdpr.dataLossPrevention',
    {
      defaultMessage:
        'Data Loss Prevention (DLP) capabilities to examine data flows and identify personal data that is not subject to adequate safeguards or authorizations. DLP tools can block or quarantine such data flows. Classify current data appropriately to determine specific categories of data that will be subject to the GDPR.',
    },
  );

  const accountManagementTools = i18n.translate(
    'wazuh.complianceRequirements.gdpr.accountManagementTools',
    {
      defaultMessage:
        'Account management tools that closely monitor actions taken by standard administrators and users who use standard or privileged account credentials are required to control access to data. ',
    },
  );

  const supervisorAuthority = i18n.translate(
    'wazuh.complianceRequirements.gdpr.supervisorAuthority',
    {
      defaultMessage:
        ' Notify the supervisory authority of a violation of the data in 72 hours and in certain cases, the injured parties.',
    },
  );

  const technicalMeasures = i18n.translate(
    'wazuh.complianceRequirements.gdpr.technicalMeasures',
    {
      defaultMessage:
        'Perform a data protection impact evaluation for high risk processes. Implement appropriate technical measures to safeguard the rights and freedoms of data subjects, informed by an assessment of the risks to these rights and freedoms.',
    },
  );

  const employeeAlert = i18n.translate(
    'wazuh.complianceRequirements.gdpr.employeeAlert',
    {
      defaultMessage:
        'Capabilities for identification, blocking and forensic investigation of data breaches by malicious actors, through compromised credentials, unauthorized network access, persistent threats and verification of the correct operation of all components.Network perimeter and endpoint security tools to prevent unauthorized access to the network, prevent the entry of unwanted data types and malicious threats. Anti-malware and anti-ransomware to prevent malware and ransomware threats from entering your devices.A behavioral analysis that uses machine intelligence to identify people who do anomalous things on the network, in order to give early visibility and alert employees who start to become corrupt.',
    },
  );
export const gdprRequirementsFile = {
  'II_5.1.f': sharingProtection,
  'III_14.2.c': restrictPersonalDataSharing,
  III_17: personalInfoErase,
  'IV_24.2': dataProtectionPolicy,
  IV_28: ensureDatProtection,
  'IV_30.1.g': dataLocation,
  'IV_32.1.c': dataLossPrevention,
  'IV_32.2': accountManagementTools,
  IV_33: supervisorAuthority,
  'IV_35.1': technicalMeasures,
  'IV_35.7.d': employeeAlert,
};
