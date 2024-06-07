import {
  AUTHORIZED_AGENTS,
  DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
} from '../../../common/constants';
import store from '../../redux/store';
import { IDataSourcesFilterManager } from './types';

/**
 * Get the filter that excludes the data related to Wazuh servers
 * @param indexPatternId Index pattern title
 * @returns
 */
export function getFilterExcludeManager(indexPatternId: string) {
  return {
    meta: {
      alias: null,
      disabled: false,
      key: 'agent.id',
      negate: true,
      params: { query: '000' },
      type: 'phrase',
      index: indexPatternId,
      controlledBy: DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER,
    },
    query: { match_phrase: { 'agent.id': '000' } },
    $state: { store: 'appState' },
  };
}

/**
 * Get the filter that restrict the search to the allowed agents
 * @param agentsIds
 * @param indexPatternId
 * @returns
 */
export function getFilterAllowedAgents(
  agentsIds: string[],
  indexPatternId: string,
) {
  const field = 'agent.id';
  return {
    meta: {
      index: indexPatternId,
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

export const DataSourceFilterManagerVulnerabilitiesStates: IDataSourcesFilterManager =
  {
    getFilters(searchBarFilters: any[], indexPatternId: string) {
      return [
        ...searchBarFilters,
        /* Add the filter to exclude the data related to servers (managers) due to
      the setting hideManagerAlerts is enabled */
        ...(store.getState().appConfig?.data?.hideManagerAlerts &&
        indexPatternId
          ? [getFilterExcludeManager(indexPatternId)]
          : []),
        /* Add the allowed agents related to the user permissions to read data from agents in the
      API server */
        ...(store.getState().appStateReducers?.allowedAgents?.length > 0 &&
        indexPatternId
          ? [
              getFilterAllowedAgents(
                store.getState().appStateReducers?.allowedAgents,
                indexPatternId,
              ),
            ]
          : []),
      ];
    },
  };
