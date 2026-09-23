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
import { i18n } from '@osd/i18n';
export const hipaaRequirementsFile = {
  '164.308.a.1.ii.D': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_1_ii_D',
    {
      defaultMessage:
        'Implement procedures to regularly review records of information system activity, such as audit logs, access reports, and security incident tracking reports.',
    },
  ),
  '164.308.a.3': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_3',
    {
      defaultMessage:
        'Implement policies and procedures to ensure that all members of the workforce have appropriate access to electronic protected health information, and to prevent those workforce members who do not have access from obtaining access to electronic protected health information.',
    },
  ),
  '164.308.a.3.ii.A': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_3_ii_A',
    {
      defaultMessage:
        'Implement procedures for the authorization and/or supervision of workforce members who work with electronic protected health information or in locations where it might be accessed.',
    },
  ),
  '164.308.a.4': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_4',
    {
      defaultMessage:
        'Implement policies and procedures for authorizing access to electronic protected health information that are consistent with the applicable requirements of the Privacy Rule.',
    },
  ),
  '164.308.a.5': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_5',
    {
      defaultMessage:
        'Implement a security awareness and training program for all members of the workforce, including management.',
    },
  ),
  '164.308.a.5.ii.A': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_5_ii_A',
    { defaultMessage: 'Periodic security updates.' },
  ),
  '164.308.a.5.ii.B': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_5_ii_B',
    {
      defaultMessage:
        'Procedures for guarding against, detecting, and reporting malicious software.',
    },
  ),
  '164.308.a.5.ii.C': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_5_ii_C',
    {
      defaultMessage:
        'Procedures for monitoring log-in attempts and reporting discrepancies.',
    },
  ),
  '164.308.a.5.ii.D': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_5_ii_D',
    {
      defaultMessage:
        'Procedures for creating, changing, and safeguarding passwords.',
    },
  ),
  '164.308.a.6': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_6',
    {
      defaultMessage:
        'Implement policies and procedures to address security incidents.',
    },
  ),
  '164.308.a.6.ii': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_6_ii',
    {
      defaultMessage:
        'Identify and respond to suspected or known security incidents; mitigate, to the extent practicable, harmful effects of security incidents that are known; and document security incidents and their outcomes.',
    },
  ),
  '164.308.a.7.ii.A': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_7_ii_A',
    {
      defaultMessage:
        'Establish and implement procedures to create and maintain retrievable exact copies of electronic protected health information.',
    },
  ),
  '164.308.a.8': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_308_a_8',
    {
      defaultMessage:
        'Perform a periodic technical and nontechnical evaluation, based initially upon the standards implemented under this rule, and subsequently, in response to environmental or operational changes affecting the security of electronic protected health information, that establishes the extent to which an entity’s security policies and procedures meet the requirements of this subpart.',
    },
  ),
  '164.310.b': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_310_b',
    {
      defaultMessage:
        'Implement policies and procedures that specify the proper functions to be performed, the manner in which those functions are to be performed, and the physical attributes of the surroundings of a specific workstation or class of workstation that can access electronic protected health information.',
    },
  ),
  '164.310.d.2.iv': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_310_d_2_iv',
    {
      defaultMessage:
        'Create a retrievable, exact copy of electronic protected health information, when needed, before movement of equipment.',
    },
  ),
  '164.312.a.1': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_a_1',
    {
      defaultMessage:
        'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have access.',
    },
  ),
  '164.312.a.2.i': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_a_2_i',
    {
      defaultMessage:
        'Assign a unique name and/or number for identifying and tracking user identity.',
    },
  ),
  '164.312.a.2.ii': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_a_2_ii',
    {
      defaultMessage:
        'Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency.',
    },
  ),
  '164.312.a.2.iii': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_a_2_iii',
    {
      defaultMessage:
        'Implement electronic procedures that terminate an electronic session  after a predetermined time of inactivity.',
    },
  ),
  '164.312.a.2.iv': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_a_2_iv',
    {
      defaultMessage:
        'Implement a mechanism to encrypt and decrypt electronic protected health information.',
    },
  ),
  '164.312.b': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_b',
    {
      defaultMessage:
        'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.',
    },
  ),
  '164.312.c.1': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_c_1',
    {
      defaultMessage:
        'Implement policies and procedures to protect electronic protected health information from improper alteration or destruction.',
    },
  ),
  '164.312.c.2': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_c_2',
    {
      defaultMessage:
        'Implement electronic mechanisms to corroborate that electronic protected health information has not been altered or destroyed in an unauthorized manner.',
    },
  ),
  '164.312.d': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_d',
    {
      defaultMessage:
        'Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed.',
    },
  ),
  '164.312.e': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_e',
    {
      defaultMessage:
        'Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.',
    },
  ),
  '164.312.e.1': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_e_1',
    {
      defaultMessage:
        'Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.',
    },
  ),
  '164.312.e.2.i': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_e_2_i',
    {
      defaultMessage:
        'Implement security measures to ensure that electronically transmitted electronic protected health information is not improperly modified without detection until disposed of.',
    },
  ),
  '164.312.e.2.ii': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_312_e_2_ii',
    {
      defaultMessage:
        'Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.',
    },
  ),
  '164.316.b.1': i18n.translate(
    'wazuh.complianceTable.hipaaRequirements.164_316_b_1',
    {
      defaultMessage:
        'Maintain the policies and procedures implemented to comply with this subpart in written (which may be electronic) form, and if an action, activity or assessment is required to be documented, maintain a written (which may be electronic) record of the action, activity, or assessment.',
    },
  ),
};
