import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_FIM_RULE_GROUP } from '../../../../../../../common/constants';
import { FIMDataSource } from './fim-data-source';

const FIM_GROUP_KEY = 'wazuh.integration.name';
const FIM_GROUP_VALUE = 'wazuh-fim';

export class FIMFindingsDataSource extends FIMDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getRuleGroupsFilter() {
    return super.getRuleGroupsFilter(
      FIM_GROUP_KEY,
      FIM_GROUP_VALUE,
      DATA_SOURCE_FILTER_CONTROLLED_FIM_RULE_GROUP,
    );
  }

  getFixedFilters(): tFilter[] {
    return [...this.getRuleGroupsFilter(), ...super.getFixedFilters()];
  }
}
