import { tDataGridColumn } from '../../data-grid';
import { commonColumns } from '../../../overview/common/data-grid-columns';

export const threatHuntingColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' }
];
