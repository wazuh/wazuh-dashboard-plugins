import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_IT_HYGIENE_RULE_GROUP } from '../../../../../../../common/constants';
import { EventsDataSource } from '../events-data-source';

export const IT_HYGIENE_GROUP_KEY = 'wazuh.integration.name';
export const IT_HYGIENE_GROUP_VALUE = 'wazuh-it-hygiene';

export class ITHygieneFindingsDataSource extends EventsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      IT_HYGIENE_GROUP_KEY,
      IT_HYGIENE_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_IT_HYGIENE_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [
      ...super.getFixedFiltersClusterManager(),
      ...super.getFixedFilters(),
      ...this.getRuleGroupsFilter(),
    ];
  }
}
