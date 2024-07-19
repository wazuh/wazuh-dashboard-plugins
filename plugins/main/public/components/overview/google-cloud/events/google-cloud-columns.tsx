import { tDataGridColumn } from '../../../common/data-grid';

export const googleCloudColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'data.gcp.jsonPayload.vmInstanceName',
  },
  {
    id: 'data.gcp.resource.labels.location',
  },
  {
    id: 'data.gcp.resource.labels.project_id',
  },
  {
    id: 'data.gcp.resource.type',
  },
  {
    id: 'data.gcp.severity',
  },
];
