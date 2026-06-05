import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const office365Columns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.id'],
  commonColumns['wazuh.agent.name'],
  {
    id: 'event.type',
    initialWidth: 140,
  },
  {
    id: 'user.id',
    initialWidth: 256,
  },
  {
    id: 'event.provider',
    initialWidth: 225,
  },
  {
    id: 'client.ip',
  },
];
