import { WAZUH_VULNERABILITIES_PATTERN } from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const VulnerabilitiesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_VULNERABILITIES_PATTERN);
