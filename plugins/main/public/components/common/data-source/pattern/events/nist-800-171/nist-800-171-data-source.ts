import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_NIST_800_171_EXIST } from '../../../../../../../common/constants';
import { EventsDataSource } from '../events-data-source';

const KEY_EXIST = 'wazuh.rule.compliance.nist_800_171';

export class NIST800171DataSource extends EventsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  private getFilterExist() {
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
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_NIST_800_171_EXIST,
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
      ...this.getFilterExist(),
      ...super.getFixedFilters(),
    ];
  }
}
