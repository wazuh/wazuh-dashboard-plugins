import { EuiDataGridColumn } from '@elastic/eui';

export const MAX_ENTRIES_PER_QUERY = 10000;

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
  {
    id: 'agent.id',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'package.name',
  },
  {
    id: 'package.version',
  },
  {
    id: 'vulnerability.severity',
  },
  {
    id: 'vulnerability.id',
  },
  {
    id: 'vulnerability.score.version',
  },
];
