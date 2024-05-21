import { tDataGridColumn } from '../../../common/data-grid';

export const mitreAttackColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    displayAsText: 'Time',
  },
  { id: 'agent.name', displayAsText: 'Agent Name' },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.description', displayAsText: 'Description' },
  { id: 'rule.level', displayAsText: 'Level' },
  { id: 'rule.id', displayAsText: 'Rule ID' },
];
