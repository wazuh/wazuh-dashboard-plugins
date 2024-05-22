import { PatternDataSource } from '../pattern-data-source';
import { tFilter, PatternDataSourceFilterManager } from '../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../../../../../../common/constants';

export class AlertsDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFiltersClusterManager(): tFilter[] {
    return [...this.getClusterManagerFilters()];
  }

  getRuleGroupsFilter(key: string, value: string, controlledByValue: string) {
    if (!key || !value) {
      console.warn('key or value is missing to create the getRuleGroupsFilter');
      return [];
    }
    return [
      {
        meta: {
          index: this.id,
          negate: false,
          disabled: false,
          alias: null,
          type: 'phrase',
          key: key,
          value: value,
          params: {
            query: value,
            type: 'phrase',
          },
          controlledBy: controlledByValue,
        },
        query: {
          match: {
            [key]: {
              query: value,
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      } as tFilter,
    ];
  }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.title,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
    );
  }
}
