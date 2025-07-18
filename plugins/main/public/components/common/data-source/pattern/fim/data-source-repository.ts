import {
  WAZUH_FIM_FILES_PATTERN,
  WAZUH_FIM_REGISTRY_KEYS_PATTERN,
  WAZUH_FIM_REGISTRY_VALUES_PATTERN,
} from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const FIMFilesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FIM_FILES_PATTERN);

export const FIMRegistryKeysStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FIM_REGISTRY_KEYS_PATTERN);

export const FIMRegistryValuesStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FIM_REGISTRY_VALUES_PATTERN);
