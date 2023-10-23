import { EuiDataGridColumn } from "@elastic/eui";

export const inventoryTableDefaultColumns: EuiDataGridColumn[] = [
    {
      id: '@timestamp',
      displayAsText: 'timestamp',
      defaultSortDirection: 'desc',
    },
    {
      id: 'agent.id',
      displayAsText: 'agent.id',
    },
    {
      id: 'agent.name',
      displayAsText: 'agent.name',
    },
    {
      id: 'event.severity',
      displayAsText: 'event.severity',
    }
  ]