import { useEffect, useState } from 'react';
import {
  SearchBarProps,
  FilterManager,
  TimeRange,
  Query,
  Filter,
  IIndexPattern,
  IndexPatternsContract,
} from '../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../kibana-services';
import { useFilterManager, useQueryManager, useTimeFilter } from '../hooks';

// Input - types
type tUseSearchBarCustomInputs = {
  indexPattern: IIndexPattern;
  filterManager?: FilterManager;
  onFiltersUpdated?: (filters: Filter[]) => void;
  onQuerySubmitted?: (
    payload: { dateRange: TimeRange; query?: Query },
    isUpdate?: boolean,
  ) => void;
};
type tUseSearchBarProps = Partial<SearchBarProps> & tUseSearchBarCustomInputs;

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
  const { indexPattern, filterManager: defaultFilterManager, filters: defaultFilters } = props;
  // dependencies
  const filterManager = defaultFilterManager ? defaultFilterManager : useFilterManager().filterManager as FilterManager;
  const filters = defaultFilters ? defaultFilters : filterManager.getFilters();
  const [query, setQuery] = props?.query
    ? useState(props?.query)
    : useQueryManager();
  const { timeFilter, timeHistory, setTimeFilter } = useTimeFilter();
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [indexPatternSelected, setIndexPatternSelected] = useState<IIndexPattern>(indexPattern);

  useEffect(() => {
    // default index pattern id is required
    if (indexPattern) {
      initSearchBar();
    }
  }, [indexPattern]);

  /**
   * Initialize the searchbar props with the corresponding index pattern and filters
   */
  const initSearchBar = async () => {
    setIsLoading(true);
    const defaultIndexPattern = await getDefaultIndexPattern();
    setIndexPatternSelected(indexPattern || defaultIndexPattern);
    setIsLoading(false);
  };

  /**
   * Return the index pattern data by ID.
   * If not receive a ID return the default index from the index pattern service
   * @returns
   */
  const getDefaultIndexPattern = async (): Promise<IndexPattern> => {
    const indexPatternService = getDataPlugin().indexPatterns as IndexPatternsContract;
    return await indexPatternService.getDefault();
  };

  /**
   * Search bar properties necessary to render and initialize the osd search bar component
   */
  const searchBarProps: Partial<SearchBarProps> = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters: filters,
    query,
    timeHistory,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onFiltersUpdated: (filters: Filter[]) => {
      filterManager.setFilters(filters);
      props?.onFiltersUpdated && props?.onFiltersUpdated(filters);
    },
    onQuerySubmit: (
      payload: { dateRange: TimeRange; query?: Query },
      _isUpdate?: boolean,
    ): void => {
      const { dateRange, query } = payload;
      // its necessary execute setter to apply query filters
      setTimeFilter(dateRange);
      setQuery(query);
      props?.onQuerySubmitted && props?.onQuerySubmitted(payload);
    },
    // its necessary to use saved queries. if not, the load saved query not work
    useDefaultBehaviors: true,
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
