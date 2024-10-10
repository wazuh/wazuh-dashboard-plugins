import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const dockerColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'data.docker.from',
    initialWidth: 150.525,
  },
  {
    id: 'data.docker.Type',
    initialWidth: 148.525,
  },
  {
    id: 'data.docker.Action',
    initialWidth: 160.525,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
];
