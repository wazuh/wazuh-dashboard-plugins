import { EuiDataGridColumn } from '@elastic/eui';

export const MAX_ENTRIES_PER_QUERY = 10000;

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
  {
    id: 'agent.name',
  },
  {
    id: 'registry.path',
  },
  {
    id: '@timestamp',
  },
];
