import { tDataGridColumn } from '../../../common/data-grid';

export const nistColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'rule.nist_800_53',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
  },
];
