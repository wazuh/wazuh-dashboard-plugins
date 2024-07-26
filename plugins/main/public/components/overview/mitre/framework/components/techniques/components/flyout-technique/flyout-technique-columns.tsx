import React from 'react';
import { formatUIDate } from '../../../../../../../../react-services';
import { tDataGridColumn } from '../../../../../../../common/data-grid';

export const techniquesColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    displayAsText: 'Time',
    render: value => formatUIDate(value),
  },
  {
    id: 'agent.id',
    displayAsText: 'Agent',
  },
  { id: 'agent.name', displayAsText: 'Agent Name' },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
  },
  { id: 'rule.description', displayAsText: 'Description' },
];

export const agentTechniquesColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    displayAsText: 'Time',
    render: value => formatUIDate(value),
  },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
  },
  { id: 'rule.description', displayAsText: 'Description' },
];
