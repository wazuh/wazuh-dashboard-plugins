/*
 * Wazuh app - React HOC to create component with plugin platform state
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, {useState} from 'react';
import { useIndexPattern, useFilterManager, useTimeFilter } from '../hooks';
import { IIndexPattern, FilterManager, Query, TimeRange } from '../../../../../../src/plugins/data/public';
import { useQueryManager } from "../hooks/use-query";

interface withPluginPlatformContextProps {
  indexPattern?: IIndexPattern
  filterManager?: FilterManager
  query?: Query
  timeFilter?: TimeRange
}

export interface withPluginPlatformContextExtendsProps {
  indexPattern: IIndexPattern
  filterManager: FilterManager
  timeFilter: TimeRange
  timeHistory: TimeRange[]
  setTimeFilter(timeRange:TimeRanges): void
  query: Query
  setQuery(query:Query): void
}


export const withPluginPlatformContext = <T extends object>(Component:React.FunctionComponent<T>) => {
  function hoc(props:T & withPluginPlatformContextProps ):React.FunctionComponentElement<T & withPluginPlatformContextExtendsProps> {
    const indexPattern = props.indexPattern ? props.indexPattern : useIndexPattern();
    const filterManager = props.filterManager ? props.filterManager : useFilterManager().filterManager;
    const [query, setQuery] = props.query ? useState(props.query) : useQueryManager();
    const { timeFilter, timeHistory, setTimeFilter } = props.timeFilter ? props.timeFilter : useTimeFilter();
    return <Component {...props}
      indexPattern={indexPattern}
      filterManager={filterManager}
      timeFilter={timeFilter}
      timeHistory={timeHistory}
      setTimeFilter={setTimeFilter}
      query={query}
      setQuery={setQuery} />;
  }

  hoc.displayName = `withPluginPlatformContext-${Component.displayName}`;

  return hoc
}
