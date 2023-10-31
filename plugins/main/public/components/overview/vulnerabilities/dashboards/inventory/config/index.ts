import { EuiDataGridColumn } from "@elastic/eui";

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
    {
      id: 'event.created',
    }
  ]