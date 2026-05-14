import { tFilter, PatternDataSourceFilterManager } from '../../index';
import { PatternDataSource } from '../pattern-data-source';
import {
  WAZUH_METRICS_NORMALIZATION_PATTERN,
  DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
} from '../../../../../../common/constants';

export class MetricsNormalizationDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  static getIdentifierDataSourcePattern(): string {
    return WAZUH_METRICS_NORMALIZATION_PATTERN;
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
    return [];
  }
}
