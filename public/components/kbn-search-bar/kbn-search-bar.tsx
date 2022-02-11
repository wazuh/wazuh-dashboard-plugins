/*
 * Wazuh app - React component to integrate plugin platform search bar
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { I18nProvider } from '@kbn/i18n/react';
import { TimeRange, Query, Filter } from '../../../../../src/plugins/data/public';

import { KibanaContextProvider } from '../../../../../src/plugins/kibana_react/public';
import { withPluginPlatformContext, withPluginPlatformContextExtendsProps } from '../common/hocs';
import { storage } from './lib';
import { getDataPlugin, getCore } from '../../kibana-services';
import { AUTHORIZED_AGENTS } from '../../../common/constants';

export interface IKbnSearchBarProps {
  appName?: string;
  isLoading?: boolean;
  onQuerySubmit?: (payload: { dateRange: TimeRange; query: Query }) => void;
  onFiltersUpdated?: (filters: Filter[]) => void;
}

const SearchBar = getDataPlugin().ui.SearchBar;

const KbnSearchBar: React.FunctionComponent<IKbnSearchBarProps> = (
  props: IKbnSearchBarProps & withPluginPlatformContextExtendsProps
) => {
  const PluginPlatformServices = getDataPlugin();
  const { filterManager, indexPattern, timeFilter, timeHistory, query } = props;
  const data = {
    ...PluginPlatformServices,
    query: { ...PluginPlatformServices.query, filterManager },
  };

  const getFilters = () => {
    const filters = filterManager ? filterManager.getFilters() : [];
    return filters.filter(filter => filter.meta.controlledBy !== AUTHORIZED_AGENTS);
  }

  return (
    <KibanaContextProvider
      services={{
        ...getCore(),
        filterManager,
        data,
        storage,
        appName: props.appName,
      }}
    >
      <I18nProvider>
        <SearchBar
          {...props}
          indexPatterns={[indexPattern]}
          filters={getFilters()}
          dateRangeFrom={timeFilter.from}
          dateRangeTo={timeFilter.to}
          onQuerySubmit={(payload) => onQuerySubmit(payload, props)}
          onFiltersUpdated={(filters) => onFiltersUpdate(filters, props)}
          query={query}
          isLoading={props.isLoading}
          timeHistory={timeHistory}
        />
      </I18nProvider>
    </KibanaContextProvider>
  );
};

const onQuerySubmit = (payload, props) => {
  const { setTimeFilter, setQuery, onQuerySubmit } = props;
  const { dateRange, query } = payload;
  setQuery(query);
  setTimeFilter(dateRange);
  onQuerySubmit && onQuerySubmit(payload);
};

const onFiltersUpdate = (filters, props) => {
  const { filterManager, onFiltersUpdated } = props;

  //add agents filters
  const currentFilters = filterManager ? filterManager.getFilters() : [];
  const agentsFilters = currentFilters.filter(filter => filter.meta.controlledBy === AUTHORIZED_AGENTS);

  filterManager.setFilters([...filters, ...agentsFilters]);
  onFiltersUpdated && onFiltersUpdated(filters);
};

KbnSearchBar.defaultProps = {
  appName: 'wazuh',
};

const hoc = withPluginPlatformContext(KbnSearchBar);
export { hoc as KbnSearchBar };
