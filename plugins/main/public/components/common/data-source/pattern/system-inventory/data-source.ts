import {
  DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
  VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
} from '../../../../../../common/constants';
import {
  tFilter,
  PatternDataSourceFilterManager,
  FILTER_OPERATOR,
} from '../../index';
import { PatternDataSource } from '../pattern-data-source';

export class SystemInventoryStatesDataSource extends PatternDataSource {
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
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }
}

export class SystemInventoryTrafficStatesDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [
      ...this.getClusterManagerFilters(),
      this.getTrafficFilter(),
      ...super.getFixedFilters(),
    ];
  }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.id,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }

  getTrafficFilter() {
    return PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS_NOT,
      'destination.port',
      0,
      this.id,
      'inventory-data-traffic',
    );
  }
}

export class SystemInventoryServicesStatesDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [
      ...this.getClusterManagerFilters(),
      this.getServicesFilter(),
      ...super.getFixedFilters(),
    ];
  }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.id,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }

  getServicesFilter() {
    return PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      'destination.port',
      0,
      this.id,
      'inventory-data-services',
    );
  }
}
