import { WAZUH_AGENT_STATS_PATTERN } from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const AgentStatsDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_AGENT_STATS_PATTERN);
