import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const fileIntegrityMonitoringColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.id'],
  commonColumns['wazuh.agent.name'],
  { id: 'rule.title' },
  { id: 'rule.level' },
  { id: 'event.action' },
  { id: 'file.path' },
];
