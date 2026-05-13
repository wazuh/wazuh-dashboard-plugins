import { tDataGridColumn } from '../../data-grid';
import { commonColumns } from '../../../overview/common/data-grid-columns';

export const threatHuntingColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.integration.category', initialWidth: 130 },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.rule.title' },
  { id: 'wazuh.rule.level', initialWidth: 150 },
];
