import {
  WAZUH_FIM_FILES_PATTERN,
  WAZUH_FIM_REGISTRIES_PATTERN,
} from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const FIMFilesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FIM_FILES_PATTERN);

export const FIMRegistriesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FIM_REGISTRIES_PATTERN);
