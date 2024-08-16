import { tDataGridColumn } from '../../../common/data-grid';

export const hipaaColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc'
  },
  {
    id: 'agent.name',
  },
  {
    id: 'rule.hipaa',
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
