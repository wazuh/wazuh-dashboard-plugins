import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const dockerColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'container.image.name',
    initialWidth: 149,
  },
  {
    id: 'event.action',
    initialWidth: 161,
  },
  {
    id: 'event.category',
    initialWidth: 130,
  },
  {
    id: 'container.name',
    initialWidth: 160,
  },
];
