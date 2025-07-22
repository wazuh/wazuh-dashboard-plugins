import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

// TODO: Change the columns to match the Azure data source when we have the data structure

export const azureColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  {
    id: 'data.ms-graph.activity',
    initialWidth: 200,
  },
  {
    id: 'data.ms-graph.activityResult',
    initialWidth: 130,
  },
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
