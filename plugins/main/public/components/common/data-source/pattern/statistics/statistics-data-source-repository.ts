import { PatternDataSourceRepository } from '../pattern-data-source-repository';
import { tDataSource, tParsedIndexPattern } from '../../index';

export class StatisticsDataSourceRepository extends PatternDataSourceRepository {
  constructor() {
    super();
  }

  async get(id: string) {
    const dataSource = await super.get(id);
    if (this.validate(dataSource)) {
      return dataSource;
    } else {
      throw new Error('Statistics index pattern not found');
    }
  }

  async getAll() {
    const indexs = await super.getAll();
    return indexs.filter(this.validate);
  }

  validate(dataSource): boolean {
    // check if the dataSource has the id or the title have the statistics word
    const fieldsToCheck = ['id', 'attributes.title'];
    // must check in the object and the attributes
    for (const field of fieldsToCheck) {
      if (
        dataSource[field] &&
        dataSource[field].toLowerCase().includes('statistics')
      ) {
        return true;
      }
    }
    return false;
  }

  getDefault() {
    console.warn(
      'getDefault not implemented for statistics data source repository',
    );
    return Promise.resolve(null);
  }

  setDefault(_dataSource: tParsedIndexPattern) {
    console.warn(
      'setDefault not implemented for statistics data source repository',
    );
    return;
  }
}
