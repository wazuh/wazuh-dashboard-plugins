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
import { esFilters } from '../../../../../../../../../../../src/plugins/data/common';
import { indexPatterns } from '../../../../../../../../../../../src/plugins/data/server';

export async function getRequirementAlerts(agentId, time, requirement) {
  const indexPattern = await getIndexPattern();
  const filters = [
    ...createFilters(agentId, indexPattern),
    createExistsFilter(requirement, indexPatterns),
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
  return {
    alerts_count: ((((response || {}).data || {}).aggregations || {}).alerts_count || {}).buckets,
    total_alerts: (((response || {}).data || {}).hits || {}).total
  };
}

function createFilters(agentId, indexPattern) {
  const buildFilter = filter => esFilters.buildFilter(
    indexPattern, { name: filter.name, type: 'string' },
    esFilters.FILTERS.PHRASE, false, false, filter.value,
    null, esFilters.FilterStateStore.APP_STATE);
  const wazuhFilter = getWazuhFilter();
  const filters = [
    wazuhFilter,
    { name: 'agent.id', value: agentId },
  ];
  return filters.map(buildFilter);
}


function createExistsFilter(requirement, indexPattern) {
  return esFilters.buildExistsFilter({ name: `rule.${requirement}`, type: 'nested' }, indexPattern)
}