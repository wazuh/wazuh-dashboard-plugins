import { EuiFlexItem, EuiLink, EuiFlexGroup } from '@elastic/eui';
import { formatUIDate, AppNavigate } from '../../../../../react-services';
import { tDataGridColumn } from '../../../../common/data-grid';
import React from 'react';

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
    <EuiFlexGroup gutterSize="s" direction="row">
      {techniques}
    </EuiFlexGroup>
  );
};

export const mitreAttackColumns: tDataGridColumn[] = [
  { id: 'timestamp', displayAsText: 'Time', render: (value) => formatUIDate(value) },
  {
    id: 'agent.name',
    displayAsText: 'Agent Name',
    render: (value: string, item: any) => {
      return (
        <EuiLink onClick={(e) => navigateTo(e, 'agents', { tab: 'welcome', agent: item.agent.id })}>
          {value}
        </EuiLink>
      );
    },
  },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
    render: (value) => renderTechniques(value),
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.description', displayAsText: 'Description' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
    render: (value) => (
      <EuiLink
        onClick={(e) =>
          navigateTo(e, 'manager', {
            tab: 'rules',
            redirectRule: value,
          })
        }
      >
        {value}
      </EuiLink>
    ),
  },
];
