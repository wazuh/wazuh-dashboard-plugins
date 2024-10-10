import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const googleCloudColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'data.gcp.jsonPayload.vmInstanceName',
  },
  {
    id: 'data.gcp.resource.labels.location',
    initialWidth: 260.23,
  },
  {
    id: 'data.gcp.resource.labels.project_id',
    initialWidth: 280.23,
  },
  {
    id: 'data.gcp.resource.type',
    initialWidth: 191.23,
  },
  {
    id: 'data.gcp.severity',
    initialWidth: 151.23,
  },
];
