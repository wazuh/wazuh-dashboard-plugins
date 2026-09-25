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
export const requirementsName = {
  AC: 'AC - Access Control',
  AU: 'AU - Audit and Accountability',
  AT: 'AT - Awareness and Training',
  CM: 'CM - Configuration Management',
  CP: 'CP - Contingency Planning',
  IA: 'IA - Identification and Authentication',
  IR: 'IR - Incident Response',
  MA: 'MA - Maintenance',
  MP: 'MP - Media Protection',
  PS: 'PS - Personnel Security',
  PE: 'PE - Physical and Environmental Protection',
  PL: 'PL - Planning',
  PM: 'PM - Program Management',
  RA: 'RA - Risk Assessment',
  CA: 'CA - Security Assessment and Authorization',
  SC: 'SC - System and Communications Protection',
  SI: 'SI - System and Information Integrity',
  SA: 'SA - System and Services Acquisition',
  // HIPAA, grouped by the standard the implementation specifications belong to
  '164.308(a)': '164.308(a) - Administrative safeguards',
  '164.308(b)':
    '164.308(b) - Business associate contracts and other arrangements',
  '164.310(a)': '164.310(a) - Facility access controls',
  '164.310(b)': '164.310(b) - Workstation use',
  '164.310(c)': '164.310(c) - Workstation security',
  '164.310(d)': '164.310(d) - Device and media controls',
  '164.312(a)': '164.312(a) - Access control',
  '164.312(b)': '164.312(b) - Audit controls',
  '164.312(c)': '164.312(c) - Integrity',
  '164.312(d)': '164.312(d) - Person or entity authentication',
  '164.312(e)': '164.312(e) - Transmission security',
  '164.314(a)':
    '164.314(a) - Business associate contracts or other arrangements',
  '164.314(b)': '164.314(b) - Requirements for group health plans',
  '164.316(a)': '164.316(a) - Policies and procedures',
  '164.316(b)': '164.316(b) - Documentation',
  // GDPR, grouped by the chapter of the Regulation the article belongs to
  I: 'Chapter I - General provisions',
  II: 'Chapter II - Principles',
  III: 'Chapter III - Rights of the data subject',
  IV: 'Chapter IV - Controller and processor',
  V: 'Chapter V - Transfers of personal data to third countries or international organisations',
  VI: 'Chapter VI - Independent supervisory authorities',
  VII: 'Chapter VII - Cooperation and consistency',
  VIII: 'Chapter VIII - Remedies, liability and penalties',
  IX: 'Chapter IX - Provisions relating to specific processing situations',
  X: 'Chapter X - Delegated acts and implementing acts',
  XI: 'Chapter XI - Final provisions',
  1: '1. Install and maintain a firewall configuration to protect cardholder data',
  2: '2. Do not use vendor-supplied defaults for system passwords and other security parameters',
  3: '3. Protect stored cardholder data',
  4: '4. Encrypt transmission of cardholder data across open, public networks',
  5: '5. Use and regularly update anti-virus software or programs',
  6: '6. Develop and maintain secure systems and applications',
  7: '7. Restrict access to cardholder data by business need-to-know',
  8: '8. Assign a unique ID to each person with computer access',
  9: '9. Restrict physical access to cardholder data',
  10: '10. Track and monitor all access to network resources and cardholder data',
  11: '11. Regularly test security systems and processes',
  12: '12. Maintain a policy that addresses information security for employees and contractors',
};
