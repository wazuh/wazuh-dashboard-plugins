import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_FIM_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const FIM_GROUP_KEY = 'rule.groups';
const FIM_GROUP_VALUE = 'syscheck';

export class AlertsFIMDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      FIM_GROUP_KEY,
      FIM_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_FIM_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...this.getRuleGroupsFilter(), ...super.getFixedFilters()];
  }
}
