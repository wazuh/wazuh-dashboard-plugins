import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const fileIntegrityMonitoringColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.id'],
  commonColumns['wazuh.agent.name'],
  { id: 'file.path' },
  { id: 'event.type' },
  { id: 'event.action' },
  { id: 'file.inode' },
];
