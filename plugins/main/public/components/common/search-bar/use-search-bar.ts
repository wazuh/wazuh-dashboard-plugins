import { useEffect, useState } from 'react';
import { isEqual } from 'lodash';
import {
  SearchBarProps,
  TimeRange,
  Query,
  Filter,
  IndexPattern,
  IndexPatternsContract,
} from '../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../kibana-services';
import { useQueryManager, useTimeFilter } from '../hooks';
import { useSavedQuery } from '../hooks/saved_query/use_saved_query';

// Input - types
type tUseSearchBarCustomInputs = {
  indexPattern: IndexPattern;
  setFilters: (filters: Filter[]) => void;
  setTimeFilter?: (timeRange: TimeRange) => void;
  setQuery?: (query?: Query) => void;
  onFiltersUpdated?: (filters: Filter[]) => void;
  onQuerySubmitted?: (
    payload: { dateRange: TimeRange; query?: Query },
    isUpdate?: boolean,
  ) => void;
};
export type tUseSearchBarProps = Partial<SearchBarProps> &
  tUseSearchBarCustomInputs;

// Output types
type tUserSearchBarResponse = {
  searchBarProps: Partial<
    SearchBarProps & {
      useDefaultBehaviors: boolean;
    }
  >;
  fingerprint: number;
  autoRefreshFingerprint: number;
};

/**
 * Hook used to compose the searchbar configuration props
 * @param props
 * @returns
 */
const useSearchBarConfiguration = (
  props: tUseSearchBarProps,
): tUserSearchBarResponse => {
  const { indexPattern, filters = [], setFilters } = props;

  // dependencies
  const {
    timeFilter: globalTimeFilter,
    timeHistory,
    setTimeFilter: setGlobalTimeFilter,
    setRefreshInterval,
  } = useTimeFilter();
  const [timeFilter, setTimeFilter] = useState(globalTimeFilter);
  const [query, setQuery] = props?.setQuery
    ? useState(props?.query || { query: '', language: 'kuery' })
    : useQueryManager();

  /* The state of the fingerprint is meant to pass this value to "lastReloadRequestTime" in
   * the Dashboards embeddables so they refresh when the user clicks on the Update button in the search bar.
   */
  const [fingerprint, setFingerprint] = useState(Date.now());

  /*
    This fingerprint is used for auto refresh of time filter
  */
  const [autoRefreshFingerprint, setAutoRefreshFingerprint] = useState(
    Date.now(),
  );

  const { query: queryService } = getDataPlugin();
  const { savedQuery, setSavedQuery, clearSavedQuery } = useSavedQuery({
    queryService,
    setTimeFilter,
    setRefreshInterval,
    setFilters,
    setQuery,
  });
  // states
  const [isLoading, setIsLoading] = useState(true);
  const [indexPatternSelected, setIndexPatternSelected] =
    useState<IndexPattern>(indexPattern);

  useEffect(() => {
    if (indexPattern) {
      setIndexPatternSelected(indexPattern);
    }
  }, [indexPattern]);

  useEffect(() => setTimeFilter(globalTimeFilter), [globalTimeFilter]);

  useEffect(() => {
    initSearchBar();
  }, []);

  // Subscribe to changes in the search bar auto refresh feature (every 5 seconds, etc.)
  useEffect(() => {
    const subscription = queryService.timefilter.timefilter
      .getAutoRefreshFetch$()
      .subscribe(() => setAutoRefreshFingerprint(Date.now()));
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Initialize the searchbar props with the corresponding index pattern and filters
   */
  const initSearchBar = async () => {
    setIsLoading(true);
    if (!indexPattern) {
      const defaultIndexPattern = await getDefaultIndexPattern();
      setIndexPatternSelected(defaultIndexPattern);
    } else {
      setIndexPatternSelected(indexPattern);
    }
    setIsLoading(false);
  };

  /**
   * Return the index pattern data by ID.
   * If not receive a ID return the default index from the index pattern service
   * @returns
   */
  const getDefaultIndexPattern = async (): Promise<IndexPattern> => {
    const indexPatternService = getDataPlugin()
      .indexPatterns as IndexPatternsContract;
    return await indexPatternService.getDefault();
  };

  /**
   * Search bar properties necessary to render and initialize the osd search bar component
   */

  const searchBarProps: Partial<
    SearchBarProps & {
      useDefaultBehaviors: boolean;
    }
  > = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters,
    query,
    timeHistory,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onFiltersUpdated: (userFilters: Filter[]) => {
      setFilters
        ? setFilters(userFilters)
        : console.warn('setFilters function is not defined');
      props?.onFiltersUpdated && props?.onFiltersUpdated(userFilters);
    },
    refreshInterval:
      queryService.timefilter.timefilter.getRefreshInterval().value,
    isRefreshPaused:
      queryService.timefilter.timefilter.getRefreshInterval().pause,
    onRefreshChange: (options: {
      isPaused: boolean;
      refreshInterval: number;
    }) => {
      const { timefilter } = queryService.timefilter;
      timefilter.setRefreshInterval({
        value: options.refreshInterval,
        pause: options.isPaused,
      });
    },
    onQuerySubmit: (
      payload: { dateRange: TimeRange; query?: Query },
      _isUpdate?: boolean,
    ): void => {
      const { dateRange: newDateRange, query: newQuery } = payload;
      // its necessary execute setter to apply query filters
      // when the hook receives the dateRange use the setter instead the global setTimeFilter
      props?.setTimeFilter
        ? props?.setTimeFilter(newDateRange)
        : setGlobalTimeFilter(newDateRange);
      props?.setQuery ? props?.setQuery(newQuery) : setQuery(newQuery);
      props?.onQuerySubmitted && props?.onQuerySubmitted(payload);
      // Change the fingerprint only when the search parameter are all the same. This should happen only when the user clicks on Update button
      if (isEqual(newDateRange, timeFilter) && isEqual(query, newQuery)) {
        setFingerprint(Date.now());
      }

      setTimeFilter(newDateRange);
      setQuery(newQuery);
    },
    // its necessary to use saved queries. if not, the load saved query not work
    onClearSavedQuery: clearSavedQuery,
    onSaved: setSavedQuery,
    onSavedQueryUpdated: setSavedQuery,
    savedQuery,
  };

  return {
    searchBarProps,
    fingerprint,
    autoRefreshFingerprint,
  };
};

export default useSearchBarConfiguration;
