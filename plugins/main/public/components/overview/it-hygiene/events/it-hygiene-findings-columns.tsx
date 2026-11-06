import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const itHygieneFindingsColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.rule.title' },
  { id: 'wazuh.rule.level' },
  { id: 'event.action' },
];
