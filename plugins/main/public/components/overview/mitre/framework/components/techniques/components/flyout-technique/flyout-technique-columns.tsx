import React from 'react';
import { formatUIDate } from '../../../../../../../../react-services';
import { tDataGridColumn } from '../../../../../../../common/data-grid';
import { mitreI18n } from '../../../../../../i18n';

export const techniquesColumns: tDataGridColumn[] = [
  {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    displayAsText: mitreI18n.columnTime,
    render: value => formatUIDate(value),
  },
  {
    id: 'wazuh.agent.id',
    displayAsText: mitreI18n.columnAgent,
  },
  { id: 'wazuh.agent.name', displayAsText: mitreI18n.columnAgentName },
  {
    id: 'wazuh.rule.mitre.technique.id',
    displayAsText: mitreI18n.columnTechniques,
    initialWidth: 200,
  },
  {
    id: 'wazuh.rule.mitre.tactic.id',
    displayAsText: mitreI18n.columnTactics,
    initialWidth: 266,
  },
  { id: 'wazuh.rule.level', displayAsText: mitreI18n.columnLevel },
  {
    id: 'wazuh.rule.id',
    displayAsText: mitreI18n.columnRuleId,
  },
  { id: 'wazuh.rule.title', displayAsText: mitreI18n.columnTitle },
];

export const agentTechniquesColumns: tDataGridColumn[] = [
  {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    displayAsText: mitreI18n.columnTime,
    render: value => formatUIDate(value),
  },
  {
    id: 'wazuh.rule.mitre.technique.id',
    displayAsText: mitreI18n.columnTechniques,
    initialWidth: 200,
  },
  {
    id: 'wazuh.rule.mitre.tactic.id',
    displayAsText: mitreI18n.columnTactics,
    initialWidth: 266,
  },
  { id: 'wazuh.rule.level', displayAsText: mitreI18n.columnLevel },
  {
    id: 'wazuh.rule.id',
    displayAsText: mitreI18n.columnRuleId,
  },
  { id: 'wazuh.rule.title', displayAsText: mitreI18n.columnTitle },
];
