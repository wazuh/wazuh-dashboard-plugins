/*
 * Wazuh app - Module for HIPAA requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@kbn/i18n'

const technicalPolicies = i18n.translate('wazuh.complianceRequirements.hipaa.technicalPolicy', {
  defaultMessage:
    'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have access.',
});
const uniqueName = i18n.translate('wazuh.complianceRequirements.hipaa.uniqueName', {
  defaultMessage:
    'Assign a unique name and/or number for identifying and tracking user identity.',
});
const healthInformation = i18n.translate('wazuh.complianceRequirements.hipaa.healthInformation', {
  defaultMessage:
    'Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency.',
  },
);
const electronicProcedure = i18n.translate(
  'wazuh.complianceRequirements.hipaa.electronicProcedure',
  {
    defaultMessage:
      'Implement electronic procedures that terminate an electronic session  after a predetermined time of inactivity.',
  },
);
const encryptAndDecryptHealthInfo = i18n.translate(
  'wazuh.complianceRequirements.hipaa.encryptAndDecryptHealthInfo',
  {
    defaultMessage:
      'Implement a mechanism to encrypt and decrypt electronic protected health information.',
  },
);
const hardwareAndSoftwareMechanism = i18n.translate(
  'wazuh.complianceRequirements.hipaa.hardwareAndSoftwareMechanism',
  {
    defaultMessage:
      'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information',
  },
);
const protectFromAlterationOrDestruction = i18n.translate(
  'wazuh.complianceRequirements.hipaa.protectFromAlterationOrDestruction',
  {
    defaultMessage:
      'Implement policies and procedures to protect electronic protected health information from improper alteration or destruction.',
  },
);
const electronicMechanismsToProtectFromAlteration = i18n.translate(
  'wazuh.complianceRequirements.hipaa.electronicMechanismsToProtectFromAlteration',
  {
    defaultMessage:
      'Implement electronic mechanisms to corroborate that electronic protected health information has not been altered or destroyed in an unauthorized manner.',
  },
);
const seekAccess = i18n.translate('wazuh.complianceRequirements.hipaa.seekAccess', {
  defaultMessage:
    'Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed.',
  },
);

const technicalSecurityMeasures = i18n.translate(
  'wazuh.complianceRequirements.hipaa.technicalSecurityMeasures',
  {
    defaultMessage:
      'Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.',
  },
);

const securityDetection = i18n.translate('wazuh.complianceRequirements.hipaa.securityDetection', {
  defaultMessage:
    'Implement security measures to ensure that electronically transmitted electronic protected health information is not improperly modified without detection until disposed of.',
});

const deemedAppropriate = i18n.translate(
  'wazuh.complianceRequirements.hipaa.deemedAppropriate',
  {
    defaultMessage:
      'Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.',
  },
);

export const hipaaRequirementsFile = {
  '164.312.a.1': technicalPolicies,
  '164.312.a.2.I': uniqueName,
  '164.312.a.2.II': healthInformation,
  '164.312.a.2.III': electronicProcedure,
  '164.312.a.2.IV': encryptAndDecryptHealthInfo,
  '164.312.b': hardwareAndSoftwareMechanism,
  '164.312.c.1': protectFromAlterationOrDestruction,
  '164.312.c.2': electronicMechanismsToProtectFromAlteration,
  '164.312.d': seekAccess,
  '164.312.e.1': technicalSecurityMeasures,
  '164.312.e.2.I': securityDetection,
  '164.312.e.2.II': deemedAppropriate,
};
