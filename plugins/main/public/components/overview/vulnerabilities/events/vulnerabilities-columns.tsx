import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const vulnerabilitiesColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'package.name' },
  { id: 'package.version' },
  { id: 'vulnerability.severity' },
  { id: 'vulnerability.id' },
];
