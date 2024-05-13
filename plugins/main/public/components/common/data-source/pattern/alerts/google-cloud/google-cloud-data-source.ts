import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_GOOGLE_CLOUD_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const GOOGLE_CLOUD_GROUP_KEY = 'rule.groups';
const GOOGLE_CLOUD_GROUP_VALUE = 'gcp';

export class GoogleCloudDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      GOOGLE_CLOUD_GROUP_KEY,
      GOOGLE_CLOUD_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_GOOGLE_CLOUD_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...this.getRuleGroupsFilter(), ...super.getFixedFilters()];
  }
}
