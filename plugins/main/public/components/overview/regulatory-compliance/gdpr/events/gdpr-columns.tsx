import { tDataGridColumn } from '../../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const gdprColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.gdpr',
    initialWidth: 138,
  },
  { id: 'wazuh.integration.name' },
  { id: 'wazuh.integration.category' },
  { id: 'wazuh.integration.decoders' },
];
