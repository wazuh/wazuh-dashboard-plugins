import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const amazonWebServicesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  {
    id: 'aws.cloudtrail_event_source',
  },
  {
    id: 'event.action',
  },
  {
    id: 'cloud.region',
    initialWidth: 280,
  },
  {
    id: 'event.outcome',
    initialWidth: 280,
  },
];
