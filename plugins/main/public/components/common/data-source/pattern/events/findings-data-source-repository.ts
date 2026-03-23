import { WAZUH_FINDINGS_PATTERN } from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const FindingsDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_FINDINGS_PATTERN);
