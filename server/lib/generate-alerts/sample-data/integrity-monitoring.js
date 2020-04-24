/*
 * Wazuh app - FIM sample alerts
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const events = ["modified", "deleted", "added"];
export const attributes = ["mtime", "inode", "size", "tmp", "md5", "sha1", "sha256" ];
export const paths = [
  "/etc/resolv.conf",
  "/var/ossec/queue/fim/db/fim.db-journal",
  "/var/ossec/queue/fim/db/fim.db",
  "/var/osquery/osquery.db/CURRENT",
  "/etc/sysconfig/network-scripts/ifcfg-eth1",
  "/etc/filebeat/fields.yml",
  "/var/log/lastlog",
  "/tmp/agent.conf",
  "/etc/elasticsearch/elasticsearch.yml",
  "/etc/elasticsearch/users",
  "/etc/elasticsearch/config",
  "/tmp/wazuh-config",
  "/run/utmp",
  "/etc/resolv.conf",
  "/var/ossec/queue/fim/db/fim.db",
  "/var/osquery/osquery.db/CURRENT",
  "/run/utmp"
];
export const uid_after = ["0", "S-1-5-18", "S-1-5-32-544", "996", "S-1-5-19"];
export const gid_after = ["994", "0", "993", "190", "22"];
export const tags = ["tmp"];
export const regulatory = [
  {
    "firedtimes": 1,
    "mail": false,
    "level": 5,
    "pci_dss": [
      "11.5"
    ],
    "hipaa": [
      "164.312.c.1",
      "164.312.c.2"
    ],
    "description": "File added to the system.",
    "groups": [
      "ossec",
      "syscheck"
    ],
    "id": "554",
    "nist_800_53": [
      "SI.7"
    ],
    "gpg13": [
      "4.11"
    ],
    "gdpr": [
      "II_5.1.f"
    ]
  },
  {
    "firedtimes": 2,
    "mail": false,
    "level": 7,
    "pci_dss": [
      "11.5"
    ],
    "hipaa": [
      "164.312.c.1",
      "164.312.c.2"
    ],
    "description": "Integrity checksum changed.",
    "groups": [
      "ossec",
      "syscheck"
    ],
    "id": "550",
    "nist_800_53": [
      "SI.7"
    ],
    "gpg13": [
      "4.11"
    ],
    "gdpr": [
      "II_5.1.f"
    ]
  },
  {
    "firedtimes": 2,
    "mail": false,
    "level": 7,
    "pci_dss": [
      "11.5"
    ],
    "hipaa": [
      "164.312.c.1",
      "164.312.c.2"
    ],
    "description": "File deleted.",
    "groups": [
      "ossec",
      "syscheck"
    ],
    "id": "553",
    "nist_800_53": [
      "SI.7"
    ],
    "gpg13": [
      "4.11"
    ],
    "gdpr": [
      "II_5.1.f"
    ]
  },
];