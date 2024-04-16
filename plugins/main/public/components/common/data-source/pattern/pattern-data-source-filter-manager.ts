import store from '../../../../redux/store';
import { AppState } from '../../../../react-services/app-state';
import { getDataPlugin } from '../../../../kibana-services';
import { FilterHandler } from '../../../../utils/filter-handler';
import { tDataSourceFilterManager, tFilter, tSearchParams, tDataSource, tFilterManager } from '../index';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT, DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER, AUTHORIZED_AGENTS } from '../../../../../common/constants';
const MANAGER_AGENT_ID = '000';
const AGENT_ID_KEY = 'agent.id';

/**
 * Get the filter that excludes the data related to Wazuh servers
 * @param indexPatternTitle Index pattern title
 * @returns
 */
export function getFilterExcludeManager(indexPatternTitle: string) {
  return {
    meta: {
      alias: null,
      disabled: false,
      key: AGENT_ID_KEY,
      negate: true,
      params: { query: MANAGER_AGENT_ID },
      type: 'phrase',
      index: indexPatternTitle,
      controlledBy: DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
    },
    query: { match_phrase: { [AGENT_ID_KEY]: MANAGER_AGENT_ID } },
    $state: { store: 'appState' },
  };
}

/**
 * Get the filter that restrict the search to the allowed agents
 * @param agentsIds
 * @param indexPatternTitle
 * @returns
 */
export function getFilterAllowedAgents(
  agentsIds: string[],
  indexPatternTitle: string,
) {
  const field = AGENT_ID_KEY;
  return {
    meta: {
      index: indexPatternTitle,
      type: 'phrases',
      key: field,
      value: agentsIds.toString(),
      params: agentsIds,
      alias: null,
      negate: false,
      disabled: false,
      controlledBy: AUTHORIZED_AGENTS,
    },
    query: {
      bool: {
        should: agentsIds.map(id => {
          return {
            match_phrase: {
              [field]: id,
            },
          };
        }),
        minimum_should_match: 1,
      },
    },
    $state: {
      store: 'appState',
    },
  };
}

export class PatternDataSourceFilterManager implements tDataSourceFilterManager {
    private filterManager: tFilterManager;
    constructor(private dataSource: tDataSource, filters: tFilter[] = [], filterStorage?: tFilterManager) {
      if (!dataSource) {
        throw new Error('Data source is required');
      }
      
      // when the filterManager is not received get the global filterManager
      this.filterManager = filterStorage || getDataPlugin().query.filterManager;
      if(!this.filterManager) {
        throw new Error('Filter manager is required');
      }
      
      this.setFilters(this.getDefaultFilters(filters));
    }
  
    getUpdates$(): any {
      return this.filterManager.getUpdates$();
    }

    /**
     * Get the filters necessary to fetch the data from the data source
     * @returns 
     */
    fetch(params: Omit<tSearchParams, 'filters'> = {}): Promise<any> {
      return this.dataSource.fetch({
        ...params,
        filters: this.getFetchFilters(),
      });
    }
  
    setFilters(filters: tFilter[]) {
      // remove hidden filters, is used to remove the fetch filters that are applied by an external source that add filters to the global filter manager
      let cleanedFilters = this.removeHiddenFilters(filters); 
      // to prevent repeted filter the controlledBy value cannot be the same, cannot exists to filters with the same controlledBy value
      cleanedFilters = this.removeWithSameControlledBy(cleanedFilters);
      this.filterManager && this.filterManager.setFilters(cleanedFilters);
    }

    /**
     * Get all the filters from the filters manager and only returns the filters added by the user and 
     * adds the fixed filters defined in the data source.
     * @param filters 
     * @returns 
     */
    private getDefaultFilters(filters: tFilter[]) {
      const defaultFilters = filters.length ? filters : this.getFilters();
      return [
        ...this.getFixedFilters(),
        ...this.filterUserFilters(defaultFilters) || [],
      ];      
    }
  
    /**
     * Filter the filters that was added by the user
     * The filters must not have:
     *  - the property isImplicit ($state.isImplicit) defined --- DEPRECATED THE USE OF isImplicity PROPERTY INSIDE THE FILTERS
     *  - the meta.controlledBy property defined
     *  - the meta.index is not the same as the dataSource.id
     * 
     */
    private filterUserFilters(filters: tFilter[]) {
      if (!filters) return [];
      return this.removeRepeatedFilters(filters.filter(
        filter => !(filter?.$state?.['isImplicit'] || filter.meta?.controlledBy || filter.meta?.index !== this.dataSource.id)
      )) as tFilter[];
    }
  
    /**
     * Return the fixed filters. The fixed filters are filters that cannot be removed by the user.
     * The filters for the specific data source are defined in the data source.
     * Also, exists fixed filters that are defined in the data source filter manager (globally).
     * @returns 
     */
    getFixedFilters(): tFilter[] {
      const fixedFilters = this.dataSource.getFixedFilters();
      return [
        ...fixedFilters,
      ]
    }
  
    /**
     * Return the filters that was added by the user and the fixed filters.
     * This can be use to show the filters in the UI (For instance: SearchBar)
     * @returns 
     */
    getFilters() {
        return [
          //...this.getDefaultFilters(this.filterManager.getFilters())
          ...this.filterManager.getFilters()
        ] 
    }

    /**
     * Return the filters without the filters that have the property meta.controlledBy with the prefix hidden-
     */
    private removeHiddenFilters(filters: tFilter[]) {
      if (!filters) return filters;
      return filters.filter(filter => !filter.meta?.controlledBy?.startsWith('hidden-'));
    }
  
    /**
     * Concatenate the filters to fetch the data from the data source
     * @returns 
     */
    getFetchFilters(): tFilter[] {
      return [
        ...this.dataSource.getFetchFilters(),
        ...this.getFilters(),
      ] 
    }

    /**
     * Prevent duplicated filters, cannot exists with the same controlledBy value.
     * This ignore the filters that have the controlledBy value null
     * @param filters 
     * @returns 
     */
    private removeWithSameControlledBy(filters: tFilter[]): tFilter[]{
      if (!filters) return filters;
      const controlledList: string[] = [];
      const cleanedFilters: tFilter[] = [];
      filters.forEach(filter => {
        const controlledBy = filter.meta?.controlledBy;
        if (!controlledBy || !controlledList.includes(controlledBy as string)) {
          controlledList.push(controlledBy as string);
          cleanedFilters.push(filter);
        }
      });
      
      return cleanedFilters;
    }
  
    /**
     * Remove filter repeated filters in query property
     * @param filter 
     * @returns 
     */
    
    private removeRepeatedFilters(filters: tFilter[]): tFilter[] {
      if (!filters) return filters;
      const filtersMap = filters.reduce((acc, filter) => {
        const key = JSON.stringify(filter.query);
        if (!acc[key]) {
          acc[key] = filter;
        }
        return acc;
      }, {});
      return Object.values(filtersMap);
    }


    /**
     * Return the filter when the cluster or manager are enabled
     */
    static getClusterManagerFilters(indexPatternTitle: string, controlledByValue: string, key?: string): tFilter[] {
      const filterHandler = new FilterHandler();
      const isCluster = AppState.getClusterInfo().status == 'enabled';
      const managerFilter = filterHandler.managerQuery(
          isCluster
              ? AppState.getClusterInfo().cluster
              : AppState.getClusterInfo().manager,
          isCluster,
      );
      managerFilter.meta = {
          ...managerFilter.meta,
          controlledBy: controlledByValue,
          index: indexPatternTitle
      }
      //@ts-ignore
      managerFilter.$state = {
          store: 'appState'
      }
      //@ts-ignore
      return [managerFilter] as tFilter[];
  }

   /**
   * Returns the filter when the an agent is pinned (saved in the session storage or redux store)
   */
   static getPinnedAgentFilter(indexPatternTitle: string): tFilter[] {
      const agentId = store.getState().appStateReducers?.currentAgentData?.id;
      const url = window.location.href;
      const regex = new RegExp('agentId=' + '[^&]*');
      const match = url.match(regex);
      const isPinnedAgentByUrl = match && match[0];
      if (!agentId && !isPinnedAgentByUrl) return [];
      const agentValueUrl = isPinnedAgentByUrl?.split('=')[1];
      return [{
        meta: {
          alias: null,
          disabled: false,
          key: AGENT_ID_KEY,
          negate: false,
          params: { query: agentId || agentValueUrl },
          type: 'phrase',
          index: indexPatternTitle,
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT
        },
        query: {
          match: {
            [AGENT_ID_KEY]: {
              query: agentId || agentValueUrl,
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState' // this makes that the filter is pinned and can be remove the close icon by css
        },
      } as tFilter]
    }
  
    /**
     * Return the filter to exclude the data related to servers (managers) due to the setting hideManagerAlerts is enabled
     */
    static getExcludeManagerFilter(indexPatternTitle: string): tFilter[] {
      if(store.getState().appConfig?.data?.hideManagerAlerts){
        let excludeManagerFilter =  getFilterExcludeManager(indexPatternTitle) as tFilter;
        return [excludeManagerFilter];
      }
      return [];
    }
  
    /**
     * Return the allowed agents related to the user permissions to read data from agents in the
      API server
     */
    static getAllowAgentsFilter(indexPatternTitle: string): tFilter[] {
      const allowedAgents = store.getState().appStateReducers?.allowedAgents || [];
      if(allowedAgents.length > 0){
        const allowAgentsFilter = getFilterAllowedAgents(allowedAgents, indexPatternTitle) as tFilter;
        return [allowAgentsFilter];
      }
      return []
    }

  }