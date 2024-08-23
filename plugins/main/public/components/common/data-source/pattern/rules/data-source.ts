import {
  DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
  VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
} from '../../../../../../common/constants';
import { tFilter, PatternDataSourceFilterManager } from '../../index';
import { PatternDataSource } from '../pattern-data-source';

class CustomPatternDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }
  getFetchFilters(): Filter[] {
    return [];
  }
}

export class RulesDataSource extends CustomPatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [...this.getClusterManagerFilters()];
  }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.id,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }
}
