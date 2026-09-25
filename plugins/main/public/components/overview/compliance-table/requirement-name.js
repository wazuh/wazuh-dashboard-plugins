/*
 * Wazuh app - Compliance requirements name
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

export const requirementsName = {
  AC: i18n.translate('wazuh.complianceTable.requirementName.ac', {
    defaultMessage: 'AC - Access Control',
  }),
  AU: i18n.translate('wazuh.complianceTable.requirementName.au', {
    defaultMessage: 'AU - Audit and Accountability',
  }),
  AT: i18n.translate('wazuh.complianceTable.requirementName.at', {
    defaultMessage: 'AT - Awareness and Training',
  }),
  CM: i18n.translate('wazuh.complianceTable.requirementName.cm', {
    defaultMessage: 'CM - Configuration Management',
  }),
  CP: i18n.translate('wazuh.complianceTable.requirementName.cp', {
    defaultMessage: 'CP - Contingency Planning',
  }),
  IA: i18n.translate('wazuh.complianceTable.requirementName.ia', {
    defaultMessage: 'IA - Identification and Authentication',
  }),
  IR: i18n.translate('wazuh.complianceTable.requirementName.ir', {
    defaultMessage: 'IR - Incident Response',
  }),
  MA: i18n.translate('wazuh.complianceTable.requirementName.ma', {
    defaultMessage: 'MA - Maintenance',
  }),
  MP: i18n.translate('wazuh.complianceTable.requirementName.mp', {
    defaultMessage: 'MP - Media Protection',
  }),
  PS: i18n.translate('wazuh.complianceTable.requirementName.ps', {
    defaultMessage: 'PS - Personnel Security',
  }),
  PE: i18n.translate('wazuh.complianceTable.requirementName.pe', {
    defaultMessage: 'PE - Physical and Environmental Protection',
  }),
  PL: i18n.translate('wazuh.complianceTable.requirementName.pl', {
    defaultMessage: 'PL - Planning',
  }),
  PM: i18n.translate('wazuh.complianceTable.requirementName.pm', {
    defaultMessage: 'PM - Program Management',
  }),
  RA: i18n.translate('wazuh.complianceTable.requirementName.ra', {
    defaultMessage: 'RA - Risk Assessment',
  }),
  CA: i18n.translate('wazuh.complianceTable.requirementName.ca', {
    defaultMessage: 'CA - Security Assessment and Authorization',
  }),
  SC: i18n.translate('wazuh.complianceTable.requirementName.sc', {
    defaultMessage: 'SC - System and Communications Protection',
  }),
  SI: i18n.translate('wazuh.complianceTable.requirementName.si', {
    defaultMessage: 'SI - System and Information Integrity',
  }),
  SA: i18n.translate('wazuh.complianceTable.requirementName.sa', {
    defaultMessage: 'SA - System and Services Acquisition',
  }),
  '164.312.a': i18n.translate(
    'wazuh.complianceTable.requirementName.hipaa164312a',
    {
      defaultMessage: '164.312.a - Access',
    },
  ),
  '164.312.b': i18n.translate(
    'wazuh.complianceTable.requirementName.hipaa164312b',
    {
      defaultMessage: '164.312.b - Audit Controls',
    },
  ),
  '164.312.c': i18n.translate(
    'wazuh.complianceTable.requirementName.hipaa164312c',
    {
      defaultMessage: '164.312.c - Integrity',
    },
  ),
  '164.312.d': i18n.translate(
    'wazuh.complianceTable.requirementName.hipaa164312d',
    {
      defaultMessage: '164.312.d - Person or Entity Authentication',
    },
  ),
  '164.312.e': i18n.translate(
    'wazuh.complianceTable.requirementName.hipaa164312e',
    {
      defaultMessage: '164.312.e - Transmission Security',
    },
  ),
  II: i18n.translate('wazuh.complianceTable.requirementName.gdprIi', {
    defaultMessage: 'Chapter II - Principles',
  }),
  III: i18n.translate('wazuh.complianceTable.requirementName.gdprIii', {
    defaultMessage: 'Chapter III - Rights of the data',
  }),
  IV: i18n.translate('wazuh.complianceTable.requirementName.gdprIv', {
    defaultMessage: 'Chapter IV - Controller and processor',
  }),
  1: i18n.translate('wazuh.complianceTable.requirementName.pciDss1', {
    defaultMessage:
      '1. Install and maintain a firewall configuration to protect cardholder data',
  }),
  2: i18n.translate('wazuh.complianceTable.requirementName.pciDss2', {
    defaultMessage:
      '2. Do not use vendor-supplied defaults for system passwords and other security parameters',
  }),
  3: i18n.translate('wazuh.complianceTable.requirementName.pciDss3', {
    defaultMessage: '3. Protect stored cardholder data',
  }),
  4: i18n.translate('wazuh.complianceTable.requirementName.pciDss4', {
    defaultMessage:
      '4. Encrypt transmission of cardholder data across open, public networks',
  }),
  5: i18n.translate('wazuh.complianceTable.requirementName.pciDss5', {
    defaultMessage:
      '5. Use and regularly update anti-virus software or programs',
  }),
  6: i18n.translate('wazuh.complianceTable.requirementName.pciDss6', {
    defaultMessage: '6. Develop and maintain secure systems and applications',
  }),
  7: i18n.translate('wazuh.complianceTable.requirementName.pciDss7', {
    defaultMessage:
      '7. Restrict access to cardholder data by business need-to-know',
  }),
  8: i18n.translate('wazuh.complianceTable.requirementName.pciDss8', {
    defaultMessage: '8. Assign a unique ID to each person with computer access',
  }),
  9: i18n.translate('wazuh.complianceTable.requirementName.pciDss9', {
    defaultMessage: '9. Restrict physical access to cardholder data',
  }),
  10: i18n.translate('wazuh.complianceTable.requirementName.pciDss10', {
    defaultMessage:
      '10. Track and monitor all access to network resources and cardholder data',
  }),
  11: i18n.translate('wazuh.complianceTable.requirementName.pciDss11', {
    defaultMessage: '11. Regularly test security systems and processes',
  }),
  12: i18n.translate('wazuh.complianceTable.requirementName.pciDss12', {
    defaultMessage:
      '12. Maintain a policy that addresses information security for employees and contractors',
  }),
};
