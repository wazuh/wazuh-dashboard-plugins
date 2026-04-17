import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const configurationAssessmentColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'policy.name' },
  { id: 'check.id' },
  { id: 'check.name' },
  { id: 'event.outcome' },
];
