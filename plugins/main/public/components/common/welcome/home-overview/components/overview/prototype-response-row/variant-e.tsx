/*
 * PROTOTYPE (issue #9672) — throwaway. Variant E: action-oriented cards, after
 * the design prototype's Incident Response and Case management cards, limited
 * to the fields the indices have.
 */
import React, { useState } from 'react';
import moment from 'moment';
import useObservable from 'react-use/lib/useObservable';
import {
  EuiBadge,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonEmpty,
  EuiCode,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiStat,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
  getCreateActiveResponseUrl,
  getThreatHuntingUrl,
  isActiveResponsesRegistered,
} from '../../../utils/navigation';
import { HOME_OVERVIEW_COLOR } from '../../../lib/theme-colors';
import { CARD_MIN_WIDTH } from '../../../lib/constants';
import type { VariantProps } from './variants';
import type { ProtoCase } from './use-prototype-data';

const fmt = (n?: number) =>
  n === undefined ? '-' : new Intl.NumberFormat().format(n);
const ago = (d?: string) => (d ? moment(d).fromNow() : '-');
const NO_APPS: ReadonlyMap<string, unknown> = new Map();

const SEVERITY: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: HOME_OVERVIEW_COLOR.danger },
  high: { label: 'High', color: HOME_OVERVIEW_COLOR.warning },
  medium: { label: 'Medium', color: HOME_OVERVIEW_COLOR.info },
  low: { label: 'Low', color: HOME_OVERVIEW_COLOR.success },
  informational: { label: 'Informational', color: HOME_OVERVIEW_COLOR.subdued },
};
const PRIORITY: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Urgent', color: 'danger' },
  high: { label: 'High', color: 'warning' },
  medium: { label: 'Medium', color: 'primary' },
  low: { label: 'Low', color: 'hollow' },
};
const STATUS: Record<string, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  completed: 'Completed',
};

const AppLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <RedirectAppLinks application={getCore().application}>
    <EuiLink href={href} style={{ fontWeight: 'normal' }}>
      {children}
    </EuiLink>
  </RedirectAppLinks>
);

const Header: React.FC<{
  title: string;
  href: string;
  caption: string;
  status?: React.ReactNode;
}> = ({ title, href, caption, status }) => (
  <EuiFlexGroup gutterSize='s' alignItems='flexStart' responsive={false}>
    <EuiFlexItem>
      <EuiTitle size='xxs'>
        <h3>
          <RedirectAppLinks application={getCore().application}>
            <EuiLink href={href}>{title}</EuiLink>
          </RedirectAppLinks>
        </h3>
      </EuiTitle>
      <EuiText size='xs' color='subdued'>
        {caption}
      </EuiText>
    </EuiFlexItem>
    {status && <EuiFlexItem grow={false}>{status}</EuiFlexItem>}
  </EuiFlexGroup>
);

const Stats: React.FC<{
  items: Array<{
    label: string;
    value?: number;
    href?: string;
    color?: string;
  }>;
}> = ({ items }) => (
  <EuiFlexGroup gutterSize='l' responsive={false} wrap>
    {items.map(i => (
      <EuiFlexItem key={i.label} grow={false} style={{ minWidth: 90 }}>
        <EuiStat
          titleSize='s'
          title={
            i.href ? (
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  href={i.href}
                  style={{ fontWeight: 'inherit', color: i.color ?? 'inherit' }}
                >
                  {fmt(i.value)}
                </EuiLink>
              </RedirectAppLinks>
            ) : (
              fmt(i.value)
            )
          }
          titleColor={i.color as any}
          description={i.label}
          reverse
        />
      </EuiFlexItem>
    ))}
  </EuiFlexGroup>
);

const Footer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <EuiSpacer size='s' />
    <EuiFlexGroup
      gutterSize='s'
      justifyContent='spaceBetween'
      alignItems='center'
      responsive={false}
      style={{ marginTop: 'auto' }}
    >
      {children}
    </EuiFlexGroup>
  </>
);

/* ---------------- Incident Response ---------------- */

const IncidentResponse: React.FC<Pick<VariantProps, 'ir' | 'findings'>> = ({
  ir,
}) => {
  const apps = useObservable(getCore().application.applications$, NO_APPS);
  const d = ir.data;
  type Row = NonNullable<typeof d>['latest'][number];
  const columns: Array<EuiBasicTableColumn<Row>> = [
    {
      field: 'time',
      name: 'When',
      width: '100px',
      render: (t: string) => (
        <EuiToolTip content={moment(t).format('lll')}>
          <span>{ago(t)}</span>
        </EuiToolTip>
      ),
    },
    {
      field: 'command',
      name: 'Command',
      width: '130px',
      render: (c?: string) =>
        c ? (
          <AppLink
            href={getActiveResponseResponsesUrl(
              { field: 'wazuh.active_response.executable', value: c },
              ir.indexPatternId,
            )}
          >
            <EuiCode transparentBackground>{c}</EuiCode>
          </AppLink>
        ) : (
          '-'
        ),
    },
    {
      field: 'agent',
      name: 'Agent',
      width: '140px',
      truncateText: true,
      render: (a?: string) =>
        a ? (
          <AppLink
            href={getActiveResponseResponsesUrl(
              { field: 'wazuh.agent.name', value: a },
              ir.indexPatternId,
            )}
          >
            {a}
          </AppLink>
        ) : (
          '-'
        ),
    },
    {
      field: 'rule',
      name: 'Triggered by',
      truncateText: true,
      render: (r?: string) => (
        <span className='eui-textTruncate' title={r}>
          {r ?? '-'}
        </span>
      ),
    },
  ];
  return (
    <EuiPanel
      paddingSize='m'
      hasBorder
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Header
        title='Incident Response'
        href={getActiveResponseUrl()}
        caption='Last 24 hours'
        status={
          d && (
            <EuiHealth color={d.total ? 'success' : 'subdued'}>
              {d.total ? 'Responding' : 'No active response ran'}
            </EuiHealth>
          )
        }
      />
      <EuiSpacer size='m' />
      <Stats
        items={[
          {
            label: 'Responses triggered',
            value: d?.total,
            href: getActiveResponseResponsesUrl(),
          },
          { label: 'Agents involved', value: d?.agentsCount },
          { label: 'Distinct commands', value: d?.commandsCount },
        ]}
      />
      <EuiSpacer size='m' />
      <EuiText size='xs'>
        <strong>Latest responses</strong>
      </EuiText>
      <EuiBasicTable
        compressed
        tableLayout='fixed'
        items={d?.latest ?? []}
        columns={columns}
        loading={!d}
        noItemsMessage='No active responses ran in the last 24 hours. Responses run when a rule they are bound to fires.'
      />
      <Footer>
        <EuiFlexItem grow={false}>
          <RedirectAppLinks application={getCore().application}>
            <EuiButtonEmpty
              size='s'
              flush='left'
              href={getActiveResponseResponsesUrl()}
            >
              View all responses
            </EuiButtonEmpty>
          </RedirectAppLinks>
        </EuiFlexItem>
        {isActiveResponsesRegistered(apps) && (
          <EuiFlexItem grow={false}>
            <RedirectAppLinks application={getCore().application}>
              <EuiButton
                size='s'
                iconType='plusInCircle'
                href={getCreateActiveResponseUrl()}
              >
                Create active response
              </EuiButton>
            </RedirectAppLinks>
          </EuiFlexItem>
        )}
      </Footer>
    </EuiPanel>
  );
};

/* ---------------- Case Management ---------------- */

const CaseManagement: React.FC<Pick<VariantProps, 'cases'>> = ({ cases }) => {
  const d = cases.data;
  const s = d?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const tabs = [
    { id: 'open', label: 'Open', count: open },
    { id: 'urgent', label: 'Urgent', count: d?.openByPriority?.urgent },
    { id: 'critical', label: 'Critical', count: d?.openBySeverity?.critical },
    { id: 'completed', label: 'Completed', count: s.completed },
  ];
  const [tab, setTab] = useState('open');
  const url = (filters: Parameters<typeof getCaseManagementCasesUrl>[0]) =>
    getCaseManagementCasesUrl(filters, cases.indexPatternId);
  const columns: Array<EuiBasicTableColumn<ProtoCase>> = [
    {
      field: 'priority',
      name: 'Priority',
      width: '90px',
      render: (p?: string) =>
        p && PRIORITY[p] ? (
          <EuiBadge color={PRIORITY[p].color}>{PRIORITY[p].label}</EuiBadge>
        ) : (
          <EuiText size='xs' color='subdued'>
            None
          </EuiText>
        ),
    },
    {
      field: 'title',
      name: 'Case',
      truncateText: true,
      render: (t: string | undefined, c: ProtoCase) => (
        <span className='eui-textTruncate' title={t}>
          <AppLink href={url([{ field: '_id', value: c.id }])}>
            {t ?? '-'}
          </AppLink>
        </span>
      ),
    },
    {
      field: 'severity',
      name: 'Severity',
      width: '115px',
      render: (v?: string) =>
        v && SEVERITY[v] ? (
          <EuiHealth color={SEVERITY[v].color}>{SEVERITY[v].label}</EuiHealth>
        ) : (
          '-'
        ),
    },
    {
      field: 'status',
      name: 'Status',
      width: '110px',
      render: (v?: string) => STATUS[v ?? ''] ?? v ?? '-',
    },
    {
      field: 'updatedAt',
      name: 'Updated',
      width: '100px',
      render: (t?: string) => (
        <EuiToolTip content={t ? moment(t).format('lll') : ''}>
          <span>{ago(t)}</span>
        </EuiToolTip>
      ),
    },
  ];
  const tabFilters: Record<
    string,
    Parameters<typeof getCaseManagementCasesUrl>[0]
  > = {
    open: [{ field: 'wazuh.case.status', value: ['active', 'acknowledged'] }],
    urgent: [
      { field: 'wazuh.case.status', value: ['active', 'acknowledged'] },
      { field: 'wazuh.case.priority', value: 'urgent' },
    ],
    critical: [
      { field: 'wazuh.case.status', value: ['active', 'acknowledged'] },
      { field: 'wazuh.case.severity', value: 'critical' },
    ],
    completed: [{ field: 'wazuh.case.status', value: 'completed' }],
  };
  return (
    <EuiPanel
      paddingSize='m'
      hasBorder
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Header
        title='Case Management'
        href={getCaseManagementUrl()}
        caption='Current state'
        status={
          d && (
            <EuiHealth
              color={
                (d.openByPriority?.urgent ?? 0) > 0
                  ? 'danger'
                  : open
                  ? 'warning'
                  : 'success'
              }
            >
              {(d.openByPriority?.urgent ?? 0) > 0
                ? `${fmt(d.openByPriority.urgent)} urgent open`
                : open
                ? `${fmt(open)} open`
                : 'Nothing open'}
            </EuiHealth>
          )
        }
      />
      <EuiSpacer size='m' />
      <Stats
        items={[
          {
            label: 'Active',
            value: s.active,
            href: url([{ field: 'wazuh.case.status', value: 'active' }]),
          },
          {
            label: 'Acknowledged',
            value: s.acknowledged,
            href: url([{ field: 'wazuh.case.status', value: 'acknowledged' }]),
          },
          {
            label: 'Completed',
            value: s.completed,
            href: url([{ field: 'wazuh.case.status', value: 'completed' }]),
          },
        ]}
      />
      <EuiSpacer size='s' />
      <EuiTabs size='s'>
        {tabs.map(t => (
          <EuiTab
            key={t.id}
            isSelected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}{' '}
            <EuiBadge color={tab === t.id ? 'primary' : 'hollow'}>
              {fmt(t.count)}
            </EuiBadge>
          </EuiTab>
        ))}
      </EuiTabs>
      <EuiBasicTable
        compressed
        tableLayout='fixed'
        items={d?.tabs?.[tab] ?? []}
        columns={columns}
        loading={!d}
        noItemsMessage={
          d?.total
            ? 'No cases here.'
            : 'No cases yet. Open a finding and create one from its Case tab.'
        }
      />
      <Footer>
        <EuiFlexItem grow={false}>
          <RedirectAppLinks application={getCore().application}>
            <EuiButtonEmpty size='s' flush='left' href={url(tabFilters[tab])}>
              View all {tabs.find(t => t.id === tab)?.label.toLowerCase()} cases
            </EuiButtonEmpty>
          </RedirectAppLinks>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip content='Cases start from a finding: open it and use its Case tab.'>
            <RedirectAppLinks application={getCore().application}>
              <EuiButton
                size='s'
                iconType='plusInCircle'
                href={getThreatHuntingUrl()}
              >
                New case from a finding
              </EuiButton>
            </RedirectAppLinks>
          </EuiToolTip>
        </EuiFlexItem>
      </Footer>
    </EuiPanel>
  );
};

export const VariantE: React.FC<VariantProps> = ({ ir, cases, findings }) => (
  <EuiFlexGroup wrap responsive={false}>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <IncidentResponse ir={ir} findings={findings} />
    </EuiFlexItem>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <CaseManagement cases={cases} />
    </EuiFlexItem>
  </EuiFlexGroup>
);
VariantE.displayName = 'Action cards (from the design prototype)';
