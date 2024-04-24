import { EuiDataGridColumn, EuiLink } from '@elastic/eui';
import { tDataGridColumn } from '../../../common/data-grid';
import { getCore } from '../../../../kibana-services';
import React from 'react';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';

export const MAX_ENTRIES_PER_QUERY = 10000;

export const threatHuntingTableDefaultColumns: tDataGridColumn[] = [
  {
    id: 'icon',
  },
  {
    id: 'timestamp',
  },
  {
    id: 'agent.id',
    render: (value: any) => {
      const destURL = getCore().application.getUrlForApp('endpoints-summary', {
        path: `#/agents?tab=welcome&agent=${value}`,
      });
      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink href={destURL} style={{ cursor: 'pointer' }}>
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
  {
    id: 'agent.name',
  },
  {
    id: 'rule.mitre.id',
    render: (value: any) => {
      const destURL = getCore().application.getUrlForApp('mitre-attack', {
        path: `#/overview/?tab=mitre&tabView=intelligence&tabRedirect=techniques&idToRedirect=${value}`,
      });
      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink href={destURL} style={{ cursor: 'pointer' }}>
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
  {
    id: 'rule.mitre.tactic',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
    render: (value: any) => {
      const destURL = getCore().application.getUrlForApp('rules', {
        path: `manager/?tab=ruleset&redirectRule=${value}`,
      });
      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink href={destURL} style={{ cursor: 'pointer' }}>
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
];

export const threatHuntingTableAgentColumns: EuiDataGridColumn[] = [
  {
    id: 'icon',
  },
  {
    id: 'timestamp',
  },
  {
    id: 'rule.mitre.id',
    render: (value: any) => {
      const destURL = getCore().application.getUrlForApp('mitre-attack', {
        path: `#/overview/?tab=mitre&tabView=intelligence&tabRedirect=techniques&idToRedirect=${value}`,
      });
      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink href={destURL} style={{ cursor: 'pointer' }}>
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
  {
    id: 'rule.mitre.tactic',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
    render: (value: any) => {
      const destURL = getCore().application.getUrlForApp('rules', {
        path: `manager/?tab=ruleset&redirectRule=${value}`,
      });
      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink href={destURL} style={{ cursor: 'pointer' }}>
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
];
