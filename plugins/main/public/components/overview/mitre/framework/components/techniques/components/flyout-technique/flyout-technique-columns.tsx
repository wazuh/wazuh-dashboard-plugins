import React from 'react';
import { formatUIDate } from '../../../../../../../../react-services';
import { tDataGridColumn } from '../../../../../../../common/data-grid';
import { EuiLink, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { getCore } from '../../../../../../../../kibana-services';
import {
  rules,
  endpointSummary,
} from '../../../../../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import NavigationService from '../../../../../../../../react-services/navigation-service';

const navigateTo = (ev, section, params) => {
  NavigationService.getInstance().navigateToModule(ev, section, params);
};

const renderTechniques = (value: []) => {
  const techniques = value.map(technique => {
    /*
      ToDo:
      This link redirect to the Intelligence tab and open the flyout technique detail
      This must be replaced by the RedirectAppLinks but right now the RedirectAppLinks is not working,
      doesn't open the tab and the flyout technique, so we are using the AppNavigate.navigateToModule
    */
    return (
      <EuiFlexItem key={technique}>
        <EuiLink
          key={technique}
          onClick={e =>
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
    <EuiFlexGroup gutterSize='s' direction='column'>
      {techniques}
    </EuiFlexGroup>
  );
};

export const techniquesColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    displayAsText: 'Time',
    render: value => formatUIDate(value),
  },
  {
    id: 'agent.id',
    displayAsText: 'Agent',
    render: agentId => (
      <RedirectAppLinks application={getCore().application}>
        <EuiLink
          href={`${endpointSummary.id}#/agents?tab=welcome&agent=${agentId}`}
        >
          {agentId}
        </EuiLink>
      </RedirectAppLinks>
    ),
  },
  { id: 'agent.name', displayAsText: 'Agent Name' },
  {
    id: 'rule.mitre.id',
    displayAsText: 'Technique(s)',
    render: value => renderTechniques(value),
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
    render: value => (
      <RedirectAppLinks application={getCore().application}>
        <EuiLink href={`${rules.id}#/manager/?tab=rules&redirectRule=${value}`}>
          {value}
        </EuiLink>
      </RedirectAppLinks>
    ),
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
    render: value => renderTechniques(value),
  },
  { id: 'rule.mitre.tactic', displayAsText: 'Tactic(s)' },
  { id: 'rule.level', displayAsText: 'Level' },
  {
    id: 'rule.id',
    displayAsText: 'Rule ID',
    render: value => (
      <RedirectAppLinks application={getCore().application}>
        <EuiLink href={`${rules.id}#/manager/?tab=rules&redirectRule=${value}`}>
          {value}
        </EuiLink>
      </RedirectAppLinks>
    ),
  },
  { id: 'rule.description', displayAsText: 'Description' },
];
