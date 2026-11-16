import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

/**
 * Names a column in words. The header keeps the field name in its tooltip, so
 * the column can still be found in the field list.
 */
const withReadableName = (
  column: tDataGridColumn,
  label: string,
): tDataGridColumn => ({
  ...column,
  displayAsText: label,
  display: (
    <EuiToolTip
      content={column.id}
      display='inlineBlock'
      anchorClassName='oui-textTruncate wz-display-inline'
    >
      <span>{label}</span>
    </EuiToolTip>
  ),
});

export const createRegulatoryComplianceColumns = (
  complianceFieldId: string,
  complianceFieldWidth = 260,
): tDataGridColumn[] => [
  withReadableName(
    commonColumns.timestamp as tDataGridColumn,
    i18n.translate('wazuh.regulatoryCompliance.findings.timeColumn', {
      defaultMessage: 'Time',
    }),
  ),
  withReadableName(
    commonColumns['wazuh.agent.name'],
    i18n.translate('wazuh.regulatoryCompliance.findings.agentColumn', {
      defaultMessage: 'Agent',
    }),
  ),
  withReadableName(
    { id: complianceFieldId, initialWidth: complianceFieldWidth },
    i18n.translate('wazuh.regulatoryCompliance.findings.requirementsColumn', {
      defaultMessage: 'Requirements',
    }),
  ),
  withReadableName(
    { id: 'wazuh.integration.category', initialWidth: 230 },
    i18n.translate('wazuh.regulatoryCompliance.findings.categoryColumn', {
      defaultMessage: 'Category',
    }),
  ),
  withReadableName(
    { id: 'wazuh.integration.name', initialWidth: 230 },
    i18n.translate('wazuh.regulatoryCompliance.findings.integrationColumn', {
      defaultMessage: 'Integration',
    }),
  ),
  withReadableName(
    { id: 'wazuh.rule.title' },
    i18n.translate('wazuh.regulatoryCompliance.findings.ruleColumn', {
      defaultMessage: 'Rule',
    }),
  ),
];
