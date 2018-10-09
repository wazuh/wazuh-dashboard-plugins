/*
 * Wazuh app - Module for wazuh-monitoring index pattern known fields
 * Copyright (C) 2018 Wazuh, Inc.
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
    name: 'dateAdd.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'group.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'lastKeepAlive.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'cluster.name.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'mergedSum.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'configSum.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'node_name.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'manager.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'manager_host',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'manager_host.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.arch.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.codename.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.major.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.name.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.platform.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.uname.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'os.version.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
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
    name: 'version.keyword',
    type: 'string',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  }
];
