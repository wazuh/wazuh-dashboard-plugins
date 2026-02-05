import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const googleCloudColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'cloud.instance.id',
  },
  {
    id: 'cloud.region',
    initialWidth: 180,
  },
  {
    id: 'cloud.project.id',
    initialWidth: 220,
  },
  {
    id: 'event.action',
    initialWidth: 250,
  },
  {
    id: 'event.outcome',
    initialWidth: 120,
  },
  {
    id: 'event.category',
    initialWidth: 240,
  },
  {
    id: 'gcp_audit.servicename',
    initialWidth: 220,
  },
  {
    id: 'dns.response_code',
    initialWidth: 220,
  },
];
