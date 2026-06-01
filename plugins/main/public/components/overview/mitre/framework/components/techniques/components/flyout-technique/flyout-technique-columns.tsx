import React from 'react';
import { formatUIDate } from '../../../../../../../../react-services';
import { tDataGridColumn } from '../../../../../../../common/data-grid';

export const techniquesColumns: tDataGridColumn[] = [
  {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    displayAsText: 'Time',
    render: value => formatUIDate(value),
  },
  {
    id: 'wazuh.agent.id',
    displayAsText: 'Agent',
  },
  { id: 'wazuh.agent.name', displayAsText: 'Agent Name' },
  {
    id: 'wazuh.rule.mitre.technique.id',
    displayAsText: 'Technique(s)',
    initialWidth: 200,
  },
  {
    id: 'wazuh.rule.mitre.tactic.id',
    displayAsText: 'Tactic(s)',
    initialWidth: 266,
  },
  { id: 'wazuh.rule.level', displayAsText: 'Level' },
  {
    id: 'wazuh.rule.id',
    displayAsText: 'Rule ID',
  },
  { id: 'wazuh.rule.title', displayAsText: 'Title' },
];

export const agentTechniquesColumns: tDataGridColumn[] = [
  {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    displayAsText: 'Time',
    render: value => formatUIDate(value),
  },
  {
    id: 'wazuh.rule.mitre.technique.id',
    displayAsText: 'Technique(s)',
    initialWidth: 200,
  },
  {
    id: 'wazuh.rule.mitre.tactic.id',
    displayAsText: 'Tactic(s)',
    initialWidth: 266,
  },
  { id: 'wazuh.rule.level', displayAsText: 'Level' },
  {
    id: 'wazuh.rule.id',
    displayAsText: 'Rule ID',
  },
  { id: 'wazuh.rule.title', displayAsText: 'Title' },
];
