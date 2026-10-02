/*
 * Wazuh app - Compliance requirements name
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@osd/i18n';
import { WAZUH_MODULES_ID } from '../../../../common/constants';

/*
 * Name of each group of the requirements panel, by framework. The groups are
 * keyed by framework because a group identifier only means something within
 * its own standard: "1" is a PCI DSS requirement and a NIS2 article.
 */
const NIST_FAMILIES = {
  AC: i18n.translate('wazuh.complianceTable.requirementName.ac', {
    defaultMessage: 'AC - Access Control',
  }),
  AT: i18n.translate('wazuh.complianceTable.requirementName.at', {
    defaultMessage: 'AT - Awareness and Training',
  }),
  AU: i18n.translate('wazuh.complianceTable.requirementName.au', {
    defaultMessage: 'AU - Audit and Accountability',
  }),
  CA: i18n.translate('wazuh.complianceTable.requirementName.ca', {
    defaultMessage: 'CA - Assessment, Authorization, and Monitoring',
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
  PE: i18n.translate('wazuh.complianceTable.requirementName.pe', {
    defaultMessage: 'PE - Physical and Environmental Protection',
  }),
  PL: i18n.translate('wazuh.complianceTable.requirementName.pl', {
    defaultMessage: 'PL - Planning',
  }),
  PM: i18n.translate('wazuh.complianceTable.requirementName.pm', {
    defaultMessage: 'PM - Program Management',
  }),
  PS: i18n.translate('wazuh.complianceTable.requirementName.ps', {
    defaultMessage: 'PS - Personnel Security',
  }),
  PT: i18n.translate('wazuh.complianceTable.requirementName.pt', {
    defaultMessage: 'PT - PII Processing and Transparency',
  }),
  RA: i18n.translate('wazuh.complianceTable.requirementName.ra', {
    defaultMessage: 'RA - Risk Assessment',
  }),
  SA: i18n.translate('wazuh.complianceTable.requirementName.sa', {
    defaultMessage: 'SA - System and Services Acquisition',
  }),
  SC: i18n.translate('wazuh.complianceTable.requirementName.sc', {
    defaultMessage: 'SC - System and Communications Protection',
  }),
  SI: i18n.translate('wazuh.complianceTable.requirementName.si', {
    defaultMessage: 'SI - System and Information Integrity',
  }),
  SR: i18n.translate('wazuh.complianceTable.requirementName.sr', {
    defaultMessage: 'SR - Supply Chain Risk Management',
  }),
};

export const requirementsName = {
  // A FedRAMP baseline is made of NIST 800-53 controls, so both group by family.
  [WAZUH_MODULES_ID.NIST_800_53]: NIST_FAMILIES,
  [WAZUH_MODULES_ID.FEDRAMP]: NIST_FAMILIES,
  [WAZUH_MODULES_ID.HIPAA]: {
    '164.308(a)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164308a',
      {
        defaultMessage: '164.308(a) - Administrative safeguards',
      },
    ),
    '164.308(b)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164308b',
      {
        defaultMessage:
          '164.308(b) - Business associate contracts and other arrangements',
      },
    ),
    '164.310(a)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164310a',
      {
        defaultMessage: '164.310(a) - Facility access controls',
      },
    ),
    '164.310(b)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164310b',
      {
        defaultMessage: '164.310(b) - Workstation use',
      },
    ),
    '164.310(c)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164310c',
      {
        defaultMessage: '164.310(c) - Workstation security',
      },
    ),
    '164.310(d)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164310d',
      {
        defaultMessage: '164.310(d) - Device and media controls',
      },
    ),
    '164.312(a)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164312a',
      {
        defaultMessage: '164.312(a) - Access control',
      },
    ),
    '164.312(b)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164312b',
      {
        defaultMessage: '164.312(b) - Audit controls',
      },
    ),
    '164.312(c)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164312c',
      {
        defaultMessage: '164.312(c) - Integrity',
      },
    ),
    '164.312(d)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164312d',
      {
        defaultMessage: '164.312(d) - Person or entity authentication',
      },
    ),
    '164.312(e)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164312e',
      {
        defaultMessage: '164.312(e) - Transmission security',
      },
    ),
    '164.314(a)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164314a',
      {
        defaultMessage:
          '164.314(a) - Business associate contracts or other arrangements',
      },
    ),
    '164.314(b)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164314b',
      {
        defaultMessage: '164.314(b) - Requirements for group health plans',
      },
    ),
    '164.316(a)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164316a',
      {
        defaultMessage: '164.316(a) - Policies and procedures',
      },
    ),
    '164.316(b)': i18n.translate(
      'wazuh.complianceTable.requirementName.hipaa164316b',
      {
        defaultMessage: '164.316(b) - Documentation',
      },
    ),
  },
  [WAZUH_MODULES_ID.GDPR]: {
    I: i18n.translate('wazuh.complianceTable.requirementName.gdprI', {
      defaultMessage: 'Chapter I - General provisions',
    }),
    II: i18n.translate('wazuh.complianceTable.requirementName.gdprIi', {
      defaultMessage: 'Chapter II - Principles',
    }),
    III: i18n.translate('wazuh.complianceTable.requirementName.gdprIii', {
      defaultMessage: 'Chapter III - Rights of the data subject',
    }),
    IV: i18n.translate('wazuh.complianceTable.requirementName.gdprIv', {
      defaultMessage: 'Chapter IV - Controller and processor',
    }),
    V: i18n.translate('wazuh.complianceTable.requirementName.gdprV', {
      defaultMessage:
        'Chapter V - Transfers of personal data to third countries or international organisations',
    }),
    VI: i18n.translate('wazuh.complianceTable.requirementName.gdprVi', {
      defaultMessage: 'Chapter VI - Independent supervisory authorities',
    }),
    VII: i18n.translate('wazuh.complianceTable.requirementName.gdprVii', {
      defaultMessage: 'Chapter VII - Cooperation and consistency',
    }),
    VIII: i18n.translate('wazuh.complianceTable.requirementName.gdprViii', {
      defaultMessage: 'Chapter VIII - Remedies, liability and penalties',
    }),
    IX: i18n.translate('wazuh.complianceTable.requirementName.gdprIx', {
      defaultMessage:
        'Chapter IX - Provisions relating to specific processing situations',
    }),
    X: i18n.translate('wazuh.complianceTable.requirementName.gdprX', {
      defaultMessage: 'Chapter X - Delegated acts and implementing acts',
    }),
    XI: i18n.translate('wazuh.complianceTable.requirementName.gdprXi', {
      defaultMessage: 'Chapter XI - Final provisions',
    }),
  },
  [WAZUH_MODULES_ID.PCI_DSS]: {
    1: i18n.translate('wazuh.complianceTable.requirementName.pciDss1', {
      defaultMessage: '1. Install and Maintain Network Security Controls',
    }),
    2: i18n.translate('wazuh.complianceTable.requirementName.pciDss2', {
      defaultMessage: '2. Apply Secure Configurations to All System Components',
    }),
    3: i18n.translate('wazuh.complianceTable.requirementName.pciDss3', {
      defaultMessage: '3. Protect Stored Account Data',
    }),
    4: i18n.translate('wazuh.complianceTable.requirementName.pciDss4', {
      defaultMessage:
        '4. Protect Cardholder Data with Strong Cryptography During Transmission Over Open, Public Networks',
    }),
    5: i18n.translate('wazuh.complianceTable.requirementName.pciDss5', {
      defaultMessage:
        '5. Protect All Systems and Networks from Malicious Software',
    }),
    6: i18n.translate('wazuh.complianceTable.requirementName.pciDss6', {
      defaultMessage: '6. Develop and Maintain Secure Systems and Software',
    }),
    7: i18n.translate('wazuh.complianceTable.requirementName.pciDss7', {
      defaultMessage:
        '7. Restrict Access to System Components and Cardholder Data by Business Need to Know',
    }),
    8: i18n.translate('wazuh.complianceTable.requirementName.pciDss8', {
      defaultMessage:
        '8. Identify Users and Authenticate Access to System Components',
    }),
    9: i18n.translate('wazuh.complianceTable.requirementName.pciDss9', {
      defaultMessage: '9. Restrict Physical Access to Cardholder Data',
    }),
    10: i18n.translate('wazuh.complianceTable.requirementName.pciDss10', {
      defaultMessage:
        '10. Log and Monitor All Access to System Components and Cardholder Data',
    }),
    11: i18n.translate('wazuh.complianceTable.requirementName.pciDss11', {
      defaultMessage: '11. Test Security of Systems and Networks Regularly',
    }),
    12: i18n.translate('wazuh.complianceTable.requirementName.pciDss12', {
      defaultMessage:
        '12. Support Information Security with Organizational Policies and Programs',
    }),
  },
  [WAZUH_MODULES_ID.NIST_800_171]: {
    3.1: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family31',
      {
        defaultMessage: '3.1 - Access Control',
      },
    ),
    3.2: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family32',
      {
        defaultMessage: '3.2 - Awareness and Training',
      },
    ),
    3.3: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family33',
      {
        defaultMessage: '3.3 - Audit and Accountability',
      },
    ),
    3.4: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family34',
      {
        defaultMessage: '3.4 - Configuration Management',
      },
    ),
    3.5: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family35',
      {
        defaultMessage: '3.5 - Identification and Authentication',
      },
    ),
    3.6: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family36',
      {
        defaultMessage: '3.6 - Incident Response',
      },
    ),
    3.7: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family37',
      {
        defaultMessage: '3.7 - Maintenance',
      },
    ),
    3.8: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family38',
      {
        defaultMessage: '3.8 - Media Protection',
      },
    ),
    3.9: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family39',
      {
        defaultMessage: '3.9 - Personnel Security',
      },
    ),
    '3.10': i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family310',
      {
        defaultMessage: '3.10 - Physical Protection',
      },
    ),
    3.11: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family311',
      {
        defaultMessage: '3.11 - Risk Assessment',
      },
    ),
    3.12: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family312',
      {
        defaultMessage: '3.12 - Security Assessment',
      },
    ),
    3.13: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family313',
      {
        defaultMessage: '3.13 - System and Communications Protection',
      },
    ),
    3.14: i18n.translate(
      'wazuh.complianceTable.requirementName.nist800171Family314',
      {
        defaultMessage: '3.14 - System and Information Integrity',
      },
    ),
  },
  [WAZUH_MODULES_ID.TSC]: {
    CC1: i18n.translate('wazuh.complianceTable.requirementName.tscCc1', {
      defaultMessage: 'CC1 - Control Environment',
    }),
    CC2: i18n.translate('wazuh.complianceTable.requirementName.tscCc2', {
      defaultMessage: 'CC2 - Communication and Information',
    }),
    CC3: i18n.translate('wazuh.complianceTable.requirementName.tscCc3', {
      defaultMessage: 'CC3 - Risk Assessment',
    }),
    CC4: i18n.translate('wazuh.complianceTable.requirementName.tscCc4', {
      defaultMessage: 'CC4 - Monitoring Activities',
    }),
    CC5: i18n.translate('wazuh.complianceTable.requirementName.tscCc5', {
      defaultMessage: 'CC5 - Control Activities',
    }),
    CC6: i18n.translate('wazuh.complianceTable.requirementName.tscCc6', {
      defaultMessage: 'CC6 - Logical and Physical Access Controls',
    }),
    CC7: i18n.translate('wazuh.complianceTable.requirementName.tscCc7', {
      defaultMessage: 'CC7 - System Operations',
    }),
    CC8: i18n.translate('wazuh.complianceTable.requirementName.tscCc8', {
      defaultMessage: 'CC8 - Change Management',
    }),
    CC9: i18n.translate('wazuh.complianceTable.requirementName.tscCc9', {
      defaultMessage: 'CC9 - Risk Mitigation',
    }),
    A1: i18n.translate('wazuh.complianceTable.requirementName.tscA1', {
      defaultMessage: 'A1 - Availability',
    }),
    C1: i18n.translate('wazuh.complianceTable.requirementName.tscC1', {
      defaultMessage: 'C1 - Confidentiality',
    }),
    PI1: i18n.translate('wazuh.complianceTable.requirementName.tscPi1', {
      defaultMessage: 'PI1 - Processing Integrity',
    }),
    P1: i18n.translate('wazuh.complianceTable.requirementName.tscP1', {
      defaultMessage: 'P1 - Notice and Communication of Objectives',
    }),
    P2: i18n.translate('wazuh.complianceTable.requirementName.tscP2', {
      defaultMessage: 'P2 - Choice and Consent',
    }),
    P3: i18n.translate('wazuh.complianceTable.requirementName.tscP3', {
      defaultMessage: 'P3 - Collection',
    }),
    P4: i18n.translate('wazuh.complianceTable.requirementName.tscP4', {
      defaultMessage: 'P4 - Use, Retention, and Disposal',
    }),
    P5: i18n.translate('wazuh.complianceTable.requirementName.tscP5', {
      defaultMessage: 'P5 - Access',
    }),
    P6: i18n.translate('wazuh.complianceTable.requirementName.tscP6', {
      defaultMessage: 'P6 - Disclosure and Notification',
    }),
    P7: i18n.translate('wazuh.complianceTable.requirementName.tscP7', {
      defaultMessage: 'P7 - Quality',
    }),
    P8: i18n.translate('wazuh.complianceTable.requirementName.tscP8', {
      defaultMessage: 'P8 - Monitoring and Enforcement',
    }),
  },
  [WAZUH_MODULES_ID.CMMC]: {
    AC: i18n.translate('wazuh.complianceTable.requirementName.cmmcAc', {
      defaultMessage: 'AC - Access Control',
    }),
    AT: i18n.translate('wazuh.complianceTable.requirementName.cmmcAt', {
      defaultMessage: 'AT - Awareness and Training',
    }),
    AU: i18n.translate('wazuh.complianceTable.requirementName.cmmcAu', {
      defaultMessage: 'AU - Audit and Accountability',
    }),
    CA: i18n.translate('wazuh.complianceTable.requirementName.cmmcCa', {
      defaultMessage: 'CA - Security Assessment',
    }),
    CM: i18n.translate('wazuh.complianceTable.requirementName.cmmcCm', {
      defaultMessage: 'CM - Configuration Management',
    }),
    IA: i18n.translate('wazuh.complianceTable.requirementName.cmmcIa', {
      defaultMessage: 'IA - Identification and Authentication',
    }),
    IR: i18n.translate('wazuh.complianceTable.requirementName.cmmcIr', {
      defaultMessage: 'IR - Incident Response',
    }),
    MA: i18n.translate('wazuh.complianceTable.requirementName.cmmcMa', {
      defaultMessage: 'MA - Maintenance',
    }),
    MP: i18n.translate('wazuh.complianceTable.requirementName.cmmcMp', {
      defaultMessage: 'MP - Media Protection',
    }),
    PE: i18n.translate('wazuh.complianceTable.requirementName.cmmcPe', {
      defaultMessage: 'PE - Physical Protection',
    }),
    PS: i18n.translate('wazuh.complianceTable.requirementName.cmmcPs', {
      defaultMessage: 'PS - Personnel Security',
    }),
    RA: i18n.translate('wazuh.complianceTable.requirementName.cmmcRa', {
      defaultMessage: 'RA - Risk Assessment',
    }),
    SC: i18n.translate('wazuh.complianceTable.requirementName.cmmcSc', {
      defaultMessage: 'SC - System and Communications Protection',
    }),
    SI: i18n.translate('wazuh.complianceTable.requirementName.cmmcSi', {
      defaultMessage: 'SI - System and Information Integrity',
    }),
  },
  [WAZUH_MODULES_ID.ISO_27001]: {
    'A.5': i18n.translate('wazuh.complianceTable.requirementName.iso27001A5', {
      defaultMessage: 'A.5 - Organizational controls',
    }),
    'A.6': i18n.translate('wazuh.complianceTable.requirementName.iso27001A6', {
      defaultMessage: 'A.6 - People controls',
    }),
    'A.7': i18n.translate('wazuh.complianceTable.requirementName.iso27001A7', {
      defaultMessage: 'A.7 - Physical controls',
    }),
    'A.8': i18n.translate('wazuh.complianceTable.requirementName.iso27001A8', {
      defaultMessage: 'A.8 - Technological controls',
    }),
  },
};
