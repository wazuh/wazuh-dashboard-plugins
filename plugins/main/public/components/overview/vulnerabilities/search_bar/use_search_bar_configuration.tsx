import { useEffect, useState } from 'react';
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
import {
  AUTHORIZED_AGENTS,
  VULNERABILITY_CLUSTER_KEY,
  WAZUH_ALERTS_PATTERN,
} from '../../../../../common/constants';
import { AppState } from '../../../../react-services/app-state';
import { FilterStateStore } from '../../../../../../../src/plugins/data/common';
import { FilterHandler } from '../../../../utils/filter-handler';
import { ModulesHelper } from '../../../common/modules/modules-helper';

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
  const SESSION_STORAGE_FILTERS_NAME = 'wazuh_persistent_searchbar_filters';
  const SESSION_STORAGE_PREV_FILTER_NAME = 'wazuh_persistent_current_filter';
  const filterManager = useFilterManager().filterManager as FilterManager;
  const filters = filterManager.getFilters();
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
        restorePrevIndexFilters(
          previousFilters,
          prevStoragePattern ?? WAZUH_ALERTS_PATTERN,
        );
      }
    };
  }, []);

  /**
   * Verify if a pinned agent exists, identifying it by its meta.isImplicit attribute or by the agentId query param URL.
   * We also compare the agent.id filter with the agentId query param because the OSD filter definition does not include the "isImplicit" attribute that Wazuh adds.
   * There may be cases where the "isImplicit" attribute is lost, since any action regarding filters that is done with the
   * filterManager ( addFilters, setFilters, setGlobalFilters, setAppFilters)
   * does a mapAndFlattenFilters mapping to the filters that removes any attributes that are not part of the filter definition.
   * */
  const getImplicitPinnedAgent = (
    filters: Filter[],
    toIndexPattern: string,
  ): Filter | undefined => {
    const pinnedAgentByFilterManager = filters.find(
      (filter: Filter) =>
        filter?.meta?.key === 'agent.id' && !!filter?.$state?.isImplicit,
    );
    const url = window.location.href;
    const regex = new RegExp('agentId=' + '[^&]*');
    const match = url.match(regex);
    const isPinnedAgentByUrl = match && match[0];
    if (pinnedAgentByFilterManager && isPinnedAgentByUrl) {
      return {
        ...pinnedAgentByFilterManager,
        meta: {
          ...pinnedAgentByFilterManager.meta,
          index: toIndexPattern,
        },
        $state: { store: FilterStateStore.APP_STATE, isImplicit: true },
      };
    }

    if (isPinnedAgentByUrl) {
      const agentId = match[0].split('=')[1];
      return {
        meta: {
          alias: null,
          disabled: false,
          key: 'agent.id',
          negate: false,
          params: { query: agentId },
          type: 'phrase',
          index: toIndexPattern,
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
    }
    return undefined;
  };

  /**
   * When the component is unmounted, the original filters that arrived
   * when the component was mounted are added.
   * Both when the component is mounted and unmounted, the index pattern is
   * updated so that the pin action adds the agent with the correct index pattern.
   */
  const vulnerabilityIndexFiltersAdapter = () => {
    const filterHandler = new FilterHandler(AppState.getCurrentPattern());
    const initialFilters: Filter[] = [];
    const storagePreviousFilters = sessionStorage.getItem(
      SESSION_STORAGE_FILTERS_NAME,
    );
    if (storagePreviousFilters) {
      const previousFilters = JSON.parse(storagePreviousFilters);
      const previousFiltersWithoutImplicitFilters = previousFilters.filter(
        (filter: Filter) => !filter?.$state?.isImplicit,
      );
      previousFiltersWithoutImplicitFilters.forEach((filter: Filter) => {
        initialFilters.push(filter);
      });
    }

    /**
      Add vulnerability module implicit filters
    */
    const isCluster = AppState.getClusterInfo().status == 'enabled';
    const managerFilter = filterHandler.managerQuery(
      isCluster
        ? AppState.getClusterInfo().cluster
        : AppState.getClusterInfo().manager,
      true,
      VULNERABILITY_CLUSTER_KEY, // Vulnerability module does not have manager.name in the index pattern template, only fixed wazuh.cluster.name
    );
    initialFilters.push(managerFilter);
    // rule.groups is added so that the events tab can use it
    const ruleGroupsFilter = filterHandler.ruleGroupQuery(
      'vulnerability-detector',
    );
    initialFilters.push(ruleGroupsFilter);
    const vulnerabilitiesFilters = initialFilters.map((filter: Filter) => {
      return {
        ...filter,
        meta: {
          ...filter.meta,
          index: props?.defaultIndexPatternID,
        },
      };
    });
    sessionStorage.setItem(
      SESSION_STORAGE_FILTERS_NAME,
      JSON.stringify(initialFilters),
    );
    /* The rule.groups filter is removed. It is not applicable to the case of the vulnerabilities module since it has its own index */
    const vulnerabilitiesFiltersWithoutRuleGroup =
      vulnerabilitiesFilters.filter(
        (filter: Filter) => filter.meta.key !== 'rule.groups',
      );
    const implicitPinnedAgent = getImplicitPinnedAgent(
      initialFilters,
      props?.defaultIndexPatternID,
    );
    if (implicitPinnedAgent) {
      const filtersWithoutNormalAgents =
        vulnerabilitiesFiltersWithoutRuleGroup.filter(x => {
          return x.meta.key !== 'agent.id';
        });
      filtersWithoutNormalAgents.push(implicitPinnedAgent);
      filterManager.setFilters(filtersWithoutNormalAgents);
    } else {
      filterManager.setFilters(vulnerabilitiesFiltersWithoutRuleGroup);
    }
  };

  const restorePrevIndexFilters = (
    previousFilters: Filter[],
    toIndexPattern: string,
  ) => {
    const filterHandler = new FilterHandler(AppState.getCurrentPattern());
    const cleanedFilters = cleanFilters(
      previousFilters,
      props?.defaultIndexPatternID,
    ).filter(
      (filter: Filter) => filter?.meta?.key !== VULNERABILITY_CLUSTER_KEY,
    );
    const isCluster = AppState.getClusterInfo().status == 'enabled';
    /* Restore original manager implicit filter */
    const managerFilter = filterHandler.managerQuery(
      isCluster
        ? AppState.getClusterInfo().cluster
        : AppState.getClusterInfo().manager,
      isCluster,
    );
    cleanedFilters.push(managerFilter);
    const implicitPinnedAgent = getImplicitPinnedAgent(
      previousFilters,
      toIndexPattern,
    );
    if (implicitPinnedAgent) {
      const cleanedFiltersWithoutNormalAgents = cleanedFilters.filter(x => {
        return x.meta.key !== 'agent.id';
      });
      cleanedFiltersWithoutNormalAgents.push(implicitPinnedAgent);
      filterManager.setFilters(cleanedFiltersWithoutNormalAgents);
    } else {
      filterManager.setFilters(cleanedFilters);
    }
  };

  /**
   * Initialize the searchbar props with the corresponding index pattern and filters
   */
  const initSearchBar = async () => {
    setIsLoading(true);
    const indexPattern = await getIndexPattern(props?.defaultIndexPatternID);
    setIndexPatternSelected(indexPattern);
    vulnerabilityIndexFiltersAdapter();
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
   * Return cleaned filters.
   * Clean the known issue with the auto loaded agent.id filters from the searchbar
   * and filters those filters that are not related to the default index pattern.
   * This cleanup adjusts the index pattern of a pinned agent, if applicable.
   * @param previousFilters
   * @returns
   */
  const cleanFilters = (
    previousFilters: Filter[],
    indexPatternToClean: string,
  ) => {
    const mappedFilters = previousFilters.filter(
      (filter: Filter) =>
        filter?.meta?.controlledBy !== AUTHORIZED_AGENTS && // remove auto loaded agent.id filters
        filter?.meta?.index !== indexPatternToClean,
    );
    return mappedFilters;
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
      const prevStoragePattern = sessionStorage.getItem(
        SESSION_STORAGE_PREV_FILTER_NAME,
      );
      const storagePreviousFilters = sessionStorage.getItem(
        SESSION_STORAGE_FILTERS_NAME,
      );
      /**
       * If there are persisted filters, it is necessary to add them when
       * updating the filters in the filterManager
       */
      const cleanedFilters = cleanFilters(
        filters,
        prevStoragePattern ?? WAZUH_ALERTS_PATTERN,
      );
      if (storagePreviousFilters) {
        const previousFilters = JSON.parse(storagePreviousFilters);
        const previousImplicitFilters = previousFilters.filter(
          (filter: Filter) => filter?.$state?.isImplicit,
        );
        const cleanedPreviousImplicitFilters = cleanFilters(
          previousImplicitFilters,
          prevStoragePattern ?? WAZUH_ALERTS_PATTERN,
        );
        /* Normal filters added to storagePreviousFilters are added to keep them between dashboard and inventory tab */
        const newFilters = filters.filter(
          (filter: Filter) => !filter?.$state?.isImplicit,
        );

        sessionStorage.setItem(
          SESSION_STORAGE_FILTERS_NAME,
          JSON.stringify([...previousImplicitFilters, ...newFilters]),
        );

        filterManager.setFilters([
          ...cleanedPreviousImplicitFilters,
          ...cleanedFilters,
        ]);

        props?.onFiltersUpdated &&
          props?.onFiltersUpdated([
            ...cleanedPreviousImplicitFilters,
            ...cleanedFilters,
          ]);
      } else {
        filterManager.setFilters(cleanedFilters);
        props?.onFiltersUpdated && props?.onFiltersUpdated(cleanedFilters);
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
  };

  return {
    searchBarProps,
  };
};

export default useSearchBarConfiguration;
