import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';

export class StatisticsDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [...super.getFixedFilters()];
  }
}
