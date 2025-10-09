import { ErrorDataSourceNotFound } from '../../../../utils/errors';
import {
  PatternDataSourceRepository,
  tParsedIndexPattern,
} from './pattern-data-source-repository';
import { get } from 'lodash';

export const createPatternDataSourceRepositoryUseValue = (
  indexPattern: string,
) => {
  return class PatternDataSourceRepositoryUseSettingValue extends PatternDataSourceRepository {
    constructor() {
      super();
    }

    async get(id: string) {
      const dataSource = await super.get(id);
      if (this.validate(dataSource)) {
        return dataSource;
      } else {
        throw new Error('Index pattern not found');
      }
    }

    async getAll() {
      const indexs = await super.getAll();
      return indexs.filter(this.validate);
    }

    validate(dataSource): boolean {
      const fieldsToCheck = ['id', 'attributes.title']; // search in these attributes
      return fieldsToCheck.some(key => get(dataSource, key) === indexPattern);
    }

    getDefault(dataSources: tParsedIndexPattern[]) {
      const [dataSource] = dataSources;

      if (!dataSource) {
        throw new ErrorDataSourceNotFound(
          `Index pattern [id: ${indexPattern} or title:${indexPattern}] not found. Check if it exists or create one in Dashboard Management. If no matching indices are available, data collection may be disabled or failing.`,
          { indexPatternId: indexPattern, indexPatternTitle: indexPattern },
        );
      }
      return dataSource;
    }

    setDefault(dataSource: tParsedIndexPattern) {
      return;
    }
  };
};
