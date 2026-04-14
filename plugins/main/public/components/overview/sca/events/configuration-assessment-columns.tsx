import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const configurationAssessmentColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'policy.name' },
  { id: 'policy.description' },
  { id: 'policy.file' },
  { id: 'event.outcome' },
];
