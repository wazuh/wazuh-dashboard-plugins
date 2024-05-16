import { EuiDataGridColumn, EuiLink } from '@elastic/eui';
import { tDataGridColumn } from '../../../common/data-grid';
import { getCore } from '../../../../kibana-services';
import React from 'react';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  endpointSummary,
  mitreAttack,
  rules,
} from '../../../../utils/applications';

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
      if (value === '000') {
        return value;
      }
      const destURL = getCore().application.getUrlForApp(endpointSummary.id, {
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
    render: (value: any, _source) => {
      if (_source.agent.id === '000') {
        return value;
      }
      const destURL = getCore().application.getUrlForApp(endpointSummary.id, {
        path: `#/agents?tab=welcome&agent=${_source.agent.id}`,
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
    id: 'rule.mitre.id',
    render: (value: any) => {
      const destURL = getCore().application.getUrlForApp(mitreAttack.id, {
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
      const destURL = getCore().application.getUrlForApp(rules.id, {
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
      const destURL = getCore().application.getUrlForApp(mitreAttack.id, {
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
      const destURL = getCore().application.getUrlForApp(rules.id, {
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
