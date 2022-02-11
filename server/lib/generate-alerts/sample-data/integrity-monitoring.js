/*
 * Wazuh app - FIM sample alerts
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const events = ["modified", "deleted", "added"];
export const attributes = ["mtime", "inode", "size", "tmp", "md5", "sha1", "sha256"];
export const pathsLinux = [
  "/etc/resolv.conf",
  "/var/wazuh/queue/fim/db/fim.db-journal",
  "/var/wazuh/queue/fim/db/fim.db",
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
  "/var/wazuh/queue/fim/db/fim.db",
  "/var/osquery/osquery.db/CURRENT",
  "/run/utmp"
];
export const pathsWindows = [
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\MpKslDrv",
  "[x32] HKEY_LOCAL_MACHINE\\Security\\SAM\\Domains\\Account\\Users\\000001F4",
  "[x32] HKEY_LOCAL_MACHINE\\Security\\SAM\\Domains\\Account\\Users\\000001F5",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\{54b31d7e-36bf-4bbe-9ab2-106a939cd78c}",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\W32Time\\Config",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\W32Time\\SecureTimeLimits",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\W32Time\\SecureTimeLimits\\RunTime",
  "[x32] HKEY_LOCAL_MACHINE\\Security\\SAM\\Domains\\Account\\Users\\000001F7",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\SharedAccess\\Epoch",
  "c:\\programdata\\microsoft\\windows defender\\scans\\mpenginedb.db-wal",
  "c:\\program files (x86)\\wazuh-agent\\wodles\\syscollector",
  "c:\\program files (x86)\\wazuh-agent\\rids\\sender_counter",
  "c:\\program files (x86)\\wazuh-agent\\queue\\fim\\db\\fim.db",
  "c:\\program files (x86)\\wazuh-agent\\wazuh-agent.state",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\WinDefend",
  "[x32] HKEY_LOCAL_MACHINE\\System\\CurrentControlSet\\Services\\bam\\State\\UserSettings\\S-1-5-21-856620481-996501011-1859314257-500",
];
export const uid_after = ["0", "S-1-5-18", "S-1-5-32-544", "996", "S-1-5-19"];
export const gid_after = ["994", "0", "993", "190", "22"];
export const tags = ["tmp"];
export const regulatory = [{
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
      "wazuh",
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
      "wazuh",
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
      "wazuh",
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
