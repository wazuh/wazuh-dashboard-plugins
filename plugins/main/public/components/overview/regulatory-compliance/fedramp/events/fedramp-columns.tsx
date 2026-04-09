import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const fedrampColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.fedramp',
    initialWidth: 160,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
