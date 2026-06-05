import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_FEDRAMP_EXIST } from '../../../../../../../common/constants';
import { EventsDataSource } from '../events-data-source';

const KEY_EXIST = 'wazuh.rule.compliance.fedramp';

export class FedRAMPDataSource extends EventsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  private getFilterExists() {
    return [
      {
        meta: {
          index: this.id,
          negate: false,
          disabled: false,
          alias: null,
          type: 'exists',
          key: KEY_EXIST,
          value: 'exists',
          params: {
            query: null,
            type: 'phrase',
          },
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_FEDRAMP_EXIST,
        },
        exists: {
          field: KEY_EXIST,
        },
        $state: {
          store: 'appState',
        },
      } as tFilter,
    ];
  }

  getFixedFilters(): tFilter[] {
    return [
      ...super.getFixedFiltersClusterManager(),
      ...this.getFilterExists(),
      ...super.getFixedFilters(),
    ];
  }
}
