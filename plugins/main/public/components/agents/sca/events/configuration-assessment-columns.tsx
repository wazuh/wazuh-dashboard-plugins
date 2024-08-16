import { tDataGridColumn } from '../../../common/data-grid';

export const configurationAssessmentColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'data.sca.check.title',
  },
  {
    id: 'data.sca.check.file',
  },
  {
    id: 'data.sca.check.result',
  },
  {
    id: 'data.sca.policy',
  },
];
