import { StatisticsDataSource } from './statistics-data-source';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const StatisticsDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    StatisticsDataSource.getIdentifierDataSourcePattern(),
  );
