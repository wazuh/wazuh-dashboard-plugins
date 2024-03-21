import { tDataSource } from "./data-source";
import { tFilter, tSearchParams } from "./search-params-builder";
import store from '../../../redux/store';
import { getFilterExcludeManager, getFilterAllowedAgents } from '../../../react-services/data-sources/vulnerabilities-states';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT } from "../../../../common/constants";

export type tDataSourceFilterManager = {
  fetch: () => Promise<any>;
  setFilters: (filters: tFilter[]) => void;
  getFixedFilters: () => tFilter[];
  getFilters: () => tFilter[];
  getFetchFilters: () => tFilter[];
  addMetaDataInFilter: (filter: tFilter) => tFilter;
  // global filters
  getPinnedAgentFilter: () => tFilter[];
  getExcludeManagerFilter: () => tFilter[];
  getAllowAgentsFilter: () => tFilter[];
}

export class DataSourceFilterManager implements tDataSourceFilterManager {

  constructor(private dataSource: tDataSource, private filters: tFilter[] = []) {
    if (!dataSource) {
      throw new Error('Data source is required');
    }
    this.dataSource = dataSource;
    this.filters = filters.length ? this.filterUserFilters(filters) : [];
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
    this.filters = this.filterUserFilters(filters) || [];
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
    if (!filters) return [];
    return this.removeRepeatedFilters(filters.filter(
      filter => !(filter?.$state?.['isImplicit'] || filter.meta?.controlledBy || filter.meta?.index !== this.dataSource.id)
    ));
  }

  /**
   * Return the fixed filters. The fixed filters are filters that cannot be removed by the user.
   * The filters for the specific data source are defined in the data source.
   * Also, exists fixed filters that are defined in the data source filter manager (globally).
   * @returns 
   */
  getFixedFilters(): tFilter[] {
    const fixedFilters = this.dataSource.getFixedFilters();
    const pinnedAgent = this.getPinnedAgentFilter();

    return [
      ...fixedFilters,
      ...pinnedAgent
    ].map(filter => this.addMetaDataInFilter(filter));
  }

  /**
   * Return the filters that was added by the user and the fixed filters.
   * This can be use to show the filters in the UI (For instance: SearchBar)
   * @returns 
   */
  getFilters() {
    return [
      ...this.getFixedFilters(),
      ...this.filters,
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

  /**
   * Remove filter repeated filters in query property
   * @param filter 
   * @returns 
   */
  
  removeRepeatedFilters(filters: tFilter) {
    if (!filters) return filters;
    const query = filters.query;
    if (!query) return filters;
    const keys = Object.keys(query);
    if (keys.length === 1) {
      const key = keys[0];
      if (query[key].query) {
        query[key].query = Array.isArray(query[key].query) ? Array.from(new Set(query[key].query)) : query[key].query;
      }
    }
    return filters;
  }

  addMetaDataInFilter(filter: tFilter) {
    //check is necessary add the controlled by here or add in the data source
    //filter.meta.controlledBy = 'data-source-filter-manager';
    //filter.meta.index = this.dataSource.id;
    return filter;
  }

  /**
   * Returns the filter when the an agent is pinned (saved in the session storage or redux store)
   */
  getPinnedAgentFilter(): tFilter[] {
    const agentId = store.getState().appStateReducers?.currentAgentData?.id;
    if (!agentId) return [];
    return [{
      meta: {
        removable: false, // used to hide the close icon in the filter
        alias: null,
        disabled: false,
        key: 'agent.id',
        negate: false,
        params: { query: agentId },
        type: 'phrase',
        index: this.dataSource.id,
        controlledBy: DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT
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
   * Return the filter to exclude the data related to servers (managers) due to the setting hideManagerAlerts is enabled
   */
  getExcludeManagerFilter(): tFilter[] {
    return store.getState().appConfig?.data?.hideManagerAlerts ?
      [getFilterExcludeManager(this.dataSource.title) as tFilter] : [];
  }

  /**
   * Return the allowed agents related to the user permissions to read data from agents in the
    API server
   */
  getAllowAgentsFilter(): tFilter[] {
    const allowedAgents = store.getState().appStateReducers?.allowedAgents || [];
    return allowedAgents.lenght > 0 ?
      [getFilterAllowedAgents(allowedAgents, this.dataSource.title) as tFilter] : []
  }

}