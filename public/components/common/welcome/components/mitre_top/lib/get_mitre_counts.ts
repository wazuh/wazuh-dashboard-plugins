/*
 * Wazuh app - React component information about MITRE top tactics.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getIndexPattern, getElasticAlerts, IFilterParams } from '../../../../../overview/mitre/lib'
import { buildExistsFilter, buildPhraseFilter  } from '../../../../../../../../../src/plugins/data/common';

import { AppState } from '../../../../../../react-services/app-state'


function createFilters(indexPattern, agentId, tactic: string | undefined) {
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
    ...(tactic ? [{ name: 'rule.mitre.tactic', value: tactic }] : []),
  ]
  return filters.map(filter);
}

function createExistsFilter(indexPattern) {
  return buildExistsFilter({ name: `rule.mitre.id`, type: 'nested' }, indexPattern)
}

function getWazuhFilter() {
  const clusterInfo = AppState.getClusterInfo();
  const wazuhFilter = {
    name: clusterInfo.status === 'enabled' ? 'cluster.name' : 'manager.name',
    value: clusterInfo.status === 'enabled' ? clusterInfo.cluster : clusterInfo.manager
  }
  return wazuhFilter;
}

export async function getMitreCount(agentId, time, tactic: string | undefined) {
  const indexPattern = await getIndexPattern();
  const filterParams: IFilterParams = {
    filters: [
      ...createFilters(indexPattern, agentId, tactic),
      createExistsFilter(indexPattern),
    ],
    query: { query: '', language: 'kuery' },
    time
  }
  const args = {
    tactics: {
      terms: {
        field: `rule.mitre.${tactic ? 'id' : 'tactic'}`,
        size: 5,
      }
    }
  }
  const response = await getElasticAlerts(indexPattern, filterParams, args, { size: 0 });
  return ((((response || {}).data || {}).aggregations || {}).tactics || {}).buckets || [];
}