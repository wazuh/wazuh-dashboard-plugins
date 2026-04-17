import { getDataPlugin } from '../../../../kibana-services';
import { ErrorDataSourceNotFound } from '../../../../utils/errors';
import {
  PatternDataSourceRepository,
  tParsedIndexPattern,
} from './pattern-data-source-repository';

export const createPatternDataSourceRepositoryUseValue = (
  indexPattern: string,
) => {
  return class PatternDataSourceRepositoryUseSettingValue extends PatternDataSourceRepository {
    constructor() {
      super();
    }

    // TODO: this seems that is not used. Research to ensure if can be removed
    async get(id: string) {
      let compatibleIndexPattern;
      try {
        compatibleIndexPattern = await getDataPlugin().indexPatterns.get(id);
        return [compatibleIndexPattern];
      } catch (e) {}
      if (compatibleIndexPattern) {
        return compatibleIndexPattern;
      } else {
        throw new Error('Index pattern not found');
      }
    }

    /**
     * Get all the compatible index patterns. This searches by provided ID by the indexPattern parameter
     * @returns
     */
    async getAll() {
      /* WORKAROUND: Get the index pattern with the provided ID (indexPattern variable) using the
      indePatterns.get service. This could use the cached value avoiding the request. This returns the index pattern interface instead of the defined in the typing related to saved object. In the flow of the data usage, this seems to require the .id and .title fields that are provided in the indexPattern interfacte too. So for this case, both interfaces seems to be compatibles. The index pattern data (despite this is obtained using the indexPattern.get service) is obtained in plugins/main/public/components/common/data-source/pattern/pattern-data-source-factory.ts (await dataSource.init()).

      The data source could be refactored to be based in the index pattern interface instead of saved object + index pattern interfaces.
      */
      let compatibleIndexPattern;
      try {
        compatibleIndexPattern = await getDataPlugin().indexPatterns.get(
          indexPattern,
        );
        return [compatibleIndexPattern];
      } catch (e) {}
      return [];
    }

    getDefault(dataSources: tParsedIndexPattern[]) {
      // This gets the index pattern obtained by getAll method
      const [dataSource] = dataSources;

      if (!dataSource) {
        throw new ErrorDataSourceNotFound(
          `Index pattern [id: ${indexPattern}] not found. Check if it exists or create one in Dashboard Management. If no matching indices are available, data collection may be disabled or failing.`,
          { indexPatternId: indexPattern },
        );
      }
      return dataSource;
    }

    setDefault(dataSource: tParsedIndexPattern) {
      return;
    }
  };
};
