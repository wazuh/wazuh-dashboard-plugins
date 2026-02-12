import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const azureColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  {
    id: 'event.action',
    initialWidth: 200,
  },
  {
    id: 'event.category',
    initialWidth: 150,
  },
  {
    id: 'source.ip',
    initialWidth: 120,
  },
  {
    id: 'azure.auditlogs.properties.activity_display_name',
    initialWidth: 250,
  },
  {
    id: 'event.outcome',
    initialWidth: 100,
  },
  {
    id: 'cloud.region',
    initialWidth: 120,
  },
  {
    id: 'azure.resource.name',
    initialWidth: 180,
  },
  {
    id: 'azure.tenant_id',
    initialWidth: 150,
  },
];
