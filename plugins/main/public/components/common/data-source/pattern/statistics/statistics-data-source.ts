import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';
import { WAZUH_METRICS_COMMS_PATTERN } from '../../../../../../common/constants';

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
    // getFixedFilters is overridden so that it does not return the pinned agent's fixed filter.
    return [];
  }

  getAPIFilter(): tFilter[] {
    // wazuh-metrics-comms* does not include an apiName field, no API level filter is applied
    return [];
  }
}
