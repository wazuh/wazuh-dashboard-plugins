import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const gdprColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'rule.gdpr',
    initialWidth: 138,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
