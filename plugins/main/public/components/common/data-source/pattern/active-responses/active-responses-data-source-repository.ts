import { WAZUH_ACTIVE_RESPONSES_PATTERN } from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const ActiveResponsesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_ACTIVE_RESPONSES_PATTERN);
