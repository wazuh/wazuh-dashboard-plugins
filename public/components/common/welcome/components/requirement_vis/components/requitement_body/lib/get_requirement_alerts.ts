/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { IFilterParams, getElasticAlerts, getIndexPattern } from '../../../../../../../overview/mitre/lib';
import { getWazuhFilter } from '../../../../fim_events_table';
import { buildPhraseFilter, buildExistsFilter } from '../../../../../../../../../../../src/plugins/data/common';
import { toastNotifications } from 'ui/notify';

export async function getRequirementAlerts(agentId, time, requirement) {
  const indexPattern = await getIndexPattern();
  const filters = [
    ...createFilters(agentId, indexPattern),
    createExistsFilter(requirement, indexPattern),
  ]
  const filterParams: IFilterParams = {
    filters,
    query: { query: '', language: 'kuery' },
    time
  };
  const aggs = {
    alerts_count: {
      terms: {
        field: `rule.${requirement}`,
        size: 5,
      }
    }
  }

  const response = await getElasticAlerts(indexPattern, filterParams, aggs);
  const alerts_count = ((((response || {}).data || {}).aggregations || {}).alerts_count || {}).buckets;
  if (typeof alerts_count === 'undefined') {
    toastNotifications.add({
      color: 'warning',
      title: 'Error getting alerts from compliances',
      text: "Your environment may not have any index with Wazuh's alerts."
    })
  }

  return {
    alerts_count: alerts_count || [],
    total_alerts: (((response || {}).data || {}).hits || {}).total
  };
}

function createFilters(agentId, indexPattern) {
  const filter = filter => {return {
    ...buildPhraseFilter(
      {name: filter.name, type: 'text'},
      filter.value, indexPattern),
    "$state": { "store": "appState" }
  }
}
  const wazuhFilter = getWazuhFilter();
  const filters = [
    wazuhFilter,
    { name: 'agent.id', value: agentId },
  ];
  return filters.map(filter);
}


function createExistsFilter(requirement, indexPattern) {
  return buildExistsFilter({ name: `rule.${requirement}`, type: 'nested' }, indexPattern)
}
