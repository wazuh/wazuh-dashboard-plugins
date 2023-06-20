/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { AppState } from '../../../../react-services/app-state';
import { GenericRequest } from '../../../../react-services/generic-request';
import { Query, TimeRange, buildRangeFilter, buildEsQuery, getEsQueryConfig, Filter } from '../../../../../../../src/plugins/data/common';
import { SearchParams, SearchResponse } from 'elasticsearch';
import { WazuhConfig } from '../../../../react-services/wazuh-config';
import { getDataPlugin, getUiSettings } from '../../../../kibana-services';

export interface IFilterParams {
  filters: Filter[]
  query: Query
  time: TimeRange
}

interface IWzResponse extends Response {
  data: SearchResponse<any>
}

export async function getIndexPattern() {
  const idIndexPattern = AppState.getCurrentPattern();
  const indexPattern = await getDataPlugin().indexPatterns.get(idIndexPattern);
  return indexPattern;
}

export async function getElasticAlerts(indexPattern, filterParams:IFilterParams, aggs:any=null, kargs={}) {
  const wazuhConfig = new WazuhConfig();
  const extraFilters = [];
  const { hideManagerAlerts } = wazuhConfig.getConfig();
  if(hideManagerAlerts) extraFilters.push({
      meta: {
        alias: null,
        disabled: false,
        key: 'agent.id',
        negate: true,
        params: { query: '000' },
        type: 'phrase',
        index: indexPattern.title
      },
      query: { match_phrase: { 'agent.id': '000' } },
      $state: { store: 'appState' }
    });


  const queryFilters:IFilterParams = {};
  queryFilters["query"] = filterParams.query;
  queryFilters["time"] = filterParams.time;
  queryFilters["filters"] = [...filterParams.filters, ...extraFilters];

  const query = buildQuery(indexPattern, queryFilters);
  const filters = ((query || {}).bool || {}).filter;
  if(filters && Array.isArray(filters)){
    filters.forEach(item => {
      if(item.range && item.range.timestamp && item.range.timestamp.mode){ //range filters can contain a "mode" field that causes an error in an Elasticsearch request
        delete item.range.timestamp["mode"];
      }
    });
  }
  const search:SearchParams = {
    index: indexPattern['title'],
    body: {
      query,
      ...(aggs ? {aggs} : {}),
      ...kargs
    }
  }
  const searchResponse: IWzResponse = await GenericRequest.request(
    'POST',
    '/elastic/alerts',
    search
  );
  return searchResponse;
}

function buildQuery(indexPattern, filterParams:IFilterParams) {
  const { filters, query, time } = filterParams;
  const timeFilter = buildRangeFilter(
    {name: 'timestamp', type: 'date'}, 
    time,
    indexPattern
  );
  return buildEsQuery(
    indexPattern,
    query,
    [...filters, timeFilter],
    getEsQueryConfig(getUiSettings()) 
  );
}
