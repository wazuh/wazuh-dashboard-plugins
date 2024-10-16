import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const mitreAttackColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'rule.mitre.id',
    initialWidth: 118,
  },
  {
    id: 'rule.mitre.tactic',
    initialWidth: 280,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
