import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

// TODO: Change the columns to match the Azure data source when we have the data structure

export const azureColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  {
    id: 'data.aws.source',
    initialWidth: 144,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
