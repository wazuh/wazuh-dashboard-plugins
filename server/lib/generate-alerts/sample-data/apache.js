/*
 * Wazuh app - Apache sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const location = '/var/log/httpd/error_log';

export const decoder = {
  parent: "apache-errorlog",
  name: "apache-errorlog"
};

export const data = [
  {
    "rule": {
      "firedtimes": 5,
      "mail": false,
      "level": 5,
      "pci_dss": ["6.5.8","10.2.4"],
      "hipaa": [
        "164.312.b"
      ],
      "description": "Apache: Attempt to access forbidden directory index.",
      "groups": ["apache","web","access_denied"],
      "id": "30306",
      "nist_800_53": [
        "SA.11",
        "AU.14",
        "AC.7"
      ],
      "gdpr": ["IV_35.7.d"]
    },
    "full_log": "[{_timestamp_apache}] [autoindex:error] [pid {_pi_id}] [client {data.srcip}:{data.srcport}] {data.id}: Cannot serve directory /var/www/html/: No matching DirectoryIndex (index.html) found, and server-generated directory index forbidden by Options directive",
  }
];