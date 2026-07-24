import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';

export class ThreatIntelEnrichmentsStatesDataSource extends PatternDataSource {
  constructor(id: string, title: string) {
    super(id, title);
  }

  getFixedFilters(): tFilter[] {
    return [...super.getFixedFilters()];
  }
}
