import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const dockerColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'data.docker.from',
    initialWidth: 151,
  },
  {
    id: 'data.docker.Type',
    initialWidth: 149,
  },
  {
    id: 'data.docker.Action',
    initialWidth: 161,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
];
