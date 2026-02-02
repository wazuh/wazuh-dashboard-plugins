import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const githubColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.id'],
  commonColumns['agent.name'],
  { id: 'user.name' },
  { id: 'event.action' },
  { id: 'event.category' },
  { id: 'organization.name' },
];
