import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_GITHUB_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const GITHUB_GROUP_KEY = 'rule.groups';
const GITHUB_GROUP_VALUE = 'github';

export class GitHubDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      GITHUB_GROUP_KEY,
      GITHUB_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_GITHUB_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...super.getFixedFilters(), ...this.getRuleGroupsFilter()];
  }
}
