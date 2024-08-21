import { tDataGridColumn } from '../../../common/data-grid';

export const office365Columns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'data.office365.Subscription',
  },
  {
    id: 'data.office365.Operation',
  },
  {
    id: 'data.office365.UserId',
  },
  {
    id: 'data.office365.ClientIP',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
  },
];
