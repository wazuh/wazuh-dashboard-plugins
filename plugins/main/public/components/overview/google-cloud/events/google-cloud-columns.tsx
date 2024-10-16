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
    initialWidth: 261,
  },
  {
    id: 'data.gcp.resource.labels.project_id',
    initialWidth: 281,
  },
  {
    id: 'data.gcp.resource.type',
    initialWidth: 192,
  },
  {
    id: 'data.gcp.severity',
    initialWidth: 152,
  },
];
