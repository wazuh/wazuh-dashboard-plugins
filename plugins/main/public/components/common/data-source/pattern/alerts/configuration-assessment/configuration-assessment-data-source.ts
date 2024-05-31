import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_CONFIGURATION_ASSASSMENT_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const CONFIGURATION_ASSESSMENT_GROUP_KEY = 'rule.groups';
const CONFIGURATION_ASSESSMENT_VALUE = 'sca';

export class ConfigurationAssessmentDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      CONFIGURATION_ASSESSMENT_GROUP_KEY,
      CONFIGURATION_ASSESSMENT_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_CONFIGURATION_ASSASSMENT_RULE_GROUP,
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
