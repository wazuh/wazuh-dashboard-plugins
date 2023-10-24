/*
 * Wazuh app - GCP sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// GCP
export const arrayAuthAnswer = ["true", "false"];
export const arrayProtocol = ['UDP', 'TCP'];
export const arrayQueryName = ['185.5.205.124.in-addr.arpa.', '98.72.244.104.in-addr.arpa.', 'mirrors.advancedhosters.com.', '41.212.95.203.in-addr.arpa', '41.212.95.203.in-addr.arpa.'];
export const arrayQueryType = ['PTR', 'PTR', 'PTR', 'PTR', 'PTR', 'A'];
export const arrayResponseCode = ['NXDOMAIN', 'NOERROR', 'WARNING', 'CRITICAL', 'ALERT', 'EMERGENCY', 'SERVFAIL', 'INFO', 'SUCCESS', 'BADTRUNC', 'BADNAME', 'NOTAUTH'];
export const arraySourceIP = ['163.172.0.0', '1.33.213.199', '83.32.0.0', '154.84.246.205', '75.142.129.202', '171.197.217.149', '77.38.119.17'];
export const arrayLocation = ['europe-west1', 'us-central1', 'asia-east1', 'australia-southeast1', 'us-west1', 'us-west3', 'us-west2', 'us-west4', 'us-east1', 'us-east2', 'us-east3', 'southamerica-east1'];
export const arrayProject = ['wazuh-dev', 'wazuh-prod', 'wazuh-test'];
export const arraySourceType = ['gce-vm', 'internet'];
export const arraySeverity = ['ERROR', 'INFO', 'NOTICE', 'CRITICAL', 'EMERGENCY', 'ALERT'];
export const arrayType = ['dns_query', 'app_script_function', 'generic_task'];


export const arrayRules = [{
    level: 12,
    description: "Unable to process query due to a problem with the name server",
    id: "65007",
    firedtimes: 2,
    mail: true,
    groups: ["gcp"]
  },
  {
    level: 5,
    description: "GCP notice event",
    id: "65001",
    firedtimes: 1,
    mail: true,
    groups: ["gcp"]
  },
  {
    level: 3,
    description: "DNS external query",
    id: "65032",
    firedtimes: 1,
    mail: true,
    groups: ["gcp"]
  },
  {
    level: 5,
    description: "GCP warning event from VM 531339229531.instance-1 with source IP 83.32.0.0 from europe-west1",
    id: "65034",
    firedtimes: 1,
    mail: true,
    groups: ["gcp"]
  }, {
    level: 9,
    description: "GCP critical event from VM 531339229531.instance-1 with source IP 83.32.0.0 from europe-west1",
    id: "65036",
    firedtimes: 4,
    mail: true,
    groups: ["gcp"]
  },
  {
    level: 11,
    description: "GCP alert event from VM 531339229531.instance-1 with source IP 83.32.0.0 from europe-west1",
    id: "65037",
    firedtimes: 1,
    mail: true,
    groups: ["gcp"]
  },
  {
    level: 12,
    description: "GCP emergency event from VM 531339229531.instance-1 with source IP 83.32.0.0 from europe-west1",
    id: "65038",
    firedtimes: 2,
    mail: true,
    groups: ["gcp"]
  },
  {

    level: 5,
    description: "GCP notice event with source IP 83.32.0.0 from europe-west1 with response code NXDOMAIN",
    id: "65010",
    firedtimes: 2,
    mail: true,
    groups: ["gcp"]
  }
];
