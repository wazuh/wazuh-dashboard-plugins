import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const amazonWebServicesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.id'],
  commonColumns['wazuh.agent.name'],
  {
    id: 'aws.cloudtrail_event_source',
    initialWidth: 280,
  },
  {
    id: 'event.action',
    initialWidth: 280,
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
