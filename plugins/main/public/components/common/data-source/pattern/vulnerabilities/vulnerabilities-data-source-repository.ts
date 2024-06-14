import { PatternDataSourceRepository } from '../pattern-data-source-repository';
import { tDataSource, tParsedIndexPattern } from '../../index';

export class VulnerabilitiesDataSourceRepository extends PatternDataSourceRepository {
  constructor() {
    super();
  }

  async get(id: string) {
    const dataSource = await super.get(id);
    if (this.validate(dataSource)) {
      return dataSource;
    } else {
      throw new Error('Vulnerabilities index pattern not found');
    }
  }

  async getAll() {
    const indexs = await super.getAll();
    return indexs.filter(this.validate);
  }

  validate(dataSource): boolean {
    // check if the dataSource has the id or the title have the vulnerabilities word
    const fieldsToCheck = ['id', 'attributes.title'];
    // must check in the object and the attributes
    for (const field of fieldsToCheck) {
      if (
        dataSource[field] &&
        dataSource[field].toLowerCase().includes('vulnerabilities')
      ) {
        return true;
      }
    }
    return false;
  }

  getDefault() {
    return Promise.resolve(null);
  }

  setDefault(dataSource: tParsedIndexPattern) {
    return;
  }
}
