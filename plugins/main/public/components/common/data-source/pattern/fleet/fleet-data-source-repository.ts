import { PatternDataSourceRepository } from '../pattern-data-source-repository';
import { tParsedIndexPattern } from '../../index';

export class FleetDataSourceRepository extends PatternDataSourceRepository {
  constructor() {
    super();
  }

  async get(id: string) {
    const dataSource = await super.get(id);
    if (this.validate(dataSource)) {
      return dataSource;
    } else {
      throw new Error('Fleet index pattern not found');
    }
  }

  async getAll() {
    const indexs = await super.getAll();
    return indexs.filter(this.validate);
  }

  validate(dataSource): boolean {
    const stringToSearch = 'fleet-agents'; //always in lower case
    return (
      dataSource.id?.toLowerCase().includes(stringToSearch) ||
      dataSource.attributes?.title?.toLowerCase().includes(stringToSearch)
    );
  }

  getDefault() {
    return Promise.resolve(null);
  }

  setDefault(dataSource: tParsedIndexPattern) {
    return;
  }
}
