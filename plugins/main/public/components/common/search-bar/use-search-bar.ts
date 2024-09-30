import { useEffect, useState } from 'react';
import {
  SearchBarProps,
  TimeRange,
  Query,
  Filter,
  IndexPattern,
  IndexPatternsContract,
  SavedQuery,
} from '../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../kibana-services';
import { useQueryManager, useTimeFilter } from '../hooks';
import { useSavedQuery } from '../hooks/saved_query/use_saved_query';
import { transformDateRange } from './search-bar-service';

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
      absoluteDateRange: TimeRange;
    }
  >;
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
  } = useTimeFilter();
  const [timeFilter, setTimeFilter] = useState(globalTimeFilter);
  const [query, setQuery] = props?.setQuery
    ? useState(props?.query || { query: '', language: 'kuery' })
    : useQueryManager();

  // This absoluteDateRange is used to ensure that the date range is the same when we make the
  // pagination request with relative dates like "Last 24 hours"
  const [absoluteDateRange, setAbsoluteDateRange] = useState<TimeRange>(
    transformDateRange(globalTimeFilter),
  );
  const { query: queryService } = getDataPlugin();
  const { savedQuery, setSavedQuery, clearSavedQuery } = useSavedQuery({
    queryService,
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

  useEffect(() => {
    initSearchBar();
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
      absoluteDateRange: TimeRange;
    }
  > = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters,
    query,
    timeHistory,
    absoluteDateRange,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onFiltersUpdated: (userFilters: Filter[]) => {
      setFilters
        ? setFilters(userFilters)
        : console.warn('setFilters function is not defined');
      props?.onFiltersUpdated && props?.onFiltersUpdated(userFilters);
    },
    refreshInterval: queryService.timefilter.timefilter.getRefreshInterval().value,
    isRefreshPaused: queryService.timefilter.timefilter.getRefreshInterval().pause,
    onRefreshChange: (opts) => {
      queryService.timefilter.timefilter.setRefreshInterval(opts);
    },
    onRefresh: ({ dateRange }) => {
      setAbsoluteDateRange(transformDateRange(dateRange));
    },
    onQuerySubmit: (
      payload: { dateRange: TimeRange; query?: Query },
      _isUpdate?: boolean,
    ): void => {
      const { dateRange, query } = payload;
      // its necessary execute setter to apply query filters
      // when the hook receives the dateRange use the setter instead the global setTimeFilter
      props?.setTimeFilter
        ? props?.setTimeFilter(dateRange)
        : setGlobalTimeFilter(dateRange);
      props?.setQuery ? props?.setQuery(query) : setQuery(query);
      props?.onQuerySubmitted && props?.onQuerySubmitted(payload);
      setTimeFilter(dateRange);
      setAbsoluteDateRange(transformDateRange(dateRange));
      setQuery(query);
    },
    // its necessary to use saved queries. if not, the load saved query not work
    onClearSavedQuery: () => {
      setFilters([]);
      clearSavedQuery();
    },
    onSaved: (savedQuery: SavedQuery) => {
      const savedQueryFilters = savedQuery.attributes.filters || [];
      setFilters([...savedQueryFilters]);
      setSavedQuery(savedQuery);
    },
    onSavedQueryUpdated: (savedQuery: SavedQuery) => {
      const savedQueryFilters = savedQuery.attributes.filters || [];
      setFilters([...savedQueryFilters]);
      setSavedQuery(savedQuery);
    },
    savedQuery,
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
