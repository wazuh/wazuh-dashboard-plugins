import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_GOOGLE_CLOUD_RULE_GROUP } from '../../../../../../../common/constants';
import { EventsDataSource } from '../events-data-source';

const GOOGLE_CLOUD_GROUP_KEY = 'wazuh.integration.decoders';
const GOOGLE_CLOUD_GROUP_VALUE = 'gcp-audit';

export class GoogleCloudDataSource extends EventsDataSource {
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
    return [
      ...super.getFixedFiltersClusterManager(),
      ...this.getRuleGroupsFilter(),
      ...super.getFixedFilters(),
    ];
  }
}
