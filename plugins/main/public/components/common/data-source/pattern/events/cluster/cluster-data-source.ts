import { tFilter } from '../../../types';
import { EventsDataSource } from '../events-data-source';

export class ClusterDataSource extends EventsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [...super.getClusterFilters()];
  }
}
