import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_VULNERABILITIES_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const VULNERABILITIES_GROUP_KEY = 'rule.groups';
const VULNERABILITIES_GROUP_VALUE = 'vulnerability-detector';

export class AlertsVulnerabilitiesDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      VULNERABILITIES_GROUP_KEY,
      VULNERABILITIES_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_VULNERABILITIES_RULE_GROUP,
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
