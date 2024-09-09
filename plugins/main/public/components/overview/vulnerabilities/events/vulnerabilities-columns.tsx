import { tDataGridColumn } from '../../../common/data-grid';

export const vulnerabilitiesColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'data.vulnerability.cve',
  },
  {
    id: 'data.vulnerability.severity',
  },
  {
    id: 'data.vulnerability.package.name',
  },
  {
    id: 'data.vulnerability.package.version',
  },
  {
    id: 'data.vulnerability.status',
  },
];
