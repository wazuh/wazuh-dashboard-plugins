/*
 * Wazuh app - Policy monitoring sample alerts
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Policy monitoring
export const title = ["Trojaned version of file detected."];
export const ruleDescription = ["Host-based anomaly detection event (rootcheck).", "System Audit event."];
export const rootkit = [
  {
    file: '/etc/.bmbl',
    name: 'BMBL'
  }
]
export const location = 'rootcheck';

export const decoder = {
  name: "rootcheck"
};

export const data = [
  {
    "_index": "wazuh-alerts-3.x-2020.04.23",
    "_type": "_doc",
    "_id": "DwF5p3EBr6QjoJqgGhNk",
    "_version": 1,
    "_score": null,
    "_source": {
      "data": {
        "title": "Rootkit 'BMBL' detected by the presence of file '/etc/.bmbl'."
      },
      "manager": {
        "name": "master"
      },
      "rule": {
        "firedtimes": 1,
        "mail": false,
        "level": 7,
        "description": "Host-based anomaly detection event (rootcheck).",
        "groups": [
          "ossec",
          "rootcheck"
        ],
        "id": "510",
        "gdpr": [
          "IV_35.7.d"
        ]
      },
      "full_log": "Rootkit 'BMBL' detected by the presence of file '/etc/.bmbl'.",
      "timestamp": "2020-04-23T14:37:37.438+0000"
    },
    "fields": {
      "timestamp": [
        "2020-04-23T14:37:37.438Z"
      ]
    },
    "highlight": {
      "cluster.name": [
        "@kibana-highlighted-field@wazuh@/kibana-highlighted-field@"
      ],
      "rule.groups": [
        "@kibana-highlighted-field@rootcheck@/kibana-highlighted-field@"
      ]
    },
    "sort": [
      1587652657438
    ]
  }
]