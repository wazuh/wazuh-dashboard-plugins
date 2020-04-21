/*
 * Wazuh app - SSH sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// {"_index": "wazuh-alerts-3.x-2020.04.13","_type": "_doc","_id": "k5OndHEBY2CDQbamYvpk","_version": 1,"_score": null,"_source": {"predecoder": {"hostname": "ip-10-0-0-246","program_name": "sshd","timestamp": "Apr 13 17:47:35"},"cluster": {"node": "master","name": "wazuh"},"agent": {"ip": "10.0.0.246","name": "ip-10-0-0-246.us-west-1.compute.internal","id": "001"},"data": {"srcip": "200.31.19.206"},"manager": {"name": "ip-10-0-0-15.us-west-1.compute.internal"},"rule": {"firedtimes": 1,"mail": false,"level": 5,"pci_dss": ["11.4"],"description": "sshd: Reverse lookup error (bad ISP or attack).","groups": ["syslog","sshd"],"mitre": {"tactics": ["Lateral Movement"],"id": ["T1021"]},"id": "5702","nist_800_53": ["SI.4"],"gpg13": ["4.12"],"gdpr": ["IV_35.7.d"]},"decoder": {"parent": "sshd","name": "sshd"},"full_log": "Apr 13 17:47:35 ip-10-0-0-246 sshd[15409]: reverse mapping checking getaddrinfo for 200.31.19-206.static.impsat.com.co [200.31.19.206] failed - POSSIBLE BREAK-IN ATTEMPT!","input": {"type": "log"},"location": "/var/log/secure","id": "1586800056.184809","GeoLocation": {"country_name": "Argentina","location": {"lon": -58.3817,"lat": -34.6033}},"timestamp": "2020-04-13T17:47:36.131+0000"},"fields": {"timestamp": ["2020-04-13T17:47:36.131Z"]},"highlight": {"manager.name": ["@kibana-highlighted-field@ip-10-0-0-15.us-west-1.compute.internal@/kibana-highlighted-field@"],"rule.groups": ["@kibana-highlighted-field@sshd@/kibana-highlighted-field@"]},"sort": [1586800056131]}
export const reverseLoockupError = {
  // data: {
  //   srcip: "200.31.19.206"
  // },
  location: "/var/log/secure",
  rule: {
    // "firedtimes": 1,
    "mail": false,
    "level": 5,
    "pci_dss": ["11.4"],
    "description": "sshd: Reverse lookup error (bad ISP or attack).",
    "groups": ["syslog","sshd"],
    "mitre": {
      "tactics": ["Lateral Movement"],
      "id": ["T1021"]
    },
    "id": "5702",
    "nist_800_53": ["SI.4"],
    "gpg13": ["4.12"],
    "gdpr": ["IV_35.7.d"]
  },
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[15409]: reverse mapping checking getaddrinfo for {data.srcip}.static.impsat.com.co [{data.srcip}] failed - POSSIBLE BREAK-IN ATTEMPT!"
};

// {"_index": "wazuh-alerts-3.x-2020.04.13","_type": "_doc","_id": "2pOFdHEBY2CDQbamIK-f","_version": 1,"_score": null,"_source": {"predecoder": {"hostname": "ip-10-0-0-246","program_name": "sshd","timestamp": "Apr 13 17:10:10"},"cluster": {"node": "master","name": "wazuh"},"agent": {"ip": "10.0.0.246","name": "ip-10-0-0-246.us-west-1.compute.internal","id": "001"},"data": {"srcip": "198.98.60.141","srcport": "58208"},"manager": {"name": "ip-10-0-0-15.us-west-1.compute.internal"},"rule": {"firedtimes": 1,"mail": false,"level": 6,"pci_dss": ["11.4"],"description": "sshd: insecure connection attempt (scan).","groups": ["syslog","sshd","recon"],"id": "5706","nist_800_53": ["SI.4"],"gpg13": ["4.12"],"gdpr": ["IV_35.7.d"]},"decoder": {"parent": "sshd","name": "sshd"},"full_log": "Apr 13 17:10:10 ip-10-0-0-246 sshd[15225]: Did not receive identification string from 198.98.60.141 port 58208","input": {"type": "log"},"location": "/var/log/secure","id": "1586797811.183222","GeoLocation": {"city_name": "Buffalo","country_name": "United States","region_name": "New York","location": {"lon": -78.8784,"lat": 42.8864}},"timestamp": "2020-04-13T17:10:11.817+0000"},"fields": {"timestamp": ["2020-04-13T17:10:11.817Z"]},"highlight": {"manager.name": ["@kibana-highlighted-field@ip-10-0-0-15.us-west-1.compute.internal@/kibana-highlighted-field@"],"rule.groups": ["@kibana-highlighted-field@sshd@/kibana-highlighted-field@"]},"sort": [1586797811817]}
export const insecureConnectionAttempt = {
  // data: {
  //   srcip: "198.98.60.141",
  //   srcport: "58208"
  // },
  rule: {
    // firedtimes: 1,
    mail: false,
    level: 6,
    pci_dss: ["11.4"],
    description: "sshd: insecure connection attempt (scan).",
    groups: ["syslog","sshd","recon"],
    id: "5706",
    nist_800_53: ["SI.4"],
    gpg13: ["4.12"],
    gdpr: ["IV_35.7.d"]
  },
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[15225]: Did not receive identification string from {data.srcip} port {data.srcport}",
  location: "/var/log/secure"
};

export const data = [reverseLoockupError, insecureConnectionAttempt]