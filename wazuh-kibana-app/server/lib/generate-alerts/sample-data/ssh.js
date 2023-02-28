/*
 * Wazuh app - SSH sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const reverseLoockupError = {
  location: "/var/log/secure",
  rule: {
    "mail": false,
    "level": 5,
    "pci_dss": ["11.4"],
    "description": "sshd: Reverse lookup error (bad ISP or attack).",
    "groups": ["syslog","sshd"],
    "mitre": {
      "tactic": ["Lateral Movement"],
      "id": ["T1021"]
    },
    "id": "5702",
    "nist_800_53": ["SI.4"],
    "gpg13": ["4.12"],
    "gdpr": ["IV_35.7.d"]
  },
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[15409]: reverse mapping checking getaddrinfo for {data.srcip}.static.impsat.com.co [{data.srcip}] failed - POSSIBLE BREAK-IN ATTEMPT!"
};

export const insecureConnectionAttempt = {
  rule: {
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

export const possibleAttackServer = {
  rule: {
    mail: false,
    level: 8,
    pci_dss: ["11.4"],
    description: "sshd: Possible attack on the ssh server (or version gathering).",
    groups: ["syslog","sshd","recon"],
    mitre: {
      tactic: ["Lateral Movement"],
      technique: ["Brute Force","Remove Services"],
      id: ["T1021"]
    },
    id: "5701",
    nist_800_53: ["SI.4"],
    gpg13: ["4.12"],
    gdpr: ["IV_35.7.d"]
  },
  location: "/var/log/secure",
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[15122]: Bad protocol version identification '\\003' from {data.srcip} port {data.srcport}",
}

export const possibleBreakinAttempt = {
  rule: {
    mail: false,
    level: 10,
    pci_dss: ["11.4"],
    description: "sshd: Possible breakin attempt (high number of reverse lookup errors).",
    groups: ["syslog","sshd"],
    mitre: {
      tactic: ["Lateral Movement"],
      technique: ["Brute Force","Remove Services"],
      id: ["T1021"]
    },
    id: "5703",
    nist_800_53: ["SI.4"],
    frequency: 6,
    gpg13: ["4.12"],
    gdpr: ["IV_35.7.d"]
  },
  location: "/var/log/secure",
  full_log: "{predecoder.timestamp} {predecoder.hostname} sshd[10385]: reverse mapping checking getaddrinfo for . [{data.srcip}] failed - POSSIBLE BREAK-IN ATTEMPT!",
};

export const data = [reverseLoockupError, insecureConnectionAttempt, possibleAttackServer, possibleBreakinAttempt];