import React, { useEffect, useState } from 'react';
import {
  SearchBarProps,
  FilterManager,
  TimeRange,
  Query,
} from '../../../../../../../src/plugins/data/public';
import {
  Filter,
  IIndexPattern,
  IndexPatternsContract,
} from '../../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../../kibana-services';

import {
  useFilterManager,
  useQueryManager,
  useTimeFilter,
} from '../../../common/hooks';
import { AUTHORIZED_AGENTS } from '../../../../../common/constants';

// Input - types
type tUseSearchBarCustomInputs = {
  defaultIndexPatternID: IIndexPattern['id'];
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
  props?: tUseSearchBarProps,
): tUserSearchBarResponse => {
  // dependencies
  const filterManager = useFilterManager().filterManager as FilterManager;
  const { filters } = useFilterManager();
  const [query, setQuery] = props?.query
    ? useState(props?.query)
    : useQueryManager();
  const { timeFilter, timeHistory, setTimeFilter } = useTimeFilter();
  // states
  const [isLoading, setIsLoading] = useState(false);
  const [indexPatternSelected, setIndexPatternSelected] =
    useState<IIndexPattern>();

  useEffect(() => {
    initSearchBar();
  }, []);

  useEffect(() => {
    const defaultIndex = props?.defaultIndexPatternID;
    /* Filters that do not belong to the default index are filtered */
    const cleanedFilters = filters.filter(
      filter => filter.meta.index === defaultIndex,
    );
    if (cleanedFilters.length !== filters.length) {
      filterManager.setFilters(cleanedFilters);
    }
  }, [filters]);

  /**
   * Initialize the searchbar props with the corresponding index pattern and filters
   */
  const initSearchBar = async () => {
    setIsLoading(true);
    const indexPattern = await getIndexPattern(props?.defaultIndexPatternID);
    setIndexPatternSelected(indexPattern);
    const filters = await getInitialFilters(indexPattern);
    filterManager.setFilters(filters);
    setIsLoading(false);
  };

  /**
   * Return the index pattern data by ID.
   * If not receive a ID return the default index from the index pattern service
   * @returns
   */
  const getIndexPattern = async (indexPatternID?: string) => {
    const indexPatternService = getDataPlugin()
      .indexPatterns as IndexPatternsContract;
    if (indexPatternID) {
      try {
        return await indexPatternService.get(indexPatternID);
      } catch (error) {
        // when the index pattern id not exists will get the default
        console.error(error);
        return await indexPatternService.getDefault();
      }
    } else {
      return await indexPatternService.getDefault();
    }
  };

  /**
   * Return the initial filters considering if hook receives initial filters
   * When the default index pattern is the same like the received preserve the filters
   * @param indexPattern
   * @returns
   */
  const getInitialFilters = async (indexPattern: IIndexPattern) => {
    const indexPatternService = getDataPlugin()
      .indexPatterns as IndexPatternsContract;
    let initialFilters: Filter[] = [];
    if (props?.filters) {
      return props?.filters;
    }
    if (indexPattern) {
      // get filtermanager and filters
      // if the index is the same, get filters stored
      // else clear filters
      const defaultIndexPattern =
        (await indexPatternService.getDefault()) as IIndexPattern;
      initialFilters =
        defaultIndexPattern.id === indexPattern.id
          ? filterManager.getFilters()
          : [];
    } else {
      initialFilters = [];
    }
    return initialFilters;
  };

  /**
   * Return filters from filters manager.
   * Additionally solve the known issue with the auto loaded agent.id filters from the searchbar
   * @returns
   */
  const getFilters = () => {
    const filters = filterManager ? filterManager.getFilters() : [];
    return filters.filter(
      filter => filter.meta.controlledBy !== AUTHORIZED_AGENTS,
    ); // remove auto loaded agent.id filters
  };

  /**
   * Search bar properties necessary to render and initialize the osd search bar component
   */
  const searchBarProps: Partial<SearchBarProps> = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters: getFilters(),
    query,
    timeHistory,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onFiltersUpdated: (filters: Filter[]) => {
      // its necessary execute setter to apply filters
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
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
