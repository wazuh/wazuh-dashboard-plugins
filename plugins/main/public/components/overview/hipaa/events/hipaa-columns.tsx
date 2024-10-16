import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const hipaaColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'rule.hipaa',
    initialWidth: 183,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
