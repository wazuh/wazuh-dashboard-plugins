import { tFilter } from '../../../types';
import { AlertsDataSource } from '../alerts-data-source';

export class ClusterDataSource extends AlertsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [...super.getClusterManagerFilters()];
  }
}
