import React from 'react';
import { EuiLink, EuiText } from '@elastic/eui';
import { tDataGridRenderColumn } from '../data-grid';
import { getCore } from '../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { endpointSummary, rules } from '../../../utils/applications';
import NavigationService from '../../../react-services/navigation-service';

export const MAX_ENTRIES_PER_QUERY = 10000;

const navigateTo = (ev, section, params) => {
  NavigationService.getInstance().navigateToModule(ev, section, params);
};

const renderRequirementsSecurityOperations = (value: []) => {
  return (
    <EuiText gutterSize='s' direction='column'>
      {value.join(', ')}
    </EuiText>
  );
};

const renderMitreTechnique = (technique: string) => (
  <EuiLink
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
);

export const wzDiscoverRenderColumns: tDataGridRenderColumn[] = [
  {
    id: 'agent.id',
    render: value => {
      if (value === '000') {
        return value;
      }

      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink
            href={`${endpointSummary.id}#/agents?tab=welcome&agent=${value}`}
          >
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
  {
    id: 'agent.name',
    render: (value, row) => {
      if (row.agent.id === '000') {
        return value;
      }

      return (
        <RedirectAppLinks application={getCore().application}>
          <EuiLink
            href={`${endpointSummary.id}#/agents?tab=welcome&agent=${row.agent.id}`}
          >
            {value}
          </EuiLink>
        </RedirectAppLinks>
      );
    },
  },
  {
    id: 'rule.id',
    render: value => (
      <RedirectAppLinks application={getCore().application}>
        <EuiLink href={`${rules.id}#/manager/?tab=rules&redirectRule=${value}`}>
          {value}
        </EuiLink>
      </RedirectAppLinks>
    ),
  },
  {
    id: 'rule.mitre.id',
    render: value =>
      Array.isArray(value) ? (
        <div style={{ display: 'flex', gap: 10 }}>
          {value?.map((technique, index) => (
            <div key={`${technique}-${index}`}>
              {renderMitreTechnique(technique)}
            </div>
          ))}
        </div>
      ) : (
        <div>{renderMitreTechnique(value)}</div>
      ),
  },
  {
    id: 'rule.pci_dss',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'rule.gdpr',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'rule.nist_800_53',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'rule.hipaa',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'rule.tsc',
    render: renderRequirementsSecurityOperations,
  },
];
