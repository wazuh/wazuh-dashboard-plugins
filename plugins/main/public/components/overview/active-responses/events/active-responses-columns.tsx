import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const activeResponsesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.active_response.name' },
  { id: 'wazuh.active_response.executable' },
  { id: 'wazuh.active_response.location' },
  { id: 'wazuh.active_response.type' },
];
