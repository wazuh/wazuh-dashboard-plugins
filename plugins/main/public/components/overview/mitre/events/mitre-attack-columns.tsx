import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const mitreAttackColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.mitre.tactic',
  },
  {
    id: 'rule.title',
  },
  {
    id: 'rule.level',
  },
];
