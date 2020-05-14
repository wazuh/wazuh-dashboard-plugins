/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { npSetup } from 'ui/new_platform';
import { AppState } from '../../../../react-services/app-state';
import { GenericRequest } from '../../../../react-services/generic-request';
import { Query, esFilters, TimeRange, esQuery } from '../../../../../../../src/plugins/data/common';
import { SearchParams, } from 'elasticsearch';

export interface IFilterParams {
  filters: esFilters.Filter[]
  query: Query
  time: TimeRange
}

export async function getIndexPattern() {
  const idIndexPattern = AppState.getCurrentPattern();
  const indexPattern = await getServices().indexPatterns.get(idIndexPattern);
  return indexPattern;
}

export async function getElasticAlerts(indexPattern, filterParams:IFilterParams, aggs:any=null ) {
  const query = buildQuery(indexPattern, filterParams);
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
      ...(aggs ? {aggs} : {})
    }
  }
  const searchResponse: Response = await GenericRequest.request(
    'POST',
    '/elastic/esAlerts',
    search
  );
  return searchResponse;
}

function buildQuery(indexPattern, filterParams:IFilterParams) {
  const { filters, query, time } = filterParams;
  const timeFilter = esFilters.buildRangeFilter(
    {name: 'timestamp', type: 'date'}, 
    time,
    indexPattern
  );
  return esQuery.buildEsQuery(
    undefined,
    query,
    [...filters, timeFilter],
    esQuery.getEsQueryConfig(npSetup.core.uiSettings) 
  );
}
