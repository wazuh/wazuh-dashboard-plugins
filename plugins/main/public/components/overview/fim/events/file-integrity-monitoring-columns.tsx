import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const fileIntegrityMonitoringColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'syscheck.path',
    initialWidth: 392,
  },
  {
    id: 'syscheck.event',
    initialWidth: 140,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
