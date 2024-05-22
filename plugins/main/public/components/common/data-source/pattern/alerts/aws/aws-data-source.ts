import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_AWS_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const AWS_GROUP_KEY = 'rule.groups';
const AWS_GROUP_VALUE = 'amazon';

export class AWSDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      AWS_GROUP_KEY,
      AWS_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_AWS_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [
      ...super.getFixedFiltersClusterManager(),
      ...this.getRuleGroupsFilter(),
      ...super.getFixedFilters(),
    ];
  }
}
