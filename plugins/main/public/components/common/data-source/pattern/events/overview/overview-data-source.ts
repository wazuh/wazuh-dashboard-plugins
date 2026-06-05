import { tFilter } from '../../../index';
import { EventsDataSource } from '../events-data-source';

export class OverviewDataSource extends EventsDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [...super.getFixedFiltersClusterManager()];
  }
}
