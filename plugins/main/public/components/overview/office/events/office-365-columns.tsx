import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const office365Columns: tDataGridColumn[] = [
  commonColumns.timestamp,
  {
    id: 'data.office365.Subscription',
    initialWidth: 224.775,
  },
  {
    id: 'data.office365.Operation',
  },
  {
    id: 'data.office365.UserId',
    initialWidth: 225.775,
  },
  {
    id: 'data.office365.ClientIP',
    initialWidth: 190.775,
  },
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
