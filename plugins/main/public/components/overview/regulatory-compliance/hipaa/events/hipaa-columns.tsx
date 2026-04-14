import { tDataGridColumn } from '../../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const hipaaColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.hipaa',
    initialWidth: 183,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
