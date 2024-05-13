import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_OFFICE_365_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const OFFICE_365_GROUP_KEY = 'rule.groups';
const OFFICE_365_GROUP_VALUE = 'office365';

export class Office365DataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      OFFICE_365_GROUP_KEY,
      OFFICE_365_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_OFFICE_365_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...this.getRuleGroupsFilter(), ...super.getFixedFilters()];
  }
}
