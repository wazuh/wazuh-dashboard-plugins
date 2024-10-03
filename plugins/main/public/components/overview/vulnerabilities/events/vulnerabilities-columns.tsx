import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const vulnerabilitiesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['agent.name'],
  {
    id: 'data.vulnerability.cve',
    initialWidth: 185.23,
  },
  {
    id: 'data.vulnerability.severity',
    initialWidth: 216.23,
  },
  {
    id: 'data.vulnerability.package.name',
    initialWidth: 256.23,
  },
  {
    id: 'data.vulnerability.package.version',
  },
  {
    id: 'data.vulnerability.status',
    initialWidth: 198.23,
  },
];
