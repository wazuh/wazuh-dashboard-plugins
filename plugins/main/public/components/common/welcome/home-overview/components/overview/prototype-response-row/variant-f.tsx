/*
 * PROTOTYPE (issue #9672) — throwaway. Variant F: D's single strip, filled with
 * the issue's indicators, built from the shared Home components.
 */
import React from 'react';
import moment from 'moment';
import useObservable from 'react-use/lib/useObservable';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiLink,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { getCore } from '../../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { BarList, SeverityDistributionBar } from '../../common';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
  getCreateActiveResponseUrl,
  isActiveResponsesRegistered,
} from '../../../utils/navigation';
import {
  HOME_OVERVIEW_CHROME,
  HOME_OVERVIEW_COLOR,
  HOME_OVERVIEW_TEXT_COLOR,
} from '../../../lib/theme-colors';
import type { VariantProps } from './variants';

const fmt = (n?: number) =>
  n === undefined ? '-' : new Intl.NumberFormat().format(n);
const NO_APPS: ReadonlyMap<string, unknown> = new Map();
const OPEN = ['active', 'acknowledged'];

const Redirect: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RedirectAppLinks application={getCore().application}>
    {children}
  </RedirectAppLinks>
);

/** Half header: linked title + caption left, quiet actions right. */
const HalfHeader: React.FC<{
  title: string;
  href: string;
  caption: string;
  actions: React.ReactNode;
}> = ({ title, href, caption, actions }) => (
  <EuiFlexGroup gutterSize='s' alignItems='flexStart' responsive={false}>
    <EuiFlexItem>
      <EuiTitle size='xxs'>
        <h3>
          <Redirect>
            <EuiLink href={href}>{title}</EuiLink>
          </Redirect>
        </h3>
      </EuiTitle>
      <EuiText size='xs' color='subdued'>
        {caption}
      </EuiText>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiFlexGroup gutterSize='xs' responsive={false}>
        {actions}
      </EuiFlexGroup>
    </EuiFlexItem>
  </EuiFlexGroup>
);

const Action: React.FC<{
  href: string;
  icon?: string;
  children: React.ReactNode;
}> = ({ href, icon, children }) => (
  <EuiFlexItem grow={false}>
    <Redirect>
      <EuiButtonEmpty size='xs' iconType={icon} href={href}>
        {children}
      </EuiButtonEmpty>
    </Redirect>
  </EuiFlexItem>
);

/** The hero number, same weight and size as the other Home KPIs. */
const Hero: React.FC<{ value?: number; label: string; href: string }> = ({
  value,
  label,
  href,
}) => (
  <div>
    <Redirect>
      <EuiLink
        href={href}
        style={{
          fontSize: 36,
          lineHeight: '44px',
          fontWeight: 300,
          color: HOME_OVERVIEW_TEXT_COLOR.info,
        }}
        className='tab-num'
      >
        {fmt(value)}
      </EuiLink>
    </Redirect>
    <EuiText size='s'>{label}</EuiText>
  </div>
);

const Sparkline: React.FC<{
  hourly: Array<{ time: number; count: number }>;
}> = ({ hourly }) => {
  const max = Math.max(1, ...hourly.map(h => h.count));
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          height: 28,
          marginTop: 12,
        }}
      >
        {hourly.map(h => (
          <div
            key={h.time}
            title={`${moment(h.time).format('HH:mm')}: ${fmt(h.count)}`}
            style={{
              flex: 1,
              height: `${Math.max(h.count ? 8 : 4, (h.count / max) * 100)}%`,
              background: h.count
                ? HOME_OVERVIEW_COLOR.info
                : HOME_OVERVIEW_CHROME.trackBackground,
              borderRadius: 1,
            }}
          />
        ))}
      </div>
      <EuiText size='xs' color='subdued' style={{ marginTop: 2 }}>
        Per hour
      </EuiText>
    </div>
  );
};

const Callout: React.FC<{
  color: string;
  value?: number;
  label: string;
  href: string;
}> = ({ color, value, label, href }) => (
  <EuiHealth color={value ? color : HOME_OVERVIEW_COLOR.disabled}>
    <EuiText size='s'>
      <Redirect>
        <EuiLink href={href} style={{ fontWeight: 'normal' }}>
          <strong className='tab-num'>{fmt(value)}</strong> {label}
        </EuiLink>
      </Redirect>
    </EuiText>
  </EuiHealth>
);

const STATUSES = [
  { key: 'active', label: 'Active' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'completed', label: 'Completed' },
];

export const VariantF: React.FC<VariantProps> = ({ ir, cases }) => {
  const apps = useObservable(getCore().application.applications$, NO_APPS);
  const d = ir.data;
  const c = cases.data;
  const s = c?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const url = (f: Parameters<typeof getCaseManagementCasesUrl>[0]) =>
    getCaseManagementCasesUrl(f, cases.indexPatternId);
  const openFilter = { field: 'wazuh.case.status', value: OPEN };

  const half: React.CSSProperties = {
    flex: '1 1 480px',
    minWidth: 0,
    padding: '0 8px',
  };
  const body: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(140px, 180px) minmax(0, 1fr)',
    gap: 24,
    marginTop: 16,
  };

  return (
    <EuiPanel paddingSize='m' hasBorder>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 24 }}>
        {/* Incident Response */}
        <div style={half}>
          <HalfHeader
            title='Incident Response'
            href={getActiveResponseUrl()}
            caption='Last 24 hours'
            actions={
              <>
                {isActiveResponsesRegistered(apps) && (
                  <Action
                    href={getCreateActiveResponseUrl()}
                    icon='plusInCircle'
                  >
                    Create
                  </Action>
                )}
                <Action href={getActiveResponseResponsesUrl()}>
                  View responses
                </Action>
              </>
            }
          />
          <div style={body}>
            <div>
              <Hero
                value={d?.total}
                label='active responses triggered'
                href={getActiveResponseResponsesUrl()}
              />
              {d && d.total > 0 && <Sparkline hourly={d.hourly} />}
            </div>
            <BarList
              title='Top 5 commands executed'
              items={d?.topCommands ?? []}
              emptyMessage='No active responses ran in this period'
              getHref={item =>
                getActiveResponseResponsesUrl(
                  {
                    field: 'wazuh.active_response.executable',
                    value: item.key,
                  },
                  ir.indexPatternId,
                )
              }
            />
          </div>
        </div>

        {/* Case Management */}
        <div
          style={{
            ...half,
            borderLeft: HOME_OVERVIEW_CHROME.hairline,
            paddingLeft: 24,
          }}
        >
          <HalfHeader
            title='Case Management'
            href={getCaseManagementUrl()}
            caption='Current state'
            actions={<Action href={url([openFilter])}>View open cases</Action>}
          />
          {c && !c.total ? (
            <EuiText size='s' color='subdued' style={{ marginTop: 24 }}>
              No cases yet. Open a finding and create one from its Case tab.
            </EuiText>
          ) : (
            <div style={body}>
              <div>
                <Hero
                  value={open}
                  label='open cases'
                  href={url([openFilter])}
                />
                <div style={{ display: 'grid', gap: 4, marginTop: 12 }}>
                  <Callout
                    color={HOME_OVERVIEW_COLOR.danger}
                    value={c?.openByPriority?.urgent}
                    label='urgent'
                    href={url([
                      openFilter,
                      { field: 'wazuh.case.priority', value: 'urgent' },
                    ])}
                  />
                  <Callout
                    color={HOME_OVERVIEW_COLOR.danger}
                    value={c?.openBySeverity?.critical}
                    label='critical'
                    href={url([
                      openFilter,
                      { field: 'wazuh.case.severity', value: 'critical' },
                    ])}
                  />
                </div>
              </div>
              <div>
                <EuiText size='xs'>
                  <strong>By status</strong>
                </EuiText>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    margin: '8px 0 16px',
                    borderTop: HOME_OVERVIEW_CHROME.hairline,
                  }}
                >
                  {STATUSES.map((st, i) => (
                    <div
                      key={st.key}
                      style={{
                        padding: '8px 0 0 12px',
                        borderLeft: i
                          ? HOME_OVERVIEW_CHROME.hairline
                          : undefined,
                        paddingLeft: i ? 12 : 0,
                      }}
                    >
                      <Redirect>
                        <EuiLink
                          href={url([
                            { field: 'wazuh.case.status', value: st.key },
                          ])}
                          style={{
                            fontSize: 20,
                            fontWeight: 400,
                            color: HOME_OVERVIEW_TEXT_COLOR.info,
                          }}
                          className='tab-num'
                        >
                          {fmt(s[st.key])}
                        </EuiLink>
                      </Redirect>
                      <EuiText size='xs' color='subdued'>
                        {st.label}
                      </EuiText>
                    </div>
                  ))}
                </div>
                <SeverityDistributionBar
                  counts={open ? (c?.openBySeverity as any) ?? {} : {}}
                  headline={
                    <EuiText size='xs'>
                      <strong>Open cases by severity</strong>
                    </EuiText>
                  }
                  onSelect={band =>
                    url([
                      openFilter,
                      { field: 'wazuh.case.severity', value: band },
                    ])
                  }
                  emptyMessage='No open cases'
                  testSubjPrefix='proto-open-cases-severity'
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </EuiPanel>
  );
};
VariantF.displayName = 'Strip with the issue indicators';
