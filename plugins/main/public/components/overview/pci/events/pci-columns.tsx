import { tDataGridColumn } from '../../../common/data-grid';

export const pciColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'agent.name',
  },
  {
    id: 'rule.pci_dss',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
  },
];
