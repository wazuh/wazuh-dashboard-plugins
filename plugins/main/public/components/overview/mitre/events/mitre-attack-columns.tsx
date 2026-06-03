import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const mitreAttackColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.rule.title' },
  { id: 'wazuh.rule.level', initialWidth: 150 },
  { id: 'wazuh.rule.mitre.tactic.name' },
  { id: 'wazuh.rule.mitre.technique.name' },
];
