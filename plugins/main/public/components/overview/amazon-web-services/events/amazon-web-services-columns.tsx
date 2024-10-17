import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const amazonWebServicesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  {
    id: 'data.aws.source',
    initialWidth: 144,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
