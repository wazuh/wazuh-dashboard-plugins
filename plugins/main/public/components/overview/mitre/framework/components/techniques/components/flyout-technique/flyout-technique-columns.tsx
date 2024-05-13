import React from 'react';
import { formatUIDate, AppNavigate } from '../../../../../../../../react-services';
import { tDataGridColumn } from '../../../../../../../common/data-grid';
import { EuiLink, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { getCore } from '../../../../../../../../kibana-services';
import { rules } from '../../../../../../../../utils/applications';

const navigateTo = (ev, section, params) => {
  AppNavigate.navigateToModule(ev, section, params);
};

const renderTechniques = (value: []) => {
  const techniques = value.map((technique) => {
    return (
      <EuiFlexItem key={technique}>
        <EuiLink
          key={technique}
          onClick={(e) =>
            navigateTo(e, 'overview', {
              tab: 'mitre',
              tabView: 'intelligence',
              tabRedirect: 'techniques',
              idToRedirect: technique,
            })
          }
        >
          {technique}
        </EuiLink>
      </EuiFlexItem>
    );
  });

  return (
    <EuiFlexGroup gutterSize="s" direction="column">
      {techniques}
    </EuiFlexGroup>
  );
};

export const techniquesColumns: tDataGridColumn[] = [
  { id: 'timestamp', displayAsText: 'Time', render: (value) => formatUIDate(value) },
  {
    id: 'agent.id',
    displayAsText: 'Agent',
    render: (value) => (
      <EuiLink onClick={(e) => navigateTo(e, 'agents', { tab: 'welcome', agent: value })}>
        {value}
      </EuiLink>
    ),
  },
  { id: 'agent.name', displayAsText: 'Agent Name' },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
    render: (value) => renderTechniques(value),
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
    render: (value) => (
      <EuiLink
        onClick={e => {
          getCore().application.navigateToApp(rules.id, {
            path: `#/manager/?tab=rules&redirectRule=${value}`,
          });
        }}
      >
        { value}
      </EuiLink >
    ),
  },
  { id: 'rule.description', displayAsText: 'Description' },
];

export const agentTechniquesColumns: tDataGridColumn[] = [
  { id: 'timestamp', displayAsText: 'Time' },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
    render: (value) => renderTechniques(value),
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
    render: (value) => (
      <EuiLink
        onClick={e => {
          getCore().application.navigateToApp(rules.id, {
            path: `#/manager/?tab=rules&redirectRule=${value}`,
          });
        }}
      >
        { value}
      </EuiLink >
    ),
  },
  { id: 'rule.description', displayAsText: 'Description' },
];
