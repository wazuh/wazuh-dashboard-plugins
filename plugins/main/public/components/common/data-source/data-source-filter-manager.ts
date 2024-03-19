import { tDataSource } from "./data-source";
import { tFilter } from "./search-params-builder";
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import store from '../../../redux/store';
import { getFilterExcludeManager, getFilterAllowedAgents } from '../../../react-services/data-sources/vulnerabilities-states';

const baseFixedFilter = {
  meta: {
    index: null,
    negate: false,
    disabled: false,
    alias: null,
    type: 'phrase',
    key: null,
    value: null,
    params: {
      query: null,
      type: 'phrase',
    },
  },
  query: {
    match: null,
  },
  $state: {
    store: 'appState',
    isImplicit: true,
  },
};

type FiltersStateRepository = {
  getAllowAgents: () => string[];
  getExcludeManager: () => boolean;
  getPinnedAgent: () => object;
}


/**
 * Use case
 * 
 * - The data source filter manager receives the filters from the filter manager
 * - When the filters received only store the filters that was added by the user. 
 *  Not have the property isImplicit ($state.isImplicit) defined or not have the meta.controlledBy property defined
 *  Also, when the meta.index is not the same as the dataSource.id
 * 
 * - Then add the fixedFilters and concatenate with the user filters
 */


/**
 * Get the filters from the filter manager
 * 
 * - filter the filters that was added by the user
 * - check if agent is pinned (check in session storage or redux store if is possible wz-shared-selected-agent)
 * 
 * Add filters only necessary to fetch the data from the data source
 * - 
 */

export class DataSourceFilterManager {

  constructor(private dataSource: tDataSource, private filters: tFilter[] = []) {
    if(!dataSource) {
      throw new Error('Data source is required');
    }
    this.dataSource = dataSource;
    this.filters = this.filterUserFilters(filters);
  }

  /**
   * Get the filters necessary to fetch the data from the data source
   * @returns 
   */
  fetch() {
    return this.dataSource.fetch({
      filters: this.getFetchFilters()
    });
  }

  setFilters(filters: tFilter[]) {
    this.filters = this.filterUserFilters(filters);
  }

  /**
   * Filter the filters that was added by the user
   * The filters must not have:
   *  - the property isImplicit ($state.isImplicit) defined
   *  - the meta.controlledBy property defined
   *  - the meta.index is not the same as the dataSource.id
   * 
   */
  private filterUserFilters(filters: tFilter[]) {
    return filters.filter(
      filter => !(filter.$state['isImplicit'] || !filter.meta?.controlledBy || filter.meta?.index !== this.dataSource.id)
    );
  }

  getFixedFilters(): tFilter[] {
    const fixedFilters = this.dataSource.getFixedFilters();
    const pinnedAgent = this.getPinnedAgentFilter();

    return [
      ...fixedFilters,
      ...pinnedAgent
    ].map(filter => this.addMetaDataInFilter(filter));
  }

  getFilters() {
    return [
      ...this.filters,
      ...this.getFixedFilters()
    ]
  }

  /**
   * Concatenate the filters to fetch the data from the data source
   * @returns 
   */
  getFetchFilters(): tFilter[] {
      const filters = this.getFilters();
      const excludeManager = this.getExcludeManagerFilter();
      const allowedAgents = this.getAllowAgentsFilter();

      return [
        ...filters,
        ...allowedAgents,
        ...excludeManager
      ].map(filter => this.addMetaDataInFilter(filter));
    
  }

  addMetaDataInFilter(filter: tFilter) {
    filter.meta.controlledBy = 'data-source-filter-manager';
    //filter.meta.index = this.dataSource.id;
    return filter;
  }

  getPinnedAgentFilter(): tFilter[] {
      const agentId = store.getState().appStateReducers?.currentAgentData?.id;
      if(!agentId) return [];
      return [{
        meta: {
          alias: null,
          disabled: false,
          key: 'agent.id',
          negate: false,
          params: { query: agentId },
          type: 'phrase',
          index: this.dataSource.id,
          controlledBy: 'wazuh'
        },
        query: {
          match: {
            'agent.id': {
              query: agentId,
              type: 'phrase',
            },
          },
        },
        $state: { 
          store: 'appState' // check appStore is not assignable, why is stored here?
        },
      } as tFilter]
  }

  /**
   * Add the filter to exclude the data related to servers (managers) due to the setting hideManagerAlerts is enabled
   */
  getExcludeManagerFilter(): tFilter[]  {
    return store.getState().appConfig?.data?.hideManagerAlerts ? 
      [getFilterExcludeManager(this.dataSource.title)  as tFilter] : [];
  }

  /**
   * Add the allowed agents related to the user permissions to read data from agents in the
    API server
   */
  getAllowAgentsFilter(): tFilter[] {
    const allowedAgents = store.getState().appStateReducers?.allowedAgents;
    return allowedAgents.lenght > 0 ?
      [getFilterAllowedAgents(allowedAgents,this.dataSource.title) as tFilter] : []
  }

}