import React from 'react';
import { i18n } from '@osd/i18n';
import { formatUIDate } from '../../../../../../../../react-services';
import { tDataGridColumn } from '../../../../../../../common/data-grid';

export const techniquesColumns: tDataGridColumn[] = [
  {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.time',
      {
        defaultMessage: 'Time',
      },
    ),
    render: value => formatUIDate(value),
  },
  {
    id: 'wazuh.agent.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.agent',
      {
        defaultMessage: 'Agent',
      },
    ),
  },
  {
    id: 'wazuh.agent.name',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.agentName',
      {
        defaultMessage: 'Agent Name',
      },
    ),
  },
  {
    id: 'wazuh.rule.mitre.technique.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.techniques',
      {
        defaultMessage: 'Technique(s)',
      },
    ),
    initialWidth: 200,
  },
  {
    id: 'wazuh.rule.mitre.tactic.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.tactics',
      {
        defaultMessage: 'Tactic(s)',
      },
    ),
    initialWidth: 266,
  },
  {
    id: 'wazuh.rule.level',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.level',
      {
        defaultMessage: 'Level',
      },
    ),
  },
  {
    id: 'wazuh.rule.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.ruleId',
      {
        defaultMessage: 'Rule ID',
      },
    ),
  },
  {
    id: 'wazuh.rule.title',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.title',
      {
        defaultMessage: 'Title',
      },
    ),
  },
];

export const agentTechniquesColumns: tDataGridColumn[] = [
  {
    id: '@timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.time',
      {
        defaultMessage: 'Time',
      },
    ),
    render: value => formatUIDate(value),
  },
  {
    id: 'wazuh.rule.mitre.technique.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.techniques',
      {
        defaultMessage: 'Technique(s)',
      },
    ),
    initialWidth: 200,
  },
  {
    id: 'wazuh.rule.mitre.tactic.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.tactics',
      {
        defaultMessage: 'Tactic(s)',
      },
    ),
    initialWidth: 266,
  },
  {
    id: 'wazuh.rule.level',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.level',
      {
        defaultMessage: 'Level',
      },
    ),
  },
  {
    id: 'wazuh.rule.id',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.ruleId',
      {
        defaultMessage: 'Rule ID',
      },
    ),
  },
  {
    id: 'wazuh.rule.title',
    displayAsText: i18n.translate(
      'wazuh.mitreAttack.techniqueFlyoutTable.columns.title',
      {
        defaultMessage: 'Title',
      },
    ),
  },
];
