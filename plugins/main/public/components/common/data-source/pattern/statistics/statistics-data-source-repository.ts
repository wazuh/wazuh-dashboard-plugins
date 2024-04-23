import { PatternDataSourceRepository } from '../pattern-data-source-repository';
import { tParsedIndexPattern } from '../../index';
import { StatisticsDataSource } from './statistics-data-source';

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
    /* Keep in mind that the identifier is compared with id and title since it is currently not defined that the id is the only one that validates. But this can generate a problem in which the title matches more than one index. */
    const STATISTICS_PATTERN_IDENTIFIER =
      StatisticsDataSource.getIdentifierDataSourcePattern();
    // must check in the object and the attributes
    for (const field of fieldsToCheck) {
      if (
        dataSource[field] &&
        dataSource[field].toLowerCase().includes(STATISTICS_PATTERN_IDENTIFIER)
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
