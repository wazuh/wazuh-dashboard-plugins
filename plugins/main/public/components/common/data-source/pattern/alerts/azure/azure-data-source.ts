import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_AZURE_RULE_GROUP } from '../../../../../../../common/constants';
import { AlertsDataSource } from '../alerts-data-source';

const AZURE_GROUP_KEY = 'rule.groups';
const AZURE_GROUP_VALUE = 'azure';

export class AzureDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      AZURE_GROUP_KEY,
      AZURE_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_AZURE_RULE_GROUP,
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
