import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const pciColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'compliance.pci_dss.requirements',
    initialWidth: 160,
  },
  {
    id: 'compliance.pci_dss.category',
    initialWidth: 160,
  },
  {
    id: 'compliance.pci_dss.name',
    initialWidth: 160,
  },
];
