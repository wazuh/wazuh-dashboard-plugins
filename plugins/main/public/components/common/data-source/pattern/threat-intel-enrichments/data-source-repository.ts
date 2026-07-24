import { WAZUH_THREATINTEL_ENRICHMENTS_PATTERN } from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const ThreatIntelEnrichmentsStatesDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(
    WAZUH_THREATINTEL_ENRICHMENTS_PATTERN,
  );
