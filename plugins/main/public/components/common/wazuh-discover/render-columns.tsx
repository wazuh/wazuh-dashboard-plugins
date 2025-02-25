import React from 'react';
import { EuiLink, EuiToolTip } from '@elastic/eui';
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
  return <span>{Array.isArray(value) ? value.join(', ') : value}</span>;
};

const renderLinksReference = (value: string) => {
  if (!value) {
    return '-';
  }

  const links = (
    <>
      {/* We separated the reference value since it is a string separated by
            commas, causing an issue when returning 2 links. */}
      {value?.split(', ').map((link, index) => (
        <span key={index}>
          {!!index && ', '}
          <EuiToolTip
            position='top'
            content='Navigate to the vulnerability reference'
          >
            <EuiLink
              href={link}
              target='_blank'
              rel='noopener noreferrer'
              external
            >
              {link}
            </EuiLink>
          </EuiToolTip>
        </span>
      ))}
    </>
  );
  return links;
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
    id: 'data.vulnerability.reference',
    render: renderLinksReference,
  },
  {
    id: 'vulnerability.reference',
    render: renderLinksReference,
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
  {
    id: 'vulnerability.id',
    render: (value, row) => {
      if (!row.vulnerability?.scanner?.reference) {
        return value;
      }
      return (
        <EuiToolTip
          position='top'
          content={i18n.translate(
            'discover.fieldLinkTooltip.vulnerabilityScannerReference',
            {
              defaultMessage: 'Navigate to the vulnerability CTI reference',
            },
          )}
        >
          <EuiLink
            href={row.vulnerability.scanner.reference}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            {value}
          </EuiLink>
        </EuiToolTip>
      );
    },
  },
  {
    id: 'data.vulnerability.cve',
    render: (value, row) => {
      if (!row.data?.vulnerability?.scanner?.reference) {
        return value;
      }
      return (
        <EuiToolTip
          position='top'
          content={i18n.translate(
            'discover.fieldLinkTooltip.vulnerabilityScannerReference',
            {
              defaultMessage: 'Navigate to the vulnerability CTI reference',
            },
          )}
        >
          <EuiLink
            href={row.data.vulnerability.scanner.reference}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            {value}
          </EuiLink>
        </EuiToolTip>
      );
    },
  },
  {
    id: 'data.vulnerability.scanner.reference',
    render: renderLinksReference,
  },
  {
    id: 'vulnerability.scanner.reference',
    render: renderLinksReference,
  },
];
