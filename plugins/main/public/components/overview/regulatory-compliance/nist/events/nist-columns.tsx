import { tDataGridColumn } from '../../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const nistColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.nist_800_53',
    initialWidth: 171,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
