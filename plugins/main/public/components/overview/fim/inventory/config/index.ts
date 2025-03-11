import { EuiDataGridColumn } from '@elastic/eui';

export const MAX_ENTRIES_PER_QUERY = 10000;

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
  {
    id: 'agent.name',
  },
  {
    id: 'file.path',
  },
  {
    id: 'file.mtime',
  },
  {
    id: 'file.owner',
  },
  {
    id: 'file.uid',
  },
  {
    id: 'file.group',
  },
  {
    id: 'file.gid',
  },
  {
    id: 'file.size',
  },
];
