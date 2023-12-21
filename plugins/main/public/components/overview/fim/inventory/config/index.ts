import { EuiDataGridColumn } from '@elastic/eui';

export const MAX_ENTRIES_PER_QUERY = 10000;

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
  {
    id: 'package.name',
  },
  {
    id: 'package.version',
  },
  {
    id: 'package.architecture',
  },
  {
    id: 'fim.severity',
  },
  {
    id: 'fim.id',
  },
  {
    id: 'fim.score.version',
  },
  {
    id: 'fim.score.base',
  },
  {
    id: 'event.created',
  },
];
