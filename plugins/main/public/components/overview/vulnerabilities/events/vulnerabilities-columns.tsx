import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const vulnerabilitiesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'data.vulnerability.cve',
    initialWidth: 186,
  },
  {
    id: 'data.vulnerability.severity',
    initialWidth: 217,
  },
  {
    id: 'data.vulnerability.package.name',
    initialWidth: 257,
  },
  {
    id: 'data.vulnerability.package.version',
  },
  {
    id: 'data.vulnerability.status',
    initialWidth: 199,
  },
];
