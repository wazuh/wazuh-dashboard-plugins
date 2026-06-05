import { commonInitialWidth } from './initial-width';

export const commonColumns = {
  timestamp: {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    initialWidth: commonInitialWidth.timestamp,
  },
  'wazuh.agent.id': {
    id: 'wazuh.agent.id',
    initialWidth: commonInitialWidth['wazuh.agent.id'],
  },
  'wazuh.agent.name': {
    id: 'wazuh.agent.name',
    initialWidth: commonInitialWidth['wazuh.agent.name'],
  },
} as const;
