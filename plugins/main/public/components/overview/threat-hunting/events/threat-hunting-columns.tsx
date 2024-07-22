import { EuiDataGridColumn } from '@elastic/eui';
import { tDataGridColumn } from '../../../common/data-grid';

export const MAX_ENTRIES_PER_QUERY = 10000;

export const threatHuntingTableDefaultColumns: tDataGridColumn[] = [
  {
    id: 'icon',
  },
  {
    id: 'timestamp',
  },
  {
    id: 'agent.id',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'rule.mitre.id',
  },
  {
    id: 'rule.mitre.tactic',
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

export const threatHuntingTableAgentColumns: EuiDataGridColumn[] = [
  {
    id: 'icon',
  },
  {
    id: 'timestamp',
  },
  {
    id: 'rule.mitre.id',
  },
  {
    id: 'rule.mitre.tactic',
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
