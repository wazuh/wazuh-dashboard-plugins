/*
 * PROTOTYPE (issue #9672) — throwaway. Variant O: the design prototype's
 * compositions. Incident Response: KPI pair + coverage bar + gaps.
 * Case Management: tabbed case list.
 */
import React, { useState } from 'react';
import moment from 'moment';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
} from '../../../utils/navigation';
import {
  HOME_OVERVIEW_CHROME,
  HOME_OVERVIEW_COLOR,
  HOME_OVERVIEW_COLOR_TINT,
  HOME_OVERVIEW_TEXT_COLOR,
} from '../../../lib/theme-colors';
import { CARD_MIN_WIDTH, KPI_LINK_STYLE } from '../../../lib/constants';
import { StatTile } from '../../common';
import type { VariantProps } from './variants';
import type { ProtoCase } from './use-prototype-data';
import { Action, HalfHeader, Redirect, fmt, OPEN } from './variant-j';
import { GapList, pctColor, useCoverage } from './variants-klm';

/* ---------- Incident Response ---------- */

/** Centered KPI tiles split by hairlines, the Home KPI look. */
const KpiRow: React.FC<{
  items: Array<{
    value?: number;
    label: string;
    color?: string;
    href?: string;
  }>;
}> = ({ items }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
    }}
  >
    {items.map((i, n) => (
      <div
        key={i.label}
        style={{
          borderLeft: n ? HOME_OVERVIEW_CHROME.hairline : undefined,
          padding: '0 8px',
        }}
      >
        <StatTile
          reverse
          color={i.color}
          value={
            i.href ? (
              <Redirect>
                <EuiLink href={i.href} style={KPI_LINK_STYLE}>
                  {fmt(i.value)}
                </EuiLink>
              </Redirect>
            ) : (
              fmt(i.value)
            )
          }
          label={i.label}
        />
      </div>
    ))}
  </div>
);

const IrO: React.FC<VariantProps> = ({ ir }) => {
  const cov = useCoverage(ir);
  const pctFill = cov.total
    ? Math.min(cov.answered ?? 0, cov.total) / cov.total
    : 0;
  return (
    <EuiPanel paddingSize='m' hasBorder>
      <HalfHeader
        title='Incident Response'
        href={getActiveResponseUrl()}
        caption='Last 24 hours'
        actions={
          <Action href={getActiveResponseResponsesUrl()}>View responses</Action>
        }
      />
      {cov.ready && (
        <>
          <EuiSpacer size='m' />
          <KpiRow
            items={[
              {
                value: ir.data?.total,
                label: 'Responses triggered',
                href: getActiveResponseResponsesUrl(),
              },
              {
                value: cov.unanswered,
                label: 'Critical and high findings left unanswered',
                color: cov.unanswered
                  ? HOME_OVERVIEW_TEXT_COLOR.danger
                  : HOME_OVERVIEW_TEXT_COLOR.success,
              },
            ]}
          />
          <EuiSpacer size='m' />
          <EuiFlexGroup
            justifyContent='spaceBetween'
            alignItems='baseline'
            responsive={false}
            gutterSize='s'
          >
            <EuiFlexItem grow={false}>
              <EuiText size='xs'>
                <strong>Response coverage</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={`${fmt(cov.answered)} of ${fmt(
                  cov.total,
                )} critical and high findings got an active response`}
              >
                <EuiText size='xs'>
                  <strong
                    className='tab-num'
                    style={{ color: pctColor(cov.pct) }}
                  >
                    {fmt(cov.pct)}%
                  </strong>
                </EuiText>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
          <div
            role='img'
            aria-label={`Response coverage ${fmt(cov.pct)}%`}
            style={{
              marginTop: 6,
              height: 8,
              borderRadius: 8,
              overflow: 'hidden',
              background: cov.unanswered
                ? HOME_OVERVIEW_COLOR_TINT.danger
                : HOME_OVERVIEW_CHROME.trackBackground,
            }}
          >
            <div
              style={{
                width: `${pctFill * 100}%`,
                height: '100%',
                background: HOME_OVERVIEW_COLOR.success,
              }}
            />
          </div>
          <EuiSpacer size='l' />
          <GapList cov={cov} max={5} />
        </>
      )}
    </EuiPanel>
  );
};

/* ---------- Case Management ---------- */

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  completed: 'Completed',
};
const SEVERITY_COLOR: Record<string, string> = {
  critical: HOME_OVERVIEW_COLOR.danger,
  high: HOME_OVERVIEW_COLOR.warning,
  medium: HOME_OVERVIEW_COLOR.info,
  low: HOME_OVERVIEW_COLOR.success,
  informational: HOME_OVERVIEW_COLOR.subdued,
};

const CmO: React.FC<VariantProps> = ({ cases }) => {
  const c = cases.data;
  const s = c?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const [tab, setTab] = useState('attention');
  const url = (f: Parameters<typeof getCaseManagementCasesUrl>[0]) =>
    getCaseManagementCasesUrl(f, cases.indexPatternId);
  const openFilter = { field: 'wazuh.case.status', value: OPEN };
  const urgentFilter = { field: 'wazuh.case.priority', value: 'urgent' };
  const criticalFilter = { field: 'wazuh.case.severity', value: 'critical' };
  const completedFilter = { field: 'wazuh.case.status', value: 'completed' };
  const tabs = [
    {
      id: 'attention',
      label: 'Needs attention',
      filters: [openFilter],
      empty: 'No urgent or critical case is open.',
    },
    {
      id: 'open',
      label: 'All open',
      filters: [openFilter],
      empty: 'No open cases.',
    },
    {
      id: 'completed',
      label: 'Recently completed',
      filters: [completedFilter],
      empty: 'No completed cases.',
    },
  ];
  const current = tabs.find(t => t.id === tab) ?? tabs[0];
  const urgent = c?.openByPriority?.urgent;
  const critical = c?.openBySeverity?.critical;

  const columns: Array<EuiBasicTableColumn<ProtoCase>> = [
    {
      field: 'title',
      name: 'Case',
      render: (title: string | undefined, item: ProtoCase) => (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '8px minmax(0, 1fr)',
            columnGap: 10,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <EuiToolTip
            content={
              item.severity ? `${item.severity} severity` : 'No severity'
            }
          >
            <span
              aria-hidden='true'
              style={{
                display: 'block',
                width: 8,
                height: 8,
                borderRadius: 8,
                background:
                  SEVERITY_COLOR[item.severity ?? ''] ??
                  HOME_OVERVIEW_COLOR.disabled,
              }}
            />
          </EuiToolTip>
          <EuiText size='s' title={title} style={{ minWidth: 0 }}>
            <RedirectAppLinks
              application={getCore().application}
              className='eui-textTruncate'
            >
              <EuiLink
                href={url([{ field: '_id', value: item.id }])}
                style={{ fontWeight: 'normal' }}
              >
                {title ?? '-'}
              </EuiLink>
            </RedirectAppLinks>
          </EuiText>
          <span />
          <EuiText size='xs' color='subdued' className='eui-textTruncate'>
            {item.agent ?? '\u00a0'}
          </EuiText>
        </div>
      ),
    },
    {
      field: 'priority',
      name: 'Priority',
      width: '84px',
      render: (p?: string) => (
        <EuiText
          size='s'
          color={p ? undefined : 'subdued'}
          style={
            p === 'urgent'
              ? { color: HOME_OVERVIEW_TEXT_COLOR.danger }
              : undefined
          }
        >
          {PRIORITY_LABEL[p ?? ''] ?? '—'}
        </EuiText>
      ),
    },
    {
      field: 'status',
      name: 'Status',
      width: '128px',
      render: (v?: string) => (
        <EuiText size='s' style={{ whiteSpace: 'nowrap' }}>
          {STATUS_LABEL[v ?? ''] ?? v ?? '—'}
        </EuiText>
      ),
    },
    {
      field: 'updatedAt',
      name: 'Updated',
      width: '96px',
      align: 'right',
      render: (t?: string) => (
        <EuiToolTip content={t ? moment(t).format('lll') : ''}>
          <EuiText size='xs' color='subdued'>
            {t ? moment(t).fromNow() : '-'}
          </EuiText>
        </EuiToolTip>
      ),
    },
  ];

  return (
    <EuiPanel
      paddingSize='m'
      hasBorder
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <HalfHeader
        title='Case Management'
        href={getCaseManagementUrl()}
        caption='Current state'
        actions={null}
      />
      {c && !c.total ? (
        <EuiText size='s' color='subdued' style={{ marginTop: 16 }}>
          No cases yet. Open a finding and create one from its Case tab.
        </EuiText>
      ) : (
        c && (
          <>
            <EuiSpacer size='m' />
            <KpiRow
              items={[
                { value: open, label: 'Open', href: url([openFilter]) },
                {
                  value: urgent,
                  label: 'Urgent',
                  href: url([openFilter, urgentFilter]),
                  color: urgent ? HOME_OVERVIEW_TEXT_COLOR.danger : undefined,
                },
                {
                  value: critical,
                  label: 'Critical',
                  href: url([openFilter, criticalFilter]),
                  color: critical ? HOME_OVERVIEW_TEXT_COLOR.danger : undefined,
                },
                {
                  value: s.completed,
                  label: 'Completed',
                  href: url([completedFilter]),
                },
              ]}
            />
            <EuiSpacer size='m' />
            <EuiTabs size='s'>
              {tabs.map(t => (
                <EuiTab
                  key={t.id}
                  isSelected={t.id === tab}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  <span
                    className='tab-num'
                    style={{
                      marginLeft: 6,
                      fontWeight: 400,
                      color:
                        t.id === tab
                          ? 'inherit'
                          : 'var(--euiTextSubduedColor, #69707d)',
                    }}
                  >
                    {fmt(c.tabCounts?.[t.id])}
                  </span>
                </EuiTab>
              ))}
            </EuiTabs>
            <EuiBasicTable
              tableLayout='fixed'
              items={(c.tabs?.[tab] ?? []).slice(0, 3)}
              columns={columns}
              noItemsMessage={current.empty}
            />
            <EuiFlexGroup
              justifyContent='flexEnd'
              responsive={false}
              style={{ marginTop: 'auto', paddingTop: 12 }}
            >
              <EuiFlexItem grow={false}>
                <EuiText size='s'>
                  <Redirect>
                    <EuiLink
                      href={url(current.filters)}
                      style={{ fontWeight: 'normal' }}
                    >
                      View all cases
                    </EuiLink>
                  </Redirect>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )
      )}
    </EuiPanel>
  );
};

export const VariantO: React.FC<VariantProps> = props => (
  <EuiFlexGroup wrap responsive={false}>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <IrO {...props} />
    </EuiFlexItem>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <CmO {...props} />
    </EuiFlexItem>
  </EuiFlexGroup>
);
VariantO.displayName = 'Prototype compositions (KPI pair + case tabs)';
