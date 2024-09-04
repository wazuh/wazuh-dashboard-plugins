import React from 'react';
import { EuiText, EuiLink, EuiToolTip } from '@elastic/eui';
import { tDataGridRenderColumn } from '../data-grid';
import {
  endpointSummary,
  rules,
  mitreAttack,
} from '../../../utils/applications';
import { WzLink } from '../../wz-link/wz-link';
import { i18n } from '@osd/i18n';

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
    toolTipProps={{
      content: i18n.translate('discover.fieldLinkTooltip.mitreTechnique', {
        defaultMessage:
          'Navigate to MITRE ATT&CK - Intelligence and see the technique details',
      }),
    }}
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
          toolTipProps={{
            content: i18n.translate('discover.fieldLinkTooltip.agent', {
              defaultMessage: 'Navigate to the agent details',
            }),
          }}
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
          toolTipProps={{
            content: i18n.translate('discover.fieldLinkTooltip.agent', {
              defaultMessage: 'Navigate to the agent details',
            }),
          }}
        >
          {value}
        </WzLink>
      );
    },
  },
  {
    id: 'vulnerability.reference',
    render: value => {
      return (
        <EuiToolTip
          position='top'
          content='Navigate to the vulnerability reference'
        >
          <EuiLink href={value} target='_blank'>
            {value}
          </EuiLink>
        </EuiToolTip>
      );
    },
  },
  {
    id: 'rule.id',
    render: value => (
      <WzLink
        appId={rules.id}
        path={`/manager/?tab=rules&redirectRule=${value}`}
        toolTipProps={{
          content: i18n.translate('discover.fieldLinkTooltip.rule', {
            defaultMessage: 'Navigate to the rule details',
          }),
        }}
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
