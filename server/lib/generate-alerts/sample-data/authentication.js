/*
 * Wazuh app - Authentication sample alerts
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const sshRuleDescription = ['sshd: authentication failed.', 'sshd: Multiple authentication failures.'];

// { "timestamp": "2020-04-17T00:17:53.159+0000", "rule": { "level": 5, "description": "sshd: authentication failed.", "id": "5716", "firedtimes": 72, "mail": false, "groups": ["syslog", "sshd", "authentication_failed"], "pci_dss": ["10.2.4", "10.2.5"], "gpg13": ["7.1"], "gdpr": ["IV_35.7.d", "IV_32.2"], "hipaa": ["164.312.b"], "nist_800_53": ["AU.14", "AC.7"] }, "agent": { "id": "001", "name": "Debian", "ip": "10.0.1.50" }, "manager": { "name": "ip-10-0-0-219.us-west-1.compute.internal" }, "id": "1587082673.77856", "cluster": { "name": "wazuh", "node": "master" }, "full_log": "Apr 17 00:17:52 ip-10-0-1-50 sshd[5330]: Failed password for root from 49.88.112.73 port 36679 ssh2", "predecoder": { "program_name": "sshd", "timestamp": "Apr 17 00:17:52", "hostname": "ip-10-0-1-50" }, "decoder": { "parent": "sshd", "name": "sshd" }, "data": { "srcip": "49.88.112.73", "srcport": "36679", "dstuser": "root" }, "location": "/var/log/auth.log" }
export const invalidLoginPassword = {
  decoder: {
    parent: "sshd",
    name: "sshd"
  },
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[5330]: Failed password for {data.srcuser} from {data.srcip} port {data.srcport} ssh2",
  location: "/var/log/auth.log",
  predecoder: {
    program_name: "sshd",
    timestamp: "Apr 17 00:17:52",
    hostname: "ip-10-0-1-50"
  },
  rule: {
    description: 'sshd: authentication failed.',
    groups: ['syslog', 'sshd', 'invalid_login', 'authentication_failed'],
    id: 5716,
    level: 5,
    mail: false,
    pci_dss: ["10.2.4", "10.2.5"],
    gpg13: ["7.1"],
    gdpr: ["IV_35.7.d", "IV_32.2"],
    hipaa: ["164.312.b"],
    nist_800_53: ["AU.14", "AC.7"]
  }
};

// {"timestamp":"2020-04-17T00:18:20.659+0000","rule":{"level":5,"description":"sshd: Attempt to login using a non-existent user","id":"5710","firedtimes":2,"mail":false,"groups":["syslog","sshd","invalid_login","authentication_failed"],"pci_dss":["10.2.4","10.2.5","10.6.1"],"gpg13":["7.1"],"gdpr":["IV_35.7.d","IV_32.2"],"hipaa":["164.312.b"],"nist_800_53":["AU.14","AC.7","AU.6"]},"agent":{"id":"002","name":"Ubuntu","ip":"10.0.1.85"},"manager":{"name":"ip-10-0-0-219.us-west-1.compute.internal"},"id":"1587082700.80945","cluster":{"name":"wazuh","node":"master"},"full_log":"Apr 17 00:18:20 ip-10-0-1-85 sshd[10629]: Failed password for invalid user admin from 123.20.109.89 port 49286 ssh2","predecoder":{"program_name":"sshd","timestamp":"Apr 17 00:18:20","hostname":"ip-10-0-1-85"},"decoder":{"parent":"sshd","name":"sshd"},"data":{"srcip":"123.20.109.89","srcuser":"admin"},"location":"/var/log/auth.log"}
export const invalidLoginUser = {
  decoder: {
    parent: "sshd",
    name: "sshd"
  },
  full_log: '{predecoder.timestamp} {predecoder.hostname} sshd[10022]: Invalid user {data.srcuser} from {data.srcuser} from {data.srcip} port {data.srcport} ssh2',
  location: '/var/log/secure',
  predecoder: {
    program_name: "sshd",
    timestamp: "Apr 17 00:17:52",
    hostname: "ip-10-0-1-50"
  },
  rule: {
    description: 'sshd: Attempt to login using a non-existent user',
    groups: ['syslog', 'sshd', 'invalid_login', 'authentication_failed'],
    id: 5710,
    level: 5,
    pci_dss: ["10.2.4","10.2.5","10.6.1"],
    gpg13:["7.1"],
    gdpr: ["IV_35.7.d","IV_32.2"],
    hipaa:["164.312.b"],
    nist_800_53:["AU.14","AC.7","AU.6"]
  }
};

// {"timestamp":"2020-04-17T00:25:13.117+0000","rule":{"level":10,"description":"sshd: Multiple authentication failures.","id":"5720","frequency":8,"firedtimes":5,"mail":false,"groups":["syslog","sshd","authentication_failures"],"pci_dss":["10.2.4","10.2.5","11.4"],"gpg13":["7.1"],"gdpr":["IV_35.7.d","IV_32.2"],"hipaa":["164.312.b"],"nist_800_53":["AU.14","AC.7","SI.4"]},"agent":{"id":"004","name":"Centos","ip":"10.0.1.132"},"manager":{"name":"ip-10-0-0-219.us-west-1.compute.internal"},"id":"1587083113.109656","cluster":{"name":"wazuh","node":"master"},"previous_output":"Apr 17 00:25:10 ip-10-0-1-132 sshd[29981]: Failed password for root from 49.88.112.76 port 10848 ssh2\nApr 17 00:24:15 ip-10-0-1-132 sshd[29971]: Failed password for root from 49.88.112.76 port 62928 ssh2\nApr 17 00:24:12 ip-10-0-1-132 sshd[29971]: Failed password for root from 49.88.112.76 port 62928 ssh2\nApr 17 00:24:10 ip-10-0-1-132 sshd[29971]: Failed password for root from 49.88.112.76 port 62928 ssh2\nApr 17 00:20:32 ip-10-0-1-132 sshd[29959]: Failed password for root from 49.88.112.76 port 47065 ssh2\nApr 17 00:20:30 ip-10-0-1-132 sshd[29959]: Failed password for root from 49.88.112.76 port 47065 ssh2\nApr 17 00:20:27 ip-10-0-1-132 sshd[29959]: Failed password for root from 49.88.112.76 port 47065 ssh2","full_log":"Apr 17 00:25:12 ip-10-0-1-132 sshd[29981]: Failed password for root from 49.88.112.76 port 10848 ssh2","predecoder":{"program_name":"sshd","timestamp":"Apr 17 00:25:12","hostname":"ip-10-0-1-132"},"decoder":{"parent":"sshd","name":"sshd"},"data":{"srcip":"49.88.112.76","srcport":"10848","dstuser":"root"},"location":"/var/log/secure"}
export const multipleAuthenticationFailures = {
  decoder: {
    parent: "sshd",
    name: "sshd"
  },
  full_log: `{predecoder.timestamp} {predecoder.hostname} sshd[5413]: Failed password for invalid user {data.srcuser} from {data.srcip} port {data.srcport} ssh2`,
  location: '/var/log/secure',
  rule: {
    description: 'sshd: Multiple authentication failures.',
    id: 5720,
    level: 10,
    groups: ['syslog', 'sshd', 'authentication_failures'],
    pci_dss: ["10.2.4","10.2.5","11.4"],
    gpg13: ["7.1"],
    gdpr: ["IV_35.7.d","IV_32.2"],
    hipaa: ["164.312.b"],
    nist_800_53: ["AU.14","AC.7","SI.4"]
  },
  predecoder: {
    program_name: "sshd",
    timestamp: "Apr 17 00:17:52",
    hostname: "ip-10-0-1-50"
  }
};

export const windowsInvalidLoginPassword = {
  full_log: `{predecoder.timestamp} {predecoder.hostname} sshd[5413]: Failed password for invalid user {data.srcuser} from {data.srcip} port {data.srcport} ssh2`,
  data_win: {
    eventdata: {
        authenticationPackageName: 'NTLM',
        failureReason: '%%2313',
        // ipAddress: randomArrayItem(IPs),
        // ipPort: randomArrayItem(Ports),
        keyLength: 0,
        logonProcessName: 'NtLmSsp',
        logonType: '3',
        processId: '0x0',
        status: '0xc000006d',
        subStatus: '0xc0000064',
        subjectLogonId: '0x0',
        subjectUserSid: "S-1-0-0",
        targetUserName: "DIRECTION"
    },
    system: {
        channel: 'Security',
        // computer: randomArrayItem(Win_Hostnames),
        // eventID: `${randomIntervalInteger(1,600)}`,
        // eventRecordID: `${randomIntervalInteger(10000,50000)}`,
        keywords: '0x8010000000000000',
        level: '0',
        message: '',
        opcode: '0',
        // processID: `${randomIntervalInteger(1,1200)}`,
        providerGuid: '{54849625-5478-4994-a5ba-3e3b0328c30d}',
        providerName: 'Microsoft-Windows-Security-Auditing',
        severityValue: 'AUDIT_FAILURE',
        // systemTime: alert.timestamp,
        // task: `${randomIntervalInteger(1,1800)}`,
        // threadID: `${randomIntervalInteger(1,500)}`,
        version: '0'
    }
  },
  decoder: {
    parent: "sshd",
    name: "windows_eventchannel"
  },
  location: 'EventChannel',
  rule: {
    description: 'Logon Failure - Unknown user or bad password',
    groups: ['windows',  'windows_security', 'win_authentication_failed'],
    id: 60122,
    level: 5,
    pci_dss: ['IV_35.7.d', 'IV_32.2'],
    gpg13: ['7.1'],
    hipaa: ['164.312.b'],
    nist_800_53: ['AU.1', 'AC.7'],
    gdpr: ['10.2.4', '10.2.5']
  }
}

// {"timestamp":"2020-04-17T00:04:41.137+0000","rule":{"level":5,"description":"PAM: User login failed.","id":"5503","firedtimes":7,"mail":false,"groups":["pam","syslog","authentication_failed"],"pci_dss":["10.2.4","10.2.5"],"gpg13":["7.8"],"gdpr":["IV_35.7.d","IV_32.2"],"hipaa":["164.312.b"],"nist_800_53":["AU.14","AC.7"]},"agent":{"id":"003","name":"Amazon","ip":"10.0.1.178"},"manager":{"name":"ip-10-0-0-219.us-west-1.compute.internal"},"id":"1587081881.16101","cluster":{"name":"wazuh","node":"master"},"full_log":"Apr 17 00:04:40 ip-10-0-1-178 sshd[11294]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=222.186.30.76  user=root","predecoder":{"program_name":"sshd","timestamp":"Apr 17 00:04:40","hostname":"ip-10-0-1-178"},"decoder":{"name":"pam"},"data":{"srcip":"222.186.30.76","dstuser":"root","uid":"0","euid":"0","tty":"ssh"},"location":"/var/log/secure"}
export const userLoginFailed = {
  rule: {
    level: 5,
    description: "PAM: User login failed.",
    // firedtimes: 7
    mail: false,
    groups: ["pam","syslog","authentication_failed"],
    pci_dss:["10.2.4","10.2.5"],
    gpg13: ["7.8"],
    gdpr:["IV_35.7.d","IV_32.2"],
    hipaa:["164.312.b"],
    nist_800_53:["AU.14","AC.7"]
  },
  predecoder:{
    program_name: "sshd",
    timestamp: "Apr 17 00:04:40",
    hostname: "ip-10-0-1-178"
  },
  decoder:{
    name:"pam"
  },
  // data:{
  //   srcip:"222.186.30.76",
  //   dstuser:"root",
  //   uid:"0",
  //   euid:"0",
  //   tty:"ssh"
  // },
  location: "/var/log/secure",
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[11294]: pam_unix(sshd:auth): authentication failure; logname= uid={data.uid} euid={data.euid} tty={data.tty} ruser= rhost={data.srcip}  user={data.dstuser}"
};

// {"timestamp":"2020-04-17T00:07:04.197+0000","rule":{"level":5,"description":"unix_chkpwd: Password check failed.","id":"5557","firedtimes":13,"mail":false,"groups":["pam","syslog","authentication_failed"],"pci_dss":["10.2.4","10.2.5"],"gpg13":["4.3"],"gdpr":["IV_35.7.d","IV_32.2"],"hipaa":["164.312.b"],"nist_800_53":["AU.14","AC.7"]},"agent":{"id":"004","name":"Centos","ip":"10.0.1.132"},"manager":{"name":"ip-10-0-0-219.us-west-1.compute.internal"},"id":"1587082024.30535","cluster":{"name":"wazuh","node":"master"},"full_log":"Apr 17 00:07:04 ip-10-0-1-132 unix_chkpwd[29593]: password check failed for user (root)","predecoder":{"program_name":"unix_chkpwd","timestamp":"Apr 17 00:07:04","hostname":"ip-10-0-1-132"},"decoder":{"name":"unix_chkpwd"},"data":{"srcuser":"root"},"location":"/var/log/secure"}
export const passwordCheckFailed = {
  rule: {
    level: 5,
    description: "unix_chkpwd: Password check failed.",
    id: "5557",
    // firedtimes: 13
    mail: false,
    groups: ["pam","syslog","authentication_failed"],
    pci_dss:["10.2.4","10.2.5"],
    gpg13:["4.3"],
    gdpr:["IV_35.7.d","IV_32.2"],
    hipaa:["164.312.b"],
    nist_800_53:["AU.14","AC.7"]
  },
  predecoder: {
    program_name: "unix_chkpwd",
    timestamp: "Apr 17 00:07:04",
    hostname: "ip-10-0-1-132"
  },
  decoder: {
    name: "unix_chkpwd"
  },
  data: {srcuser: "root"},
  location: "/var/log/secure",
  full_log: "{predecoder.timestamp} {predecoder.hostname} {decoder.name}[29593]: password check failed for user ({data.srcuser})",
};

// {"_index": "wazuh-alerts-3.x-2020.04.13","_type": "_doc","_id": "z5TEdHEBY2CDQbamcDkn","_version": 1,"_score": null,"_source": {"predecoder": {"hostname": "ip-10-0-0-246","program_name": "sshd","timestamp": "Apr 13 18:19:18"},"cluster": {"node": "master","name": "wazuh"},"agent": {"ip": "10.0.0.246","name": "ip-10-0-0-246.us-west-1.compute.internal","id": "001"},"data": {"srcuser": "admin","srcip": "89.163.153.41","srcport": "40284"},"manager": {"name": "ip-10-0-0-15.us-west-1.compute.internal"},"rule": {"firedtimes": 30,"mail": false,"level": 5,"pci_dss": ["10.2.4","10.2.5","10.6.1"],"hipaa": ["164.312.b"],"description": "sshd: Attempt to login using a non-existent user","groups": ["syslog","sshd","invalid_login","authentication_failed"],"id": "5710","nist_800_53": ["AU.14","AC.7","AU.6"],"gpg13": ["7.1"],"gdpr": ["IV_35.7.d","IV_32.2"]},"decoder": {"parent": "sshd","name": "sshd"},"full_log": "Apr 13 18:19:18 ip-10-0-0-246 sshd[15724]: Invalid user admin from 89.163.153.41 port 40284","input": {"type": "log"},"location": "/var/log/secure","id": "1586801960.208682","GeoLocation": {"city_name": "Cloppenburg","country_name": "Germany","region_name": "Lower Saxony","location": {"lon": 8.045,"lat": 52.8475}},"timestamp": "2020-04-13T18:19:20.120+0000"},"fields": {"timestamp": ["2020-04-13T18:19:20.120Z"]},"highlight": {"manager.name": ["@kibana-highlighted-field@ip-10-0-0-15.us-west-1.compute.internal@/kibana-highlighted-field@"],"rule.groups": ["@kibana-highlighted-field@sshd@/kibana-highlighted-field@"]},"sort": [1586801960120]}
export const nonExistentUser = {
  rule: {
    // "firedtimes": 30,
    mail: false,
    level: 5,
    pci_dss: ["10.2.4","10.2.5","10.6.1"],
    hipaa: ["164.312.b"],
    description: "sshd: Attempt to login using a non-existent user",
    groups: ["syslog","sshd","invalid_login","authentication_failed"],
    id: "5710",
    nist_800_53: ["AU.14","AC.7","AU.6"],
    gpg13: ["7.1"],
    gdpr: ["IV_35.7.d","IV_32.2"]
  },
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[15724]: Invalid user {data.srcuser} from {data.srcip} port {data.srcport}",
  location: "/var/log/secure"
}

// {"_index": "wazuh-alerts-3.x-2020.04.13","_type": "_doc","_id": "zpTEdHEBY2CDQbamcDkn","_version": 1,"_score": null,"_source": {"predecoder": {"hostname": "ip-10-0-0-246","program_name": "sshd","timestamp": "Apr 13 18:19:17"},"cluster": {"node": "master","name": "wazuh"},"agent": {"ip": "10.0.0.246","name": "ip-10-0-0-246.us-west-1.compute.internal","id": "001"},"previous_output": "Apr 13 18:19:16 ip-10-0-0-246 sshd[15720]: Invalid user admin from 89.163.153.41 port 50526\nApr 13 18:18:55 ip-10-0-0-246 sshd[15688]: Invalid user admin from 89.163.153.41 port 40548\nApr 13 18:18:50 ip-10-0-0-246 sshd[15680]: Invalid user admin from 89.163.153.41 port 58642\nApr 13 18:18:39 ip-10-0-0-246 sshd[15664]: Invalid user admin from 89.163.153.41 port 39542\nApr 13 18:18:37 ip-10-0-0-246 sshd[15660]: Invalid user admin from 89.163.153.41 port 48798\nApr 13 18:18:35 ip-10-0-0-246 sshd[15658]: Invalid user vodafone from 89.163.153.41 port 39218\nApr 13 18:18:32 ip-10-0-0-246 sshd[15652]: Invalid user admin1 from 89.163.153.41 port 40486","data": {"srcuser": "admin","srcip": "89.163.153.41","srcport": "59042"},"manager": {"name": "ip-10-0-0-15.us-west-1.compute.internal"},"rule": {"firedtimes": 4,"mail": false,"level": 10,"pci_dss": ["11.4","10.2.4","10.2.5"],"hipaa": ["164.312.b"],"description": "sshd: brute force trying to get access to the system.","groups": ["syslog","sshd","authentication_failures"],"mitre": {"tactics": ["Credential Access","Lateral Movement"],"id": ["T1110","T1021"]},"id": "5712","nist_800_53": ["SI.4","AU.14","AC.7"],"frequency": 8,"gdpr": ["IV_35.7.d","IV_32.2"]},"decoder": {"parent": "sshd","name": "sshd"},"full_log": "Apr 13 18:19:17 ip-10-0-0-246 sshd[15722]: Invalid user admin from 89.163.153.41 port 59042","input": {"type": "log"},"location": "/var/log/secure","id": "1586801958.207524","GeoLocation": {"city_name": "Cloppenburg","country_name": "Germany","region_name": "Lower Saxony","location": {"lon": 8.045,"lat": 52.8475}},"timestamp": "2020-04-13T18:19:18.169+0000"},"fields": {"timestamp": ["2020-04-13T18:19:18.169Z"]},"highlight": {"manager.name": ["@kibana-highlighted-field@ip-10-0-0-15.us-west-1.compute.internal@/kibana-highlighted-field@"],"rule.groups": ["@kibana-highlighted-field@sshd@/kibana-highlighted-field@"]},"sort": [1586801958169]}
export const bruteForceTryingAccessSystem = {
  rule: {
    // firedtimes: 4,
    mail: false,
    level: 10,
    pci_dss: ["11.4","10.2.4","10.2.5"],
    hipaa: ["164.312.b"],
    description: "sshd: brute force trying to get access to the system.",
    groups: ["syslog","sshd","authentication_failures"],
    mitre: {
      tactics: ["Credential Access","Lateral Movement"],
      id: ["T1110","T1021"]
    },
    id: "5712",
    nist_800_53: ["SI.4","AU.14","AC.7"],
    frequency: 8,
    gdpr: ["IV_35.7.d","IV_32.2"]
  },
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[15722]: Invalid user {data.srcuser} from {data.srcip} port {data.srcport}",
  location: "/var/log/secure"
};