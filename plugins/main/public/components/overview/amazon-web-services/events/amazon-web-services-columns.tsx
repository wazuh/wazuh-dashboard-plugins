import { tDataGridColumn } from '../../../common/data-grid';

export const amazonWebServicesColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'data.aws.source',
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
