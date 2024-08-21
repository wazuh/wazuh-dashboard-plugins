import { tDataGridColumn } from '../../../common/data-grid';

export const dockerColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'data.docker.from',
  },
  {
    id: 'data.docker.Type',
  },
  {
    id: 'data.docker.Action',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
];
