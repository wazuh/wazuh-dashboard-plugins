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
import { AppState } from '../../../react-services/app-state';
import { getSettingDefaultValue } from '../../../../common/services/settings';
import { FilterStateStore } from '../../../../../../src/plugins/data/common';

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
const useSearchBar = (props?: tUseSearchBarProps): tUserSearchBarResponse => {
  // dependencies
  const SESSION_STORAGE_FILTERS_NAME = 'wazuh_persistent_searchbar_filters';
  const SESSION_STORAGE_PREV_FILTER_NAME = 'wazuh_persistent_current_filter';
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
    const prevPattern =
      AppState.getCurrentPattern() || getSettingDefaultValue('pattern');
    if (filters && filters.length > 0) {
      sessionStorage.setItem(
        SESSION_STORAGE_FILTERS_NAME,
        JSON.stringify(
          updatePrevFilters(filters, props?.defaultIndexPatternID),
        ),
      );
    }
    sessionStorage.setItem(SESSION_STORAGE_PREV_FILTER_NAME, prevPattern);
    AppState.setCurrentPattern(props?.defaultIndexPatternID);
    initSearchBar();

    /**
     * When the component is unmounted, the original filters that arrived
     * when the component was mounted are added.
     * Both when the component is mounted and unmounted, the index pattern is
     * updated so that the pin action adds the agent with the correct index pattern.
     */
    return () => {
      const prevStoragePattern = sessionStorage.getItem(
        SESSION_STORAGE_PREV_FILTER_NAME,
      );
      AppState.setCurrentPattern(prevStoragePattern);
      sessionStorage.removeItem(SESSION_STORAGE_PREV_FILTER_NAME);
      const storagePreviousFilters = sessionStorage.getItem(
        SESSION_STORAGE_FILTERS_NAME,
      );
      if (storagePreviousFilters) {
        const previousFilters = JSON.parse(storagePreviousFilters);
        const cleanedFilters = cleanFilters(
          previousFilters,
          prevStoragePattern ?? prevPattern,
        );
        filterManager.setFilters(cleanedFilters);
        sessionStorage.removeItem(SESSION_STORAGE_FILTERS_NAME);
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

  const updatePrevFilters = (
    previousFilters: Filter[],
    indexPattern?: string,
  ) => {
    const pinnedAgent = previousFilters.find(
      (filter: Filter) =>
        filter.meta.key === 'agent.id' && !!filter?.$state?.isImplicit,
    );
    if (!pinnedAgent) {
      const url = window.location.href;
      const regex = new RegExp('agentId=' + '[^&]*');
      const match = url.match(regex);
      if (match && match[0]) {
        const agentId = match[0].split('=')[1];
        const agentFilters = previousFilters.filter(x => {
          return x.meta.key !== 'agent.id';
        });
        const insertPinnedAgent = {
          meta: {
            alias: null,
            disabled: false,
            key: 'agent.id',
            negate: false,
            params: { query: agentId },
            type: 'phrase',
            index: indexPattern,
          },
          query: {
            match: {
              'agent.id': {
                query: agentId,
                type: 'phrase',
              },
            },
          },
          $state: { store: 'appState', isImplicit: true },
        };
        agentFilters.push(insertPinnedAgent);
        return agentFilters;
      }
    }
    if (pinnedAgent) {
      const agentFilters = previousFilters.filter(x => {
        return x.meta.key !== 'agent.id';
      });
      agentFilters.push({
        ...pinnedAgent,
        meta: {
          ...pinnedAgent.meta,
          index: indexPattern,
        },
        $state: { store: FilterStateStore.APP_STATE, isImplicit: true },
      });
      return agentFilters;
    }
    return previousFilters;
  };

  /**
   * Return filters from filters manager.
   * Additionally solve the known issue with the auto loaded agent.id filters from the searchbar
   * and filters those filters that are not related to the default index pattern
   * @returns
   */
  const getFilters = () => {
    const originalFilters = filterManager ? filterManager.getFilters() : [];
    const pinnedAgent = originalFilters.find(
      (filter: Filter) =>
        filter.meta.key === 'agent.id' && !!filter?.$state?.isImplicit,
    );
    const mappedFilters = originalFilters.filter(
      (filter: Filter) =>
        filter?.meta?.controlledBy !== AUTHORIZED_AGENTS && // remove auto loaded agent.id filters
        filter?.meta?.index === props?.defaultIndexPatternID,
    );

    if (pinnedAgent) {
      const agentFilters = mappedFilters.filter(x => {
        return x.meta.key !== 'agent.id';
      });
      agentFilters.push({
        ...pinnedAgent,
        meta: {
          ...pinnedAgent.meta,
          index: props?.defaultIndexPatternID,
        },
      });
      return agentFilters;
    }
    return mappedFilters;
  };

  /**
   * Return cleaned filters.
   * Clean the known issue with the auto loaded agent.id filters from the searchbar
   * and filters those filters that are not related to the default index pattern.
   * This cleanup adjusts the index pattern of a pinned agent, if applicable.
   * @param previousFilters
   * @returns
   */
  const cleanFilters = (previousFilters: Filter[], indexPattern?: string) => {
    /**
     * Verify if a pinned agent exists, identifying it by its meta.isImplicit attribute or by the agentId query param URL.
     * We also compare the agent.id filter with the agentId query param because the OSD filter definition does not include the "isImplicit" attribute that Wazuh adds.
     * There may be cases where the "isImplicit" attribute is lost, since any action regarding filters that is done with the
     * filterManager ( addFilters, setFilters, setGlobalFilters, setAppFilters)
     * does a mapAndFlattenFilters mapping to the filters that removes any attributes that are not part of the filter definition.
     * */
    const mappedFilters = previousFilters.filter(
      (filter: Filter) =>
        filter?.meta?.controlledBy !== AUTHORIZED_AGENTS && // remove auto loaded agent.id filters
        filter?.meta?.index !== props?.defaultIndexPatternID,
    );
    const pinnedAgent = mappedFilters.find(
      (filter: Filter) =>
        filter.meta.key === 'agent.id' && !!filter?.$state?.isImplicit,
    );

    if (!pinnedAgent) {
      const url = window.location.href;
      const regex = new RegExp('agentId=' + '[^&]*');
      const match = url.match(regex);
      if (match && match[0]) {
        const agentId = match[0].split('=')[1];
        const agentFilters = mappedFilters.filter(x => {
          return x.meta.key !== 'agent.id';
        });
        const insertPinnedAgent = {
          meta: {
            alias: null,
            disabled: false,
            key: 'agent.id',
            negate: false,
            params: { query: agentId },
            type: 'phrase',
            index: indexPattern,
          },
          query: {
            match: {
              'agent.id': {
                query: agentId,
                type: 'phrase',
              },
            },
          },
          $state: { store: 'appState', isImplicit: true },
        };
        agentFilters.push(insertPinnedAgent);
        return agentFilters;
      }
    }
    if (pinnedAgent) {
      mappedFilters.push({
        ...pinnedAgent,
        meta: {
          ...pinnedAgent.meta,
          index: indexPattern,
        },
        $state: { store: FilterStateStore.APP_STATE, isImplicit: true },
      });
    }
    return mappedFilters;
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
        const cleanedFilters = cleanFilters(
          previousFilters,
          props?.defaultIndexPatternID,
        );
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
    useDefaultBehaviors: true,
  };

  return {
    searchBarProps,
  };
};

export default useSearchBar;
