import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const mitreAttackColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.mitre.tactic',
    initialWidth: 280,
  },
  {
    id: 'rule.title',
    initialWidth: 280,
  },
  {
    id: 'rule.level',
    initialWidth: 280,
  },
];
