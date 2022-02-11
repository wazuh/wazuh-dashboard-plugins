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
export const hipaaRequirementsFile = {
  '164.312.a.1':
    'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have access.',
  '164.312.a.2.I':
    'Assign a unique name and/or number for identifying and tracking user identity.',
  '164.312.a.2.II':
    'Establish (and implement as needed) procedures for obtaining necessary electronic protected health information during an emergency.',
  '164.312.a.2.III':
    'Implement electronic procedures that terminate an electronic session  after a predetermined time of inactivity.',
  '164.312.a.2.IV':
    'Implement a mechanism to encrypt and decrypt electronic protected health information.',
  '164.312.b':
    'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.',
  '164.312.c.1':
    'Implement policies and procedures to protect electronic protected health information from improper alteration or destruction.',
  '164.312.c.2':
    'Implement electronic mechanisms to corroborate that electronic protected health information has not been altered or destroyed in an unauthorized manner.',
  '164.312.d':
    'Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed.',
  '164.312.e.1':
    'Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.',
  '164.312.e.2.I':
    'Implement security measures to ensure that electronically transmitted electronic protected health information is not improperly modified without detection until disposed of.',
  '164.312.e.2.II':
    'Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.'
};
