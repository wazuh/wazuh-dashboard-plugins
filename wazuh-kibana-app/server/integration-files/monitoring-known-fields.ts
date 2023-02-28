/*
 * Wazuh app - Module for wazuh-monitoring index pattern known fields
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const monitoringKnownFields = [
  {
    name: '@timestamp',
    type: 'date',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true,
    excluded: true
  },
  {
    name: 'timestamp',
    type: 'date',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: '_id',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: false
  },
  {
    name: '_index',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: false
  },
  {
    name: '_score',
    type: 'number',
    count: 0,
    scripted: false,
    searchable: false,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: '_source',
    type: '_source',
    count: 0,
    scripted: false,
    searchable: false,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: '_type',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: false
  },
  {
    name: 'dateAdd',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'group',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'host',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'id',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'ip',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'lastKeepAlive',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'cluster.name',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'mergedSum',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'configSum',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'node_name',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'manager',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'name',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'os.arch',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.codename',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.major',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.minor',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.name',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.platform',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.uname',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'os.version',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'status',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'version',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'registerIP',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  }
];
