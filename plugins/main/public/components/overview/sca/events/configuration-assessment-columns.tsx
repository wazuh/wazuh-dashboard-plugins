import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const configurationAssessmentColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'policy.name' },
  { id: 'check.id', initialWidth: 100 },
  { id: 'check.name' },
  { id: 'check.result', initialWidth: 130 },
];
