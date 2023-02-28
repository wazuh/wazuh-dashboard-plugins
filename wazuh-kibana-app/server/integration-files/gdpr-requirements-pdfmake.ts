/*
 * Wazuh app - Module for GDPR requirements (Reporting)
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default {
  'II_5.1.f':
    'Ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services, verifying its modifications, accesses, locations and guarantee the safety of them. File sharing protection and file sharing technologies that meet the requirements of data protection.',
  'III_14.2.c': ' Restrict the processing of personal data temporarily.',
  III_17: ' Permanently erase personal information of a subject.',
  'IV_24.2':
    'Be able to demonstrate compliance with the GDPR by complying with data protection policies.',
  IV_28:
    ' Ensure data protection during processing, through technical and organizational measures.',
  'IV_30.1.g':
    'It is necessary to keep all processing activities documented, to carry out an inventory of data from beginning to end and an audit, in order to know all the places where personal and sensitive data are located, processed, stored or transmitted.',
  'IV_32.1.c':
    'Data Loss Prevention (DLP) capabilities to examine data flows and identify personal data that is not subject to adequate safeguards or authorizations. DLP tools can block or quarantine such data flows. Classify current data appropriately to determine specific categories of data that will be subject to the GDPR.',
  'IV_32.2':
    'Account management tools that closely monitor actions taken by standard administrators and users who use standard or privileged account credentials are required to control access to data. ',
  IV_33:
    ' Notify the supervisory authority of a violation of the data in 72 hours and in certain cases, the injured parties.',
  'IV_35.1':
    'Perform a data protection impact evaluation for high risk processes. Implement appropriate technical measures to safeguard the rights and freedoms of data subjects, informed by an assessment of the risks to these rights and freedoms.',
  'IV_35.7.d':
    'Capabilities for identification, blocking and forensic investigation of data breaches by malicious actors, through compromised credentials, unauthorized network access, persistent threats and verification of the correct operation of all components. Network perimeter and endpoint security tools to prevent unauthorized access to the network, prevent the entry of unwanted data types and malicious threats. Anti-malware and anti-ransomware to prevent malware and ransomware threats from entering your devices. A behavioral analysis that uses machine intelligence to identify people who do anomalous things on the network, in order to give early visibility and alert employees who start to become corrupt.'
};
