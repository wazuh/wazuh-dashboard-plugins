import { EuiDataGridColumn } from "@elastic/eui";

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
    {
      id: 'package.name',
      displayAsText: 'Name',
    },
    {
      id: 'package.version',
      displayAsText: 'Version',
    },
    {
      id: 'package.architecture',
      displayAsText: 'Architecture',
    },
    {
      id: 'vulnerability.severity',
      displayAsText: 'Severity',
    },
    {
      id: 'vulnerability.id',
      displayAsText: 'Id',
    },
    {
      id: 'vulnerability.score.version',
      displayAsText: 'Score version',
    },
    {
      id: 'vulnerability.score.base',
      displayAsText: 'Score',
    },
    {
      id: 'event.created',
      displayAsText: 'Detected time',
    }
  ]