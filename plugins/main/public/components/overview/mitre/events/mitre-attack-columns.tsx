import { tDataGridColumn } from '../../../common/data-grid';

export const mitreAttackColumns: tDataGridColumn[] = [
  { id: 'timestamp' },
  { id: 'agent.name' },
  { id: 'rule.mitre.id' },
  { id: 'rule.mitre.tactic' },
  { id: 'rule.description' },
  { id: 'rule.level' },
  { id: 'rule.id' },
];
