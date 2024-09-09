import rison from 'rison-node';
import store from '../../../../redux/store';
import { AppState } from '../../../../react-services/app-state';
import { getDataPlugin } from '../../../../kibana-services';
import { FilterHandler } from '../../../../utils/filter-handler';
import {
  tDataSourceFilterManager,
  tFilter,
  tSearchParams,
  tDataSource,
  tFilterManager,
} from '../index';
import {
  DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
  AUTHORIZED_AGENTS,
} from '../../../../../common/constants';
import { PinnedAgentManager } from '../../../wz-agent-selector/wz-agent-selector-service';
const MANAGER_AGENT_ID = '000';
const AGENT_ID_KEY = 'agent.id';

/**
 * Get the filter that excludes the data related to Wazuh servers
 * @param indexPatternId Index pattern id
 * @returns
 */
export function getFilterExcludeManager(indexPatternId: string) {
  return {
    meta: {
      alias: null,
      disabled: false,
      key: AGENT_ID_KEY,
      negate: true,
      params: { query: MANAGER_AGENT_ID },
      type: 'phrase',
      index: indexPatternId,
      controlledBy: DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
    },
    query: { match_phrase: { [AGENT_ID_KEY]: MANAGER_AGENT_ID } },
    $state: { store: 'appState' },
  };
}

export enum FILTER_OPERATOR {
  IS = 'is',
  IS_NOT = 'is not',
  EXISTS = 'exists',
  DOES_NOT_EXISTS = 'does not exists',
  IS_ONE_OF = 'is one of',
  IS_NOT_ONE_OF = 'is not one of',
  IS_BETWEEN = 'is between',
  IS_NOT_BETWEEN = 'is not between',
}

export class PatternDataSourceFilterManager
  implements tDataSourceFilterManager
{
  private filterManager: tFilterManager;
  private defaultFetchFilters: tFilter[] = [];
  constructor(
    private dataSource: tDataSource,
    filters: tFilter[] = [],
    filterStorage?: tFilterManager,
    fetchFilters?: tFilter[],
  ) {
    if (!dataSource) {
      throw new Error('Data source is required');
    }
    this.defaultFetchFilters = fetchFilters || [];
    // when the filterManager is not received get the global filterManager
    this.filterManager = filterStorage || getDataPlugin().query.filterManager;
    if (!this.filterManager) {
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
  fetch(params: tSearchParams = {}): Promise<any> {
    return this.dataSource.fetch({
      ...params,
      filters: params?.filters || this.getFetchFilters(),
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
    return [...(this.filterUserFilters(defaultFilters) || [])];
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
    return this.removeRepeatedFilters(
      filters.filter(
        filter =>
          !(
            filter?.$state?.['isImplicit'] ||
            filter.meta?.controlledBy ||
            filter.meta?.index !== this.dataSource.id
          ),
      ),
    ) as tFilter[];
  }

  /**
   * Return the fixed filters. The fixed filters are filters that cannot be removed by the user.
   * The filters for the specific data source are defined in the data source.
   * Also, exists fixed filters that are defined in the data source filter manager (globally).
   * @returns
   */
  getFixedFilters(): tFilter[] {
    const fixedFilters = this.dataSource.getFixedFilters();
    return [...fixedFilters];
  }

  /**
   * Return the filters that was added by the user and the fixed filters.
   * This can be use to show the filters in the UI (For instance: SearchBar)
   * @returns
   */
  getFilters() {
    return [
      // Filters that do not belong to the dataSource are removed
      ...this.filterManager
        .getFilters()
        .filter(filter => filter.meta?.index === this.dataSource.id),
    ];
  }

  /**
   * Return the filters without the filters that have the property meta.controlledBy with the prefix hidden-
   */
  private removeHiddenFilters(filters: tFilter[]) {
    if (!filters) return filters;
    return filters.filter(
      filter => !filter.meta?.controlledBy?.startsWith('hidden-'),
    );
  }

  addFilters(filter: tFilter) {
    this.filterManager.addFilters(filter);
  }

  removeAll() {
    this.filterManager.setFilters([]);
  }

  /**
   * Concatenate the filters to fetch the data from the data source
   * @returns
   */
  getFetchFilters(): tFilter[] {
    return [
      ...this.getFixedFilters(),
      ...this.getFilters(),
      ...this.defaultFetchFilters,
      ...this.dataSource.getFetchFilters(),
    ];
  }

  public removeFilterByControlledBy(value: string) {
    let filters = this.filterManager.getFilters();
    const controlledBy = filters.filter(
      filter => filter.meta?.controlledBy === value,
    );
    controlledBy.forEach(filter => {
      this.filterManager.removeFilter(filter);
    });
  }

  /**
   * Search the the field and value received and remove the filter when exists
   * @param field
   * @param value
   */
  removeFilter(field: string, value: string | string[]): void {
    let filters = this.filterManager.getFilters();
    const filterIndex = filters.findIndex(f =>
      f.meta?.key === field && f.meta?.value === Array.isArray(value)
        ? value?.join(', ')
        : value,
    );

    if (filterIndex < 0) return;

    this.filterManager.removeFilter(filters[filterIndex]);
  }

  /**
   * Prevent duplicated filters, cannot exists with the same controlledBy value.
   * This ignore the filters that have the controlledBy value null
   * @param filters
   * @returns
   */
  private removeWithSameControlledBy(filters: tFilter[]): tFilter[] {
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
  static getClusterManagerFilters(
    indexPatternId: string,
    controlledByValue: string,
    key?: string,
  ): tFilter[] {
    const filterHandler = new FilterHandler();
    const isCluster = AppState.getClusterInfo().status == 'enabled';
    const managerFilter = filterHandler.managerQuery(
      isCluster
        ? AppState.getClusterInfo().cluster
        : AppState.getClusterInfo().manager,
      isCluster,
      key,
    );
    managerFilter.meta = {
      ...managerFilter.meta,
      controlledBy: controlledByValue,
      index: indexPatternId,
    };
    //@ts-ignore
    managerFilter.$state = {
      store: 'appState',
    };
    //@ts-ignore
    return [managerFilter] as tFilter[];
  }

  /**
   * Returns the filter when the an agent is pinned (saved in the session storage or redux store)
   */
  static getPinnedAgentFilter(indexPatternId: string): tFilter[] {
    const pinnedAgentManager = new PinnedAgentManager();
    const isPinnedAgent = pinnedAgentManager.isPinnedAgent();
    if (!isPinnedAgent) {
      return [];
    }
    const currentPinnedAgent = pinnedAgentManager.getPinnedAgent();
    return [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.IS,
        PinnedAgentManager.AGENT_ID_KEY,
        currentPinnedAgent.id,
        indexPatternId,
        PinnedAgentManager.FILTER_CONTROLLED_PINNED_AGENT_KEY,
      ),
    ];
  }

  /**
   * Return the filter to exclude the data related to servers (managers) due to the setting hideManagerAlerts is enabled
   */
  static getExcludeManagerFilter(indexPatternId: string): tFilter[] {
    if (store.getState().appConfig?.data?.hideManagerAlerts) {
      let excludeManagerFilter = getFilterExcludeManager(
        indexPatternId,
      ) as tFilter;
      return [excludeManagerFilter];
    }
    return [];
  }

  /******************************************************************/
  /********************** FILTERS FACTORY ***************************/
  /******************************************************************/

  static createFilter(
    type: FILTER_OPERATOR,
    key: string,
    value: string | string[],
    indexPatternId: string,
    controlledBy?: string,
  ) {
    if (
      type === FILTER_OPERATOR.IS_ONE_OF ||
      type === FILTER_OPERATOR.IS_NOT_ONE_OF
    ) {
      if (!Array.isArray(value)) {
        throw new Error('The value must be an array');
      }
    }

    if (type === FILTER_OPERATOR.IS_BETWEEN) {
      if (
        !Array.isArray(value) &&
        value.length <= 2 &&
        value.length > 0 &&
        value.some(v => isNaN(Number(v)))
      ) {
        throw new Error('The value must be an array with one or two numbers');
      }
    }

    switch (type) {
      case FILTER_OPERATOR.IS:
      case FILTER_OPERATOR.IS_NOT:
        return PatternDataSourceFilterManager.generateFilter(
          key,
          value,
          indexPatternId,
          {
            query: {
              match_phrase: {
                [key]: {
                  query: value,
                },
              },
            },
          },
          controlledBy,
          type === FILTER_OPERATOR.IS_NOT,
        );
      case FILTER_OPERATOR.EXISTS:
      case FILTER_OPERATOR.DOES_NOT_EXISTS:
        return {
          meta: {
            alias: null,
            disabled: false,
            key: key,
            value: 'exists',
            negate: type === FILTER_OPERATOR.DOES_NOT_EXISTS,
            type: 'exists',
            index: indexPatternId,
            controlledBy,
          },
          exists: { field: key },
          $state: { store: 'appState' },
        };
      case FILTER_OPERATOR.IS_ONE_OF:
      case FILTER_OPERATOR.IS_NOT_ONE_OF:
        return PatternDataSourceFilterManager.generateFilter(
          key,
          value,
          indexPatternId,
          {
            query: {
              bool: {
                minimum_should_match: 1,
                should: value.map((v: string) => ({
                  match_phrase: {
                    [key]: {
                      query: v,
                    },
                  },
                })),
              },
            },
          },
          controlledBy,
          type === FILTER_OPERATOR.IS_NOT_ONE_OF,
        );
      case FILTER_OPERATOR.IS_BETWEEN:
      case FILTER_OPERATOR.IS_NOT_BETWEEN:
        return {
          meta: {
            alias: null,
            disabled: false,
            key: key,
            params: {
              gte: value[0],
              lte: value[1] || NaN,
            },
            negate: type === FILTER_OPERATOR.IS_NOT_BETWEEN,
            type: 'range',
            index: indexPatternId,
            controlledBy,
          },
          range: {
            [key]: {
              gte: value[0],
              lte: value[1] || NaN,
            },
          },
          $state: { store: 'appState' },
        };
      default:
        throw new Error('Invalid filter type');
    }
  }

  /**
   * Returns a filter object depending on the type of filter received
   *
   * @returns
   */
  createFilter(
    type: FILTER_OPERATOR,
    key: string,
    value: string | [],
    controlledBy?: string,
  ): tFilter {
    return PatternDataSourceFilterManager.createFilter(
      type,
      key,
      value,
      this.dataSource.id,
      controlledBy,
    );
  }

  /**
   * Return a simple filter object with the field, value and index pattern received
   *
   * @param field
   * @param value
   * @param indexPatternId
   */
  static generateFilter(
    field: string,
    value: string | string[],
    indexPatternId: string,
    query: tFilter['query'] | tFilter['exists'],
    controlledBy?: string,
    negate: boolean = false,
  ) {
    return {
      meta: {
        alias: null,
        disabled: false,
        key: field,
        value: Array.isArray(value) ? value.join(', ') : value,
        params: value,
        negate,
        type: Array.isArray(value) ? 'phrases' : 'phrase',
        index: indexPatternId,
        controlledBy,
      },
      ...query,
      $state: { store: 'appState' },
    };
  }

  /**
   * Transform the filter format to the format used in the URL
   * Receives a filter object and returns a filter object with the format used in the URL using rison-node
   */

  static filtersToURLFormat(filters: tFilter[]) {
    const filterCopy = filters || [];
    return rison.encode({
      filters: filterCopy,
    });
  }
}
