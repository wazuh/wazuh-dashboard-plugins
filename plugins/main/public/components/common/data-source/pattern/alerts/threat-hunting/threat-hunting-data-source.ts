import { tFilter } from '../../../index';
import { AlertsDataSource } from '../alerts-data-source';

export class ThreatHuntingDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [
      ...super.getFixedFiltersClusterManager(),
      ...super.getFixedFilters(),
    ];
  }
}
