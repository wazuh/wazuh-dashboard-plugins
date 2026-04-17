import { tDataGridColumn } from '../../../../common/data-grid';
import { commonColumns } from '../../../common/data-grid-columns';

export const cmmcColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  {
    id: 'rule.compliance.cmmc',
    initialWidth: 180,
  },
  { id: 'rule.id' },
  { id: 'rule.title' },
  { id: 'wazuh.integration.decoders' },
];
