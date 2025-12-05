import { commonInitialWidth } from './initial-width';

export const commonColumns = {
  timestamp: {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    initialWidth: commonInitialWidth.timestamp,
  },
  'agent.id': {
    id: 'agent.id',
    initialWidth: commonInitialWidth['agent.id'],
  },
  'agent.name': {
    id: 'agent.name',
    initialWidth: commonInitialWidth['agent.name'],
  },
} as const;
