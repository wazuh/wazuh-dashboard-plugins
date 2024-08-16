import { tDataGridColumn } from '../../../common/data-grid';

export const fileIntegrityMonitoringColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc'
  },
  {
    id: 'agent.name',
  },
  {
    id: 'syscheck.path',
  },
  {
    id: 'syscheck.event',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
  },
];
