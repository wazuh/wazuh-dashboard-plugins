import { EuiDataGridColumn } from "@elastic/eui";

export const MAX_ENTRIES_PER_QUERY = 10000;

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
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
    {
      id: 'vulnerability.score.base',
    },
  ]