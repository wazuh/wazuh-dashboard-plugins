import { tDataGridColumn } from '../../../common/data-grid';

export const mitreAttackColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  { id: 'agent.name' },
  { id: 'rule.mitre.id' },
  { id: 'rule.mitre.tactic' },
  { id: 'rule.description' },
  { id: 'rule.level' },
  { id: 'rule.id' },
];
