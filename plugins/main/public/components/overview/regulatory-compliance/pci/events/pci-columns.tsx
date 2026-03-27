import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const pciColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.pci_dss',
    initialWidth: 160,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
