import React from 'react';
import { EuiLink, EuiToolTip } from '@elastic/eui';
import { RenderColumnOptions, tDataGridRenderColumn } from '../data-grid';
import { endpointSummary, mitreAttack } from '../../../utils/applications';
import { WzLink } from '../../wz-link/wz-link';
import { i18n } from '@osd/i18n';
import { CTI_CVE_LINK_BASE_PATH } from '../../../../common/constants';

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

const mitreList = (value: string | string[]) =>
  (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean);

const renderMitreList = (
  value: string | string[],
  renderItem?: (item: string, isOnly: boolean) => React.ReactNode,
  options?: RenderColumnOptions,
) => {
  const items = mitreList(value);

  if (!items.length) {
    return '-';
  }

  if (options?.context === 'doc-viewer') {
    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0 4px',
        }}
      >
        {items.map((item, index) => (
          <span key={`${item}-${index}`} style={{ whiteSpace: 'nowrap' }}>
            {renderItem ? renderItem(item, true) : item}
            {index < items.length - 1 ? ',' : ''}
          </span>
        ))}
      </div>
    );
  }

  const label = items.join(', ');
  const isOnly = items.length === 1;

  if (isOnly) {
    return renderItem ? (
      renderItem(items[0], true)
    ) : (
      <span className='wz-ellipsis' style={{ display: 'block' }}>
        {items[0]}
      </span>
    );
  }

  return (
    <EuiToolTip position='top' content={label} anchorClassName='wz-width-100'>
      <span className='wz-ellipsis' style={{ display: 'block' }}>
        {items.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && ', '}
            {renderItem ? renderItem(item, false) : item}
          </React.Fragment>
        ))}
      </span>
    </EuiToolTip>
  );
};

const renderMitreTechnique = (technique: string, showLinkTooltip = true) => (
  <WzLink
    appId={mitreAttack.id}
    path={`/overview?tab=mitre&tabView=intelligence&tabRedirect=techniques&idToRedirect=${technique}`}
    toolTipProps={
      showLinkTooltip
        ? {
            content: i18n.translate(
              'discover.fieldLinkTooltip.mitreTechnique',
              {
                defaultMessage:
                  'Navigate to MITRE ATT&CK - Intelligence and see the technique details',
              },
            ),
          }
        : undefined
    }
  >
    {technique}
  </WzLink>
);

export const wzDiscoverRenderColumns: tDataGridRenderColumn[] = [
  {
    id: 'wazuh.agent.id',
    render: value => (
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
    ),
  },
  {
    id: 'wazuh.agent.name',
    render: (value, row) => (
      <WzLink
        appId={endpointSummary.id}
        path={`/agents?tab=welcome&agent=${row.wazuh.agent.id}`}
        toolTipProps={{
          content: i18n.translate('discover.fieldLinkTooltip.agent', {
            defaultMessage: 'Navigate to the agent details',
          }),
        }}
      >
        {value}
      </WzLink>
    ),
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
    id: 'wazuh.rule.mitre.technique',
    render: (
      value: string | string[],
      _row: object,
      options?: RenderColumnOptions,
    ) => renderMitreList(value, renderMitreTechnique, options),
  },
  {
    id: 'wazuh.rule.mitre.tactic',
    render: (value: string | string[]) => renderMitreList(value),
  },
  {
    id: 'wazuh.rule.compliance.pci_dss',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.gdpr',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.iso_27001',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.nist_800_53',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.hipaa',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.tsc',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.nist_800_171',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.cmmc',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.fedramp',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'wazuh.rule.compliance.nis2',
    render: renderRequirementsSecurityOperations,
  },
  {
    id: 'vulnerability.id',
    render: (value, row) => {
      if (
        !(row.vulnerability?.reference || row.vulnerability?.scanner?.reference)
      ) {
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
            href={`${CTI_CVE_LINK_BASE_PATH}${row.vulnerability.id}`}
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
      if (
        !(
          row.data?.vulnerability?.reference ||
          row.data?.vulnerability?.scanner?.reference
        )
      ) {
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
            href={`${CTI_CVE_LINK_BASE_PATH}${row.data.vulnerability.cve}`}
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
