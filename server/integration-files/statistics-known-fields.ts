/*
 * Wazuh app - Module for wazuh-monitoring index pattern known fields
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const statisticsKnownFields = [
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
    name: '_source',
    type: '_source',
    count: 0,
    scripted: false,
    searchable: false,
    aggregatable: false,
    readFromDocValues: false
  },
  {
    name: 'analysisid.total_events_decoded',
    type: 'number',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
  {
    name: 'remoted.queue_size',
    type: 'number',
    count: 0,
    scripted: false,
    searchable: true,
    aggregatable: true,
    readFromDocValues: true
  },
];
