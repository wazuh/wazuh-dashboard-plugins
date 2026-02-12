import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_OFFICE_365_RULE_GROUP } from '../../../../../../../common/constants';
import { EventsDataSource } from '../events-data-source';

const OFFICE_365_GROUP_KEY = 'wazuh.integration.name';
const OFFICE_365_GROUP_VALUE = 'o365';

export class Office365DataSource extends EventsDataSource {
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
    return [
      ...super.getFixedFiltersClusterManager(),
      ...this.getRuleGroupsFilter(),
      ...super.getFixedFilters(),
    ];
  }
}
