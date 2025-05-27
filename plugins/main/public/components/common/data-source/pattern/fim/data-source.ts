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

export class FIMStatesDataSource extends PatternDataSource {
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

export class FIMFilesStatesDataSource extends PatternDataSource {
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

export class FIMRegistryKeysStatesDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [
      ...this.getClusterManagerFilters(),
      ...super.getFixedFilters(),
      this.getRegistryTypeFilter(),
    ];
  }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.id,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }

  getRegistryTypeFilter() {
    return PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      'event.category',
      'registry_key',
      this.id,
    );
  }
}

export class FIMRegistryValuesStatesDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [
      ...this.getClusterManagerFilters(),
      ...super.getFixedFilters(),
      this.getRegistryTypeFilter(),
    ];
  }

  getClusterManagerFilters() {
    return PatternDataSourceFilterManager.getClusterManagerFilters(
      this.id,
      DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
      VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER,
    );
  }

  getRegistryTypeFilter() {
    return PatternDataSourceFilterManager.createFilter(
      FILTER_OPERATOR.IS,
      'event.category',
      'registry_value',
      this.id,
    );
  }
}
