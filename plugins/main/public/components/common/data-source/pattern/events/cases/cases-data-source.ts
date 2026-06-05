import { tFilter } from '../../../index';
import { DATA_SOURCE_FILTER_CONTROLLED_CASES_EXIST } from '../../../../../../../common/constants';
import { EventsDataSource } from '../events-data-source';
import { FILTER_OPERATOR, PatternDataSourceFilterManager } from '../../..';

const CASES_STATUS_FIELD = 'wazuh.case.status';

export class CasesDataSource extends EventsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getCaseStatusExistsFilter() {
    return [
      PatternDataSourceFilterManager.createFilter(
        FILTER_OPERATOR.EXISTS,
        CASES_STATUS_FIELD,
        '',
        this.id,
        DATA_SOURCE_FILTER_CONTROLLED_CASES_EXIST,
      ),
    ];
  }

  getFixedFilters(): tFilter[] {
    return [
      ...super.getFixedFiltersClusterManager(),
      ...this.getCaseStatusExistsFilter(),
      ...super.getFixedFilters(),
    ];
  }
}
