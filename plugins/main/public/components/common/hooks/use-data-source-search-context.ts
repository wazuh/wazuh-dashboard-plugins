import React, { useMemo, useState } from 'react';
import {
  TimeRange,
  Query,
  Filter,
  IndexPattern,
  FilterManager,
} from '../../../../../../src/plugins/data/public';
import { getUiSettings } from '../../../kibana-services';
import {
  IDataSourceFactoryConstructor,
  PatternDataSource,
  tDataSourceRepository,
  tParsedIndexPattern,
  useDataSource,
} from '../data-source';
import useSearchBar, {
  tUseSearchBarProps,
} from '../../common/search-bar/use-search-bar';
import { useTimeFilter } from './use-time-filter';
import { transformDateRange } from '../search-bar';
import { useNewFilterManager } from './use-filter-manager';

export type CreateNewSearchContext =
  | boolean
  | {
      filters?: Filter[];
      fetchFilters?: Filter[];
    };

interface UseDataSourceSearchParams {
  createNewSearchContext?: CreateNewSearchContext;
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
  DataSourceRepositoryCreator: tDataSourceRepository<tParsedIndexPattern>;
}

interface UseSearchBarParams extends UseDataSourceSearchParams {
  useAbsoluteDateRange: boolean;
}

function useDataSourceNewSearchContext(context: CreateNewSearchContext) {
  const filterManager = useNewFilterManager();

  return {
    filterManager,
    filters: context?.filters || [],
    fetchFilters: context?.fetchFilters || [],
  };
}

function useDateRangeContext({ createNewSearchContext, dataSource }) {
  const { timeFilter } = useTimeFilter();
  const [dateRange, setDateRange] = useState<TimeRange>({
    from: timeFilter.from,
    to: timeFilter.to,
  });
  const [absoluteDateRange, setAbsoluteDateRange] = useState<TimeRange>(
    transformDateRange({ from: dateRange.from, to: dateRange.to }),
  );

  const setAbsoluteDateRangeTransfrom = ({ from, to }) =>
    setAbsoluteDateRange(transformDateRange({ from, to }));

  return dataSource?.indexPattern?.timeField
    ? {
        dateRange,
        setDateRange,
        absoluteDateRange,
        setAbsoluteDateRange: setAbsoluteDateRangeTransfrom,
      }
    : {};
}

export function useDataSourceSearchContext({
  createNewSearchContext,
  DataSource,
  DataSourceRepositoryCreator,
}: UseDataSourceSearchParams) {
  const dataSourceDeps = createNewSearchContext
    ? useDataSourceNewSearchContext(createNewSearchContext)
    : {};

  const {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: DataSource,
    repository: new DataSourceRepositoryCreator(),
    ...dataSourceDeps,
  });

  return {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading,
    fetchData,
    setFilters,
  };
}

export function useDataSourceWithSearchBar({
  createNewSearchContext,
  DataSource,
  DataSourceRepositoryCreator,
  useAbsoluteDateRange = false,
}: UseSearchBarParams) {
  // Data source
  const {
    dataSource,
    filters,
    fixedFilters,
    fetchFilters,
    isLoading,
    fetchData,
    setFilters,
  } = useDataSourceSearchContext({
    createNewSearchContext,
    DataSource,
    DataSourceRepositoryCreator,
  });

  // Query
  const [newQuery, setNewQuery] = createNewSearchContext
    ? useState<Query>({ query: '', language: 'kuery' })
    : [undefined, undefined];

  // Timefilter
  const { dateRange, setDateRange, absoluteDateRange, setAbsoluteDateRange } =
    useDateRangeContext({
      createNewSearchContext,
      dataSource,
    });

  // Search bar
  const { searchBarProps, fingerprint, autoRefreshFingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
    setQuery: setNewQuery,
    query: newQuery,
    setTimeFilter: setDateRange,
  } as tUseSearchBarProps);

  const fetchDataWrapQueryDateRange = params =>
    fetchData({
      query: searchBarProps.query,
      dateRange: dataSource?.indexPattern?.timeField
        ? useAbsoluteDateRange
          ? absoluteDateRange
          : dateRange
        : undefined,
      ...params,
    });

  return {
    dataSource,
    filters,
    fixedFilters,
    fetchFilters,
    isLoading,
    fetchData: fetchDataWrapQueryDateRange,
    setFilters,
    searchBarProps,
    fingerprint,
    autoRefreshFingerprint,
    query: searchBarProps.query,
    dateRange,
    absoluteDateRange,
    setAbsoluteDateRange,
  };
}
