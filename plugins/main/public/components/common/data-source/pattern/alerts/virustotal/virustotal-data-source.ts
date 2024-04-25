import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_VIRUSTOTAL_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const VIRUSTOTAL_GROUP_KEY = 'rule.groups';
const VIRUSTOTAL_GROUP_VALUE = 'virustotal';

export class VirusTotalDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      VIRUSTOTAL_GROUP_KEY,
      VIRUSTOTAL_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_VIRUSTOTAL_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...this.getRuleGroupsFilter(), ...super.getFixedFilters()];
  }
}
