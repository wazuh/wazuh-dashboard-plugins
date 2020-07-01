/*
 * Wazuh app - React component to integrate Kibana search bar
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, {} from 'react';
import { I18nProvider } from '@kbn/i18n/react';
//@ts-ignore
import { getServices } from 'plugins/kibana/discover/kibana_services';
import { SearchBar, TimeRange, Query, Filter } from '../../../../../src/plugins/data/public';
import { KibanaContextProvider } from '../../../../../src/plugins/kibana_react/public';
import { withKibanaContext, withKibanaContextExtendsProps } from '../common/hocs';
import { storage } from './lib';

export interface IKbnSearchBarProps{
  appName?: string
  isLoading?: boolean
  onQuerySubmit?: ((payload: {
    dateRange: TimeRange;
    query: Query;
  }) => void)
  onFiltersUpdated?: ((filters: Filter[]) => void)
}

//@ts-ignore
const KbnSearchBar: React.FunctionComponent<IKbnSearchBarProps> = (props: IKbnSearchBarProps & withKibanaContextExtendsProps) => {
  const KibanaServices = getServices();
  const { filterManager, indexPattern, timeFilter, timeHistory, query } = props;
  const data = {
    ...KibanaServices.data,
    query: {...KibanaServices.data.query, filterManager, },
  }
  return (
    <KibanaContextProvider services={{
      ...KibanaServices,
      filterManager,
      data,
      storage,
      http: KibanaServices.indexPatterns.apiClient.http,
      savedObjects: KibanaServices.indexPatterns.savedObjectsClient,
      appName: props.appName,
    }} >
      <I18nProvider>
        <SearchBar
          {...props}
          //@ts-ignore
          indexPatterns={[indexPattern]}
          filters={(filterManager && filterManager.filters) || []}
          dateRangeFrom={timeFilter.from}
          dateRangeTo={timeFilter.to}
          onQuerySubmit={(payload) => onQuerySubmit(payload, props)}
          onFiltersUpdated={(filters) => onFiltersUpdate(filters, props) }
          query={query}
          isLoading={props.isLoading}
          timeHistory={timeHistory}
           />
      </I18nProvider>
    </KibanaContextProvider>
  );
}

const onQuerySubmit = (payload, props) => {
  const { setTimeFilter, setQuery, onQuerySubmit } = props;
  const { dateRange, query } = payload;
  setQuery(query);
  setTimeFilter(dateRange);
  onQuerySubmit && onQuerySubmit(payload);
}

const onFiltersUpdate = (filters, props) => {
  const { filterManager, onFiltersUpdated } = props;
  filterManager.setFilters(filters);
  onFiltersUpdated && onFiltersUpdated(filters);
}

KbnSearchBar.defaultProps = {
  appName: 'wazuh',
}

const hoc = withKibanaContext(KbnSearchBar);
export {hoc as KbnSearchBar};
