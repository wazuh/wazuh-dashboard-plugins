import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const iso27001Columns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.iso_27001',
    initialWidth: 283,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
