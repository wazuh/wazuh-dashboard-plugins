import { WAZUH_EVENTS_PATTERN } from '../../../../../../common/constants';
import { createPatternDataSourceRepositoryUseValue } from '../pattern-data-source-repository-use-setting-value';

export const EventsDataSourceRepository =
  createPatternDataSourceRepositoryUseValue(WAZUH_EVENTS_PATTERN);
