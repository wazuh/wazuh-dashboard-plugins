import { PatternDataSourceRepository } from './pattern-data-source-repository';
import store from '../../../../redux/store';
import { get } from 'lodash';

export const createPatternDataSourceRepositoryUseSettingValue = (
  settingKey: string,
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
      /* WORKAROUND: Get the index pattern configurared in the plugin setting. This imports from
    the Redux store, but this should use some service as indejected dependency instead
    Caveats:
      - configuration should be loaded and set the Redux store
    */
      return fieldsToCheck.some(
        key =>
          store.getState()?.appConfig?.data?.[settingKey] &&
          get(dataSource, key) ===
            store.getState()?.appConfig?.data?.[settingKey],
      );
    }

    getDefault() {
      return Promise.resolve(null);
    }

    setDefault(dataSource: tParsedIndexPattern) {
      return;
    }
  };
};
