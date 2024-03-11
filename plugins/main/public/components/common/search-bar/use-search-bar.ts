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
import { getDataPlugin, getWazuhCorePlugin } from '../../../kibana-services';
import { useFilterManager, useQueryManager, useTimeFilter } from '../hooks';
import {
  AUTHORIZED_AGENTS,
  DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
} from '../../../../common/constants';

// Input - types
type tUseSearchBarCustomInputs = {
  defaultIndexPatternID: IIndexPattern['id'];
  onFiltersUpdated?: (filters: Filter[]) => void;
  onQuerySubmitted?: (
    payload: { dateRange: TimeRange; query?: Query },
    isUpdate?: boolean,
  ) => void;
  onMount?: (
    filterManager: FilterManager,
    defaultIndexPatternID: string,
  ) => void;
  onUpdate?: (filters: Filter[], filterManager: FilterManager) => void;
  onUnMount?: (
    previousFilters: Filter[],
    toIndexPattern: string | null,
    filterManager: FilterManager,
    defaultIndexPatternID: string,
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
  const SESSION_STORAGE_FILTERS_NAME = 'wazuh_persistent_searchbar_filters';
  const SESSION_STORAGE_PREV_FILTER_NAME = 'wazuh_persistent_current_filter';
  const filterManager = useFilterManager().filterManager as FilterManager;
  const filters = props?.filters ? props.filters : filterManager.getFilters();
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
    return () => {
      /* Upon unmount, the previous filters are restored */
      const prevStoragePattern = sessionStorage.getItem(
        SESSION_STORAGE_PREV_FILTER_NAME,
      );
      sessionStorage.removeItem(SESSION_STORAGE_PREV_FILTER_NAME);
      const storagePreviousFilters = sessionStorage.getItem(
        SESSION_STORAGE_FILTERS_NAME,
      );
      if (storagePreviousFilters) {
        const previousFilters = JSON.parse(storagePreviousFilters);
        if (props?.onUnMount) {
          props.onUnMount(
            previousFilters,
            prevStoragePattern,
            filterManager,
            props?.defaultIndexPatternID,
          );
        }
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
    if (props?.onMount) {
      props.onMount(filterManager, props?.defaultIndexPatternID);
    } else {
      filterManager.setFilters(filters);
    }
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
   * Search bar properties necessary to render and initialize the osd search bar component
   */
  const searchBarProps: Partial<SearchBarProps> = {
    isLoading,
    ...(indexPatternSelected && { indexPatterns: [indexPatternSelected] }), // indexPattern cannot be empty or empty []
    filters: filters
      .filter(
        (filter: Filter) =>
          ![
            AUTHORIZED_AGENTS,
            DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
          ].includes(filter?.meta?.controlledBy), // remove auto loaded agent.id filters
      )
      .sort((a: Filter, b: Filter) => {
        return a?.$state?.isImplicit && !(a?.meta?.key === 'agent.id')
          ? -1
          : b?.$state?.isImplicit
          ? 1
          : -1;
      }),
    query,
    timeHistory,
    dateRangeFrom: timeFilter.from,
    dateRangeTo: timeFilter.to,
    onFiltersUpdated: (filters: Filter[]) => {
      if (props?.onUpdate) {
        props.onUpdate(filters, filterManager, props?.onFiltersUpdated);
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
    useDefaultBehaviors: true,
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
