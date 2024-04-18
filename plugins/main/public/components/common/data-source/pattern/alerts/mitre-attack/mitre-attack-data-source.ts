import { tFilter } from '../../../index';
import {
  DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE,
  DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE_ID,
} from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const GROUP_KEY = 'rule.mitre.id';

export class MitreAttackDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getMitreRuleFilter() {
    return [
      {
        meta: {
          index: this.id,
          negate: false,
          disabled: false,
          alias: null,
          type: 'exists',
          key: GROUP_KEY,
          value: 'exists',
          params: {
            query: null,
            type: 'phrase',
          },
          controlledBy: DATA_SOURCE_FILTER_CONTROLLED_MITRE_ATTACK_RULE,
        },
        exists: {
          field: GROUP_KEY,
        },
        $state: {
          store: 'appState',
        },
      } as tFilter,
    ];
  }

  getFixedFilters(): tFilter[] {
    return [...super.getFixedFilters(), ...this.getMitreRuleFilter()];
  }
}
