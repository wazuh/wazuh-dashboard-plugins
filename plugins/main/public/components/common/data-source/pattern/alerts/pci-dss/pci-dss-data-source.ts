import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_PCI_DSS_EXIST } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const KEY_EXIST = 'rule.pci_dss';

export class PCIDSSDataSource extends AlertsDataSource {
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
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_PCI_DSS_EXIST,
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
