import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_DOCKER_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const DOCKER_GROUP_KEY = 'rule.groups';
const DOCKER_GROUP_VALUE = 'docker';

export class AlertsDockerDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      DOCKER_GROUP_KEY,
      DOCKER_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_DOCKER_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...this.getRuleGroupsFilter(), ...super.getFixedFilters()];
  }
}
