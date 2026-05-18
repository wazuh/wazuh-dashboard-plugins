import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const createRegulatoryComplianceColumns = (
  complianceFieldId: string,
  complianceFieldWidth = 260,
): tDataGridColumn[] => [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: complianceFieldId, initialWidth: complianceFieldWidth },
  { id: 'wazuh.integration.category', initialWidth: 230 },
  { id: 'wazuh.integration.name', initialWidth: 230 },
  { id: 'wazuh.rule.title' },
];
