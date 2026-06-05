import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const dockerColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'container.image.name',
  },
  {
    id: 'wazuh.rule.title',
  },
  {
    id: 'container.name',
    initialWidth: 160,
  },
  {
    id: 'event.action',
    initialWidth: 161,
  },
];
