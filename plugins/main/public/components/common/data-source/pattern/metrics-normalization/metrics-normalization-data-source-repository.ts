import { MetricsNormalizationDataSource } from './metrics-normalization-data-source';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const MetricsNormalizationDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    MetricsNormalizationDataSource.getIdentifierDataSourcePattern(),
  );
