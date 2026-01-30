import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const githubColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.id'],
  commonColumns['agent.name'],
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'event.action' },
  { id: 'organization.name' },
];
