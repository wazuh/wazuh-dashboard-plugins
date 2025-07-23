import {
  DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
  VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
} from '../../../../../../common/constants';
import {
  tFilter,
  PatternDataSourceFilterManager,
} from '../../index';
import { PatternDataSource } from '../pattern-data-source';

export class SCAStatesDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  // getStateSCA(): tFilter[] {
  //   return [...this.getClusterManagerFilters(), ...super.getFixedFilters()];
  // }

  // getPoliciesSCA(): tFilter[] {
  //   return [...this.getClusterManagerFilters(), ...super.getFixedFilters()];
  // }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.id,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }
}
