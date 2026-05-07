import { tFilter, PatternDataSourceFilterManager } from '../../index';
import { PatternDataSource } from '../pattern-data-source';
import {
  WAZUH_METRICS_COMMS_PATTERN,
  DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
} from '../../../../../../common/constants';

export class StatisticsDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  static getIdentifierDataSourcePattern(): string {
    // Return Statistics Identifier Index Pattern
    return WAZUH_METRICS_COMMS_PATTERN;
  }

  getFetchFilters(): tFilter[] {
    return [...this.getAPIFilter()];
  }

  getFixedFilters(): tFilter[] {
    return [
      ...PatternDataSourceFilterManager.getClusterFilters(
        this.id,
        DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      ),
    ];
  }

  getAPIFilter(): tFilter[] {
    // wazuh-metrics-comms* does not include an apiName field, no API level filter is applied
    return [];
  }
}
