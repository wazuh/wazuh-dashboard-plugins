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
import { AUTHORIZED_AGENTS } from '../../../../common/constants';

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
const useSearchBar = (
  props?: tUseSearchBarProps,
): tUserSearchBarResponse => {
  // dependencies
  const SESSION_STORAGE_FILTERS_NAME = 'wazuh_persistent_searchbar_filters';
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
    if (filters && filters.length > 0) {
      sessionStorage.setItem(
        SESSION_STORAGE_FILTERS_NAME,
        JSON.stringify(filters),
      );
    }
    initSearchBar();
    /**
     * When the component is disassembled, the original filters that arrived
     * when the component was assembled are added.
     */
    return () => {
      const storagePreviousFilters = sessionStorage.getItem(
        SESSION_STORAGE_FILTERS_NAME,
      );
      if (storagePreviousFilters) {
        const previousFilters = JSON.parse(storagePreviousFilters);
        const cleanedFilters = cleanFilters(previousFilters);
        filterManager.setFilters(cleanedFilters);
      }
    };
  }, []);

  /**
   * Initialize the searchbar props with the corresponding index pattern and filters
   */
  const initSearchBar = async () => {
    setIsLoading(true);
    const indexPattern = await getIndexPattern(props?.defaultIndexPatternID);
    setIndexPatternSelected(indexPattern);
    const initialFilters = props?.filters ?? filters;
    filterManager.setFilters(initialFilters);
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
   * Return filters from filters manager.
   * Additionally solve the known issue with the auto loaded agent.id filters from the searchbar
   * and filters those filters that are not related to the default index pattern
   * @returns
   */
  const getFilters = () => {
    const originalFilters = filterManager ? filterManager.getFilters() : [];
    return originalFilters.filter(
      (filter: Filter) =>
        filter?.meta?.controlledBy !== AUTHORIZED_AGENTS && // remove auto loaded agent.id filters
        filter?.meta?.index === props?.defaultIndexPatternID,
    );
  };

  /**
   * Return cleaned filters.
   * Clean the known issue with the auto loaded agent.id filters from the searchbar
   * and filters those filters that are not related to the default index pattern
   * @param previousFilters
   * @returns
   */
  const cleanFilters = (previousFilters: Filter[]) => {
    return previousFilters.filter(
      (filter: Filter) =>
        filter?.meta?.controlledBy !== AUTHORIZED_AGENTS &&
        filter?.meta?.index !== props?.defaultIndexPatternID,
    );
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
      const storagePreviousFilters = sessionStorage.getItem(
        SESSION_STORAGE_FILTERS_NAME,
      );
      /**
       * If there are persisted filters, it is necessary to add them when
       * updating the filters in the filterManager
       */
      if (storagePreviousFilters) {
        const previousFilters = JSON.parse(storagePreviousFilters);
        const cleanedFilters = cleanFilters(previousFilters);
        filterManager.setFilters([...cleanedFilters, ...filters]);

        props?.onFiltersUpdated &&
          props?.onFiltersUpdated([...cleanedFilters, ...filters]);
      } else {
        filterManager.setFilters(filters);
        props?.onFiltersUpdated && props?.onFiltersUpdated(filters);
      }
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
    useDefaultBehaviors: true 
  };

  return {
    searchBarProps,
  };
};

export default useSearchBar;
