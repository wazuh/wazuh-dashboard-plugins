import React from 'react';
import { EuiText } from '@elastic/eui';
import { tDataGridRenderColumn } from '../data-grid';
import {
  endpointSummary,
  rules,
  mitreAttack,
} from '../../../utils/applications';
import { WzLink } from '../../wz-link/wz-link';

export const MAX_ENTRIES_PER_QUERY = 10000;

const renderRequirementsSecurityOperations = (value: []) => {
  return (
    <EuiText gutterSize='s' direction='column'>
      {value.join(', ')}
    </EuiText>
  );
};

const renderMitreTechnique = technique => (
  <WzLink
    appId={mitreAttack.id}
    path={`/overview?tab=mitre&tabView=intelligence&tabRedirect=techniques&idToRedirect=${technique}`}
  >
    {technique}
  </WzLink>
);

export const wzDiscoverRenderColumns: tDataGridRenderColumn[] = [
  {
    id: 'agent.id',
    render: value => {
      if (value === '000') {
        return value;
      }

      return (
        <WzLink
          appId={endpointSummary.id}
          path={`/agents?tab=welcome&agent=${value}`}
        >
          {value}
        </WzLink>
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
        <WzLink
          appId={endpointSummary.id}
          path={`/agents?tab=welcome&agent=${row.agent.id}`}
        >
          {value}
        </WzLink>
      );
    },
  },
  {
    id: 'rule.id',
    render: value => (
      <WzLink
        appId={rules.id}
        path={`/manager/?tab=rules&redirectRule=${value}`}
      >
        {value}
      </WzLink>
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
