import { useEffect, useState, useLayoutEffect } from 'react';
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
import { hideCloseButtonOnFixedFilters } from './search-bar-service';
// Input - types
type tUseSearchBarCustomInputs = {
  indexPattern: IndexPattern;
  setFilters: (filters: Filter[]) => void;
  setTimeFilter?: (timeRange: TimeRange) => void;
  setQuery?: (query: Query) => void;
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
  searchBarProps: Partial<SearchBarProps>;
};

/**
 * Hook used to compose the searchbar configuration props
 * @param props
 * @returns
 */
const useSearchBarConfiguration = (
  props: tUseSearchBarProps,
): tUserSearchBarResponse => {
  const { indexPattern, filters: defaultFilters, setFilters } = props;

  // dependencies
  const {
    timeFilter: globalTimeFilter,
    timeHistory,
    setTimeFilter: setGlobalTimeFilter,
  } = useTimeFilter();
  const filters = defaultFilters ? defaultFilters : [];
  const [timeFilter, setTimeFilter] = useState(globalTimeFilter);
  const [query, setQuery] = props?.setQuery
    ? useState(props?.query || { query: '', language: 'kuery' })
    : useQueryManager();

  // states
  const [isLoading, setIsLoading] = useState(true);
  const [indexPatternSelected, setIndexPatternSelected] =
    useState<IndexPattern>(indexPattern);
  const TIMEOUT_MILISECONDS = 100;

  const hideRemoveFilter = (filters, retry: number = 0) => {
    const allFilters = filters;
    let elements = document.querySelectorAll(
      '.wz-search-bar .globalFilterItem',
    );
    // when the filters are not empty in DOM and the length is equal to the filters length
    if (elements.length > 0 && elements.length === allFilters.length) {
      hideCloseButtonOnFixedFilters(allFilters, elements);
    } else if (retry < 10) {
      // the setTimeout is used to wait for the DOM elements to be rendered
      setTimeout(() => {
        // this is a workaround to hide the close button on fixed filters via vanilla js
        hideRemoveFilter(allFilters, ++retry);
      }, TIMEOUT_MILISECONDS);
    }
  };

  useLayoutEffect(() => {
    setTimeout(() => {
      // this is a workaround to hide the close button on fixed filters via vanilla js
      hideRemoveFilter(filters);
    }, TIMEOUT_MILISECONDS);
  }, [filters]);

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
    SearchBarProps & { useDefaultBehaviors: boolean }
  > = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters: filters,
    query,
    timeHistory,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onFiltersUpdated: (filters: Filter[]) => {
      setFilters
        ? setFilters(filters)
        : console.warn('setFilters function is not defined');
      props?.onFiltersUpdated && props?.onFiltersUpdated(filters);
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
      setQuery(query);
    },

    // its necessary to use saved queries. if not, the load saved query not work
    useDefaultBehaviors: true,
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
