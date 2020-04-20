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

import { ruleDescription } from "./policy-monitoring";

export const sshRuleDescription = ['sshd: authentication failed.', 'sshd: Multiple authentication failures.'];

// { "timestamp": "2020-04-17T00:17:53.159+0000", "rule": { "level": 5, "description": "sshd: authentication failed.", "id": "5716", "firedtimes": 72, "mail": false, "groups": ["syslog", "sshd", "authentication_failed"], "pci_dss": ["10.2.4", "10.2.5"], "gpg13": ["7.1"], "gdpr": ["IV_35.7.d", "IV_32.2"], "hipaa": ["164.312.b"], "nist_800_53": ["AU.14", "AC.7"] }, "agent": { "id": "001", "name": "Debian", "ip": "10.0.1.50" }, "manager": { "name": "ip-10-0-0-219.us-west-1.compute.internal" }, "id": "1587082673.77856", "cluster": { "name": "wazuh", "node": "master" }, "full_log": "Apr 17 00:17:52 ip-10-0-1-50 sshd[5330]: Failed password for root from 49.88.112.73 port 36679 ssh2", "predecoder": { "program_name": "sshd", "timestamp": "Apr 17 00:17:52", "hostname": "ip-10-0-1-50" }, "decoder": { "parent": "sshd", "name": "sshd" }, "data": { "srcip": "49.88.112.73", "srcport": "36679", "dstuser": "root" }, "location": "/var/log/auth.log" }
export const invalidLoginPassword = {
  decoder: {
    parent: "sshd",
    name: "sshd"
  },
  full_log: "{timestamp} {agent.name} sshd[5330]: Failed password for {data.srcuser} from {data.srcip} port {data.srcport} ssh2",
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
  full_log: '{date} {hostname} sshd[10022]: Invalid user admin from {srcuser} from {srcip} port {srcport} ssh2',
  decoder: {
    parent: "sshd",
    name: "sshd"
  },
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
  // full_log: `${alert.predecoder.timestamp} ip-${alert.agent.name} sshd[5413]: Failed password for invalid user ${alert.data.srcuser} from ${alert.data.srcip} port ${alert.data.srcport} ssh2`,
  location: '/var/log/secure',
  rule: {
    description: 'sshd: Multiple authentication failures.',
    id: 5720,
    level: 10,
    groups: ['syslog', 'sshd', 'authentication_failures']
  },
  predecoder: {
    program_name: "sshd",
    timestamp: "Apr 17 00:17:52",
    hostname: "ip-10-0-1-50"
  },
  decoder: {
    parent: "sshd",
    name: "sshd"
  },
  pci_dss:["10.2.4","10.2.5","11.4"],
  gpg13:["7.1"],
  gdpr:["IV_35.7.d","IV_32.2"],hipaa:["164.312.b"],
  nist_800_53:["AU.14","AC.7","SI.4"]
};
