import { tDataGridColumn } from '../../data-grid';
import { commonColumns } from '../../../overview/common/data-grid-columns';

export const threatHuntingColumns: tDataGridColumn[] = [
  commonColumns['timestamp'],
  commonColumns['agent.name'],
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
