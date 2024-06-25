import { tDataGridColumn } from '../../../common/data-grid';

export const vulnerabilitiesColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'data.vulnerability.package.name',
  },
  {
    id: 'data.vulnerability.cve',
  },
  {
    id: 'data.vulnerability.severity',
  },
  {
    id: 'data.vulnerability.status',
  },
];
