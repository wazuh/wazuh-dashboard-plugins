import {
    DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
    FLEET_IMPLICIT_CLUSTER_MODE_FILTER,
  } from '../../../../../../../common/constants';
  import { tFilter, PatternDataSourceFilterManager } from '../../../index';
  import { PatternDataSource } from '../../pattern-data-source';
  
  export class FleetGroupsDataSource extends PatternDataSource {
    constructor(id: string, title: string) {
      super(id, title);
    }

    getFixedFilters(): tFilter[] {
      return [...this.getClusterManagerFilters(), ...super.getFixedFilters()];
    }
  
    getClusterManagerFilters() {
      return PatternDataSourceFilterManager.getClusterManagerFilters(
        this.id,
        DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
        FLEET_IMPLICIT_CLUSTER_MODE_FILTER,
      );
    }
  }
  