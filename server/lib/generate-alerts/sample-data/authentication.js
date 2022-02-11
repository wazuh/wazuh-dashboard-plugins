/*
 * Wazuh app - Authentication sample alerts
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const invalidLoginPassword = {
  decoder: {
    parent: 'sshd',
    name: 'sshd',
  },
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[5330]: Failed password for {data.srcuser} from {data.srcip} port {data.srcport} ssh2',
  location: '/var/log/auth.log',
  predecoder: {
    program_name: 'sshd',
    timestamp: 'Apr 17 00:17:52',
    hostname: 'ip-10-0-1-50',
  },
  rule: {
    description: 'sshd: authentication failed.',
    groups: ['syslog', 'sshd', 'invalid_login', 'authentication_failed'],
    id: 5716,
    level: 5,
    mail: false,
    pci_dss: ['10.2.4', '10.2.5'],
    gpg13: ['7.1'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.14', 'AC.7'],
  },
};

export const invalidLoginUser = {
  decoder: {
    parent: 'sshd',
    name: 'sshd',
  },
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[10022]: Invalid user {data.srcuser} from {data.srcuser} from {data.srcip} port {data.srcport} ssh2',
  location: '/var/log/secure',
  predecoder: {
    program_name: 'sshd',
    timestamp: 'Apr 17 00:17:52',
    hostname: 'ip-10-0-1-50',
  },
  rule: {
    description: 'sshd: Attempt to login using a non-existent user',
    groups: ['syslog', 'sshd', 'invalid_login', 'authentication_failed'],
    id: 5710,
    level: 5,
    pci_dss: ['10.2.4', '10.2.5', '10.6.1'],
    gpg13: ['7.1'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.14', 'AC.7', 'AU.6'],
  },
};

export const multipleAuthenticationFailures = {
  decoder: {
    parent: 'sshd',
    name: 'sshd',
  },
  full_log: `{predecoder.timestamp} {predecoder.hostname} sshd[5413]: Failed password for invalid user {data.srcuser} from {data.srcip} port {data.srcport} ssh2`,
  location: '/var/log/secure',
  rule: {
    description: 'sshd: Multiple authentication failures.',
    id: 5720,
    level: 10,
    frequency: 8,
    groups: ['syslog', 'sshd', 'authentication_failures'],
    pci_dss: ['10.2.4', '10.2.5', '11.4'],
    gpg13: ['7.1'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.14', 'AC.7', 'SI.4'],
  },
  predecoder: {
    program_name: 'sshd',
    timestamp: 'Apr 17 00:17:52',
    hostname: 'ip-10-0-1-50',
  },
};

export const windowsInvalidLoginPassword = {
  full_log: `{predecoder.timestamp} {predecoder.hostname} sshd[5413]: Failed password for invalid user {data.srcuser} from {data.srcip} port {data.srcport} ssh2`,
  data_win: {
    eventdata: {
      authenticationPackageName: 'NTLM',
      failureReason: '%%2313',
      keyLength: 0,
      logonProcessName: 'NtLmSsp',
      logonType: '3',
      processId: '0x0',
      status: '0xc000006d',
      subStatus: '0xc0000064',
      subjectLogonId: '0x0',
      subjectUserSid: 'S-1-0-0',
      targetUserName: 'DIRECTION',
    },
    system: {
      channel: 'Security',
      keywords: '0x8010000000000000',
      level: '0',
      message: '',
      opcode: '0',
      providerGuid: '{54849625-5478-4994-a5ba-3e3b0328c30d}',
      providerName: 'Microsoft-Windows-Security-Auditing',
      severityValue: 'AUDIT_FAILURE',
      version: '0',
    },
  },
  decoder: {
    parent: 'sshd',
    name: 'windows_eventchannel',
  },
  location: 'EventChannel',
  rule: {
    description: 'Logon Failure - Unknown user or bad password',
    groups: ['windows', 'windows_security', 'win_authentication_failed'],
    id: 60122,
    level: 5,
    pci_dss: ['10.2.4', '10.2.5'],
    gpg13: ['7.1'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.1', 'AC.7'],
  },
};

export const userLoginFailed = {
  rule: {
    id: 5503,
    level: 5,
    description: 'PAM: User login failed.',
    mail: false,
    groups: ['pam', 'syslog', 'authentication_failed'],
    pci_dss: ['10.2.4', '10.2.5'],
    gpg13: ['7.8'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.14', 'AC.7'],
  },
  predecoder: {
    program_name: 'sshd',
    timestamp: 'Apr 17 00:04:40',
    hostname: 'ip-10-0-1-178',
  },
  decoder: {
    name: 'pam',
  },
  location: '/var/log/secure',
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[11294]: pam_unix(sshd:auth): authentication failure; logname= uid={data.uid} euid={data.euid} tty={data.tty} ruser= rhost={data.srcip}  user={data.dstuser}',
};

export const passwordCheckFailed = {
  rule: {
    level: 5,
    description: 'unix_chkpwd: Password check failed.',
    id: '5557',
    mail: false,
    groups: ['pam', 'syslog', 'authentication_failed'],
    pci_dss: ['10.2.4', '10.2.5'],
    gpg13: ['4.3'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.14', 'AC.7'],
  },
  predecoder: {
    program_name: 'unix_chkpwd',
    timestamp: 'Apr 17 00:07:04',
    hostname: 'ip-10-0-1-132',
  },
  decoder: {
    name: 'unix_chkpwd',
  },
  data: { srcuser: 'root' },
  location: '/var/log/secure',
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} {decoder.name}[29593]: password check failed for user ({data.srcuser})',
};

export const nonExistentUser = {
  rule: {
    mail: false,
    level: 5,
    pci_dss: ['10.2.4', '10.2.5', '10.6.1'],
    hipaa: ['164.312.b'],
    description: 'sshd: Attempt to login using a non-existent user',
    groups: ['syslog', 'sshd', 'invalid_login', 'authentication_failed'],
    id: '5710',
    nist_800_53: ['AU.14', 'AC.7', 'AU.6'],
    gpg13: ['7.1'],
    gdpr: ['IV_35.7.d', 'IV_32.2'],
  },
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[15724]: Invalid user {data.srcuser} from {data.srcip} port {data.srcport}',
  location: '/var/log/secure',
};

export const bruteForceTryingAccessSystem = {
  rule: {
    mail: false,
    level: 10,
    pci_dss: ['11.4', '10.2.4', '10.2.5'],
    hipaa: ['164.312.b'],
    description: 'sshd: brute force trying to get access to the system.',
    groups: ['syslog', 'sshd', 'authentication_failures'],
    mitre: {
      tactic: ['Credential Access', 'Lateral Movement'],
      technique: ['Brute Force', 'Remove Services'],
      id: ['T1110', 'T1021'],
    },
    id: '5712',
    nist_800_53: ['SI.4', 'AU.14', 'AC.7'],
    frequency: 8,
    gdpr: ['IV_35.7.d', 'IV_32.2'],
  },
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[15722]: Invalid user {data.srcuser} from {data.srcip} port {data.srcport}',
  location: '/var/log/secure',
};

export const authenticationSuccess = {
  data: {
    srcip: '84.122.71.89',
    dstuser: 'ec2-user',
  },
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[12727]: Accepted publickey for {data.dstuser} from {data.srcip} port {data.srcport} ssh2: RSA SHA256:ET29+nbiHqrKs1gUewWTFRCHWdO/vMoRQXPESWn8ZG4',
  input: {
    type: 'log',
  },
  location: '/var/log/secure',
  rule: {
    mail: false,
    level: 3,
    pci_dss: ['10.2.5'],
    hipaa: ['164.312.b'],
    description: 'sshd: authentication success.',
    groups: ['syslog', 'sshd', 'authentication_success'],
    id: '5715',
    nist_800_53: ['AU.14', 'AC.7'],
    gpg13: ['7.1', '7.2'],
    gdpr: ['IV_32.2'],
  },
};

export const maximumAuthenticationAttemptsExceeded = {
  rule: {
    mail: false,
    level: 8,
    description: 'Maximum authentication attempts exceeded.',
    groups: ['syslog', 'sshd', 'authentication_failed'],
    mitre: {
      tactic: ['Credential Access', 'Lateral Movement'],
      technique: ['Brute Force', 'Remove Services'],
      id: ['T1110', 'T1021'],
    },
    id: '5758',
    gpg13: ['7.1'],
  },
  location: '/var/log/secure',
  full_log:
    '{predecoder.timestamp} {predecoder.hostname} sshd[19767]: error: maximum authentication attempts exceeded for {data.dstuser} from {data.srcip} port {data.srcport} ssh2 [preauth]',
};
