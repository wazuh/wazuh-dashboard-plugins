import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const itHygieneFindingsColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.id'],
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.rule.title' },
  { id: 'event.action' },
  { id: 'package.name' },
  { id: 'user.target.name' },
  { id: 'group.name' },
  { id: 'service.name' },
];
