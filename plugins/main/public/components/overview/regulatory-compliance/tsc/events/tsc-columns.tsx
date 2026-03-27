import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const tscColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.tsc',
    initialWidth: 283,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
