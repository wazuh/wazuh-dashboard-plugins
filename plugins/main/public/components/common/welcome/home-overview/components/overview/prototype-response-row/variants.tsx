/*
 * PROTOTYPE (issue #9672) — throwaway. See use-prototype-data.ts.
 */
import React from 'react';
import moment from 'moment';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { IncidentResponseCard } from '../incident-response-card';
import { CaseManagementCard } from '../case-management-card';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
  getDiscoverFindingsBySeverityUrl,
  getThreatHuntingUrl,
} from '../../../utils/navigation';
import {
  HOME_OVERVIEW_CHROME,
  HOME_OVERVIEW_COLOR,
} from '../../../lib/theme-colors';
import { CARD_MIN_WIDTH } from '../../../lib/constants';
import {
  ProtoCase,
  ProtoCases,
  ProtoIncidentResponse,
} from './use-prototype-data';
import { VariantF } from './variant-f';
import { VariantG } from './variant-g';
import { VariantH } from './variant-h';
import { VariantI } from './variant-i';
import { VariantJ } from './variant-j';
import { VariantK, VariantL, VariantM, VariantN } from './variants-klm';
import { VariantO } from './variant-o';

export interface VariantProps {
  ir: { data?: ProtoIncidentResponse; indexPatternId?: string };
  cases: { data?: ProtoCases; indexPatternId?: string };
  /** The real cards' hook results, for variant A. */
  current: { incidentResponse: any; cases: any };
  findings: {
    data?: { severity: Record<string, number | undefined> };
    indexPatternId?: string;
  };
}

const fmt = (n?: number) =>
  n === undefined ? '-' : new Intl.NumberFormat().format(n);

const SEVERITY_COLOR: Record<string, string> = {
  critical: HOME_OVERVIEW_COLOR.danger,
  high: HOME_OVERVIEW_COLOR.warning,
  medium: HOME_OVERVIEW_COLOR.info,
  low: HOME_OVERVIEW_COLOR.success,
  informational: HOME_OVERVIEW_COLOR.subdued,
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  completed: 'Completed',
};
const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const OPEN = ['active', 'acknowledged'];

const Link: React.FC<{
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ href, children, style }) => (
  <RedirectAppLinks application={getCore().application}>
    <EuiLink href={href} style={{ fontWeight: 'inherit', ...style }}>
      {children}
    </EuiLink>
  </RedirectAppLinks>
);

const CardTitle: React.FC<{
  title: string;
  href: string;
  caption: string;
  right?: React.ReactNode;
}> = ({ title, href, caption, right }) => (
  <EuiFlexGroup gutterSize='s' alignItems='flexStart' responsive={false}>
    <EuiFlexItem>
      <EuiTitle size='xxs'>
        <h3>
          <Link href={href}>{title}</Link>
        </h3>
      </EuiTitle>
      <EuiText size='xs' color='subdued'>
        {caption}
      </EuiText>
    </EuiFlexItem>
    {right && <EuiFlexItem grow={false}>{right}</EuiFlexItem>}
  </EuiFlexGroup>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <EuiText size='s' color='subdued' textAlign='center' style={{ padding: 24 }}>
    {text}
  </EuiText>
);

/* ---------- shared bits ---------- */

const HourlyBars: React.FC<{
  hourly: ProtoIncidentResponse['hourly'];
  height?: number;
}> = ({ hourly, height = 64 }) => {
  const max = Math.max(1, ...hourly.map(h => h.count));
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}
      aria-label='Active responses per hour'
    >
      {hourly.map(h => (
        <div
          key={h.time}
          title={`${moment(h.time).format('HH:mm')}: ${fmt(h.count)}`}
          style={{
            flex: 1,
            height: `${Math.max(h.count ? 4 : 1, (h.count / max) * 100)}%`,
            background: h.count
              ? HOME_OVERVIEW_COLOR.info
              : HOME_OVERVIEW_CHROME.trackBackground,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};

const SegmentBar: React.FC<{
  parts: Array<{ key: string; value: number; color: string }>;
  height?: number;
}> = ({ parts, height = 8 }) => {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div
      style={{
        display: 'flex',
        height,
        borderRadius: height,
        overflow: 'hidden',
        background: HOME_OVERVIEW_CHROME.trackBackground,
      }}
    >
      {total > 0 &&
        parts
          .filter(p => p.value > 0)
          .map(p => (
            <div
              key={p.key}
              style={{
                width: `${(p.value / total) * 100}%`,
                background: p.color,
              }}
            />
          ))}
    </div>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    aria-hidden='true'
    style={{
      display: 'inline-block',
      width: 8,
      height: 8,
      borderRadius: 8,
      background: color,
      flexShrink: 0,
    }}
  />
);

const casesUrl = (
  filters: Parameters<typeof getCaseManagementCasesUrl>[0],
  id?: string,
) => getCaseManagementCasesUrl(filters, id);

/* ---------- A: current ---------- */

export const VariantA: React.FC<VariantProps> = ({ current }) => (
  <EuiFlexGroup wrap responsive={false}>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <IncidentResponseCard incidentResponse={current.incidentResponse} />
    </EuiFlexItem>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <CaseManagementCard cases={current.cases} />
    </EuiFlexItem>
  </EuiFlexGroup>
);
VariantA.displayName = 'Current: two KPI cards';

/* ---------- B: activity + queue ---------- */

const QueueRow: React.FC<{ c: ProtoCase; indexPatternId?: string }> = ({
  c,
  indexPatternId,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '8px minmax(0,1fr) auto auto',
      gap: 10,
      alignItems: 'center',
      padding: '7px 0',
      borderTop: HOME_OVERVIEW_CHROME.hairline,
    }}
  >
    <EuiToolTip content={`Severity: ${c.severity ?? '-'}`}>
      <Dot
        color={SEVERITY_COLOR[c.severity ?? ''] ?? HOME_OVERVIEW_COLOR.disabled}
      />
    </EuiToolTip>
    <span className='eui-textTruncate' title={c.title}>
      <Link
        href={casesUrl([{ field: '_id', value: c.id }], indexPatternId)}
        style={{ fontWeight: 'normal' }}
      >
        {c.title ?? '-'}
      </Link>
    </span>
    <EuiText size='xs' color='subdued'>
      {[PRIORITY_LABEL[c.priority ?? ''], STATUS_LABEL[c.status ?? '']]
        .filter(Boolean)
        .join(' · ')}
    </EuiText>
    <EuiText
      size='xs'
      color='subdued'
      style={{ minWidth: 80, textAlign: 'right' }}
    >
      {c.updatedAt ? moment(c.updatedAt).fromNow() : '-'}
    </EuiText>
  </div>
);

export const VariantB: React.FC<VariantProps> = ({ ir, cases }) => {
  const s = cases.data?.byStatus ?? {};
  return (
    <EuiFlexGroup wrap responsive={false}>
      <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
        <EuiPanel paddingSize='m' hasBorder>
          <CardTitle
            title='Incident Response'
            href={getActiveResponseUrl()}
            caption='Last 24 hours'
            right={
              <EuiText size='s' textAlign='right'>
                <Link href={getActiveResponseResponsesUrl()}>
                  <strong style={{ fontSize: 22 }}>
                    {fmt(ir.data?.total)}
                  </strong>
                </Link>
                <div>
                  <EuiText size='xs' color='subdued'>
                    active responses
                  </EuiText>
                </div>
              </EuiText>
            }
          />
          {ir.data && ir.data.total > 0 ? (
            <>
              <div style={{ marginTop: 16 }}>
                <HourlyBars hourly={ir.data.hourly} height={72} />
                <EuiFlexGroup
                  justifyContent='spaceBetween'
                  responsive={false}
                  style={{ marginTop: 4 }}
                >
                  <EuiText size='xs' color='subdued'>
                    24 h ago
                  </EuiText>
                  <EuiText size='xs' color='subdued'>
                    now
                  </EuiText>
                </EuiFlexGroup>
              </div>
              <EuiText size='xs' style={{ marginTop: 14, marginBottom: 6 }}>
                <strong>Commands run</strong>
              </EuiText>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ir.data.topCommands.map(c => (
                  <Link
                    key={c.key}
                    href={getActiveResponseResponsesUrl(
                      {
                        field: 'wazuh.active_response.executable',
                        value: c.key,
                      },
                      ir.indexPatternId,
                    )}
                    style={{ fontWeight: 'normal' }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        gap: 6,
                        padding: '2px 8px',
                        border: HOME_OVERVIEW_CHROME.hairline,
                        borderRadius: 12,
                      }}
                    >
                      <code style={{ background: 'none' }}>{c.key}</code>
                      <strong>{fmt(c.count)}</strong>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <Empty text='No active responses ran in the last 24 hours' />
          )}
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
        <EuiPanel paddingSize='m' hasBorder>
          <CardTitle
            title='Case Management'
            href={getCaseManagementUrl()}
            caption='Current state'
          />
          {cases.data && cases.data.total > 0 ? (
            <>
              {/* status as a pipeline */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 14,
                }}
              >
                {['active', 'acknowledged', 'completed'].map((k, i) => (
                  <React.Fragment key={k}>
                    {i > 0 && <EuiIcon type='arrowRight' color='subdued' />}
                    <Link
                      href={casesUrl(
                        [{ field: 'wazuh.case.status', value: k }],
                        cases.indexPatternId,
                      )}
                      style={{ flex: 1, fontWeight: 'normal' }}
                    >
                      <div
                        style={{
                          padding: '6px 10px',
                          border: HOME_OVERVIEW_CHROME.hairline,
                          borderRadius: 4,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 20, fontWeight: 600 }}>
                          {fmt(s[k])}
                        </div>
                        <EuiText size='xs' color='subdued'>
                          {STATUS_LABEL[k]}
                        </EuiText>
                      </div>
                    </Link>
                  </React.Fragment>
                ))}
              </div>
              <EuiText size='xs' style={{ marginTop: 14, marginBottom: 2 }}>
                <strong>Latest open cases</strong>
              </EuiText>
              {cases.data.latestOpen.length ? (
                cases.data.latestOpen.map(c => (
                  <QueueRow
                    key={c.id}
                    c={c}
                    indexPatternId={cases.indexPatternId}
                  />
                ))
              ) : (
                <Empty text='No open cases' />
              )}
            </>
          ) : (
            <Empty text='No cases yet. Open a finding and create one from its Case tab.' />
          )}
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
VariantB.displayName = 'Activity + case queue';

/* ---------- C: detect → respond → resolve ---------- */

const Stage: React.FC<{
  label: string;
  value?: number;
  href: string;
  detail: React.ReactNode;
  bar: React.ReactNode;
}> = ({ label, value, href, detail, bar }) => (
  <div style={{ flex: '1 1 180px', minWidth: 0 }}>
    <EuiText
      size='xs'
      color='subdued'
      style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
    >
      {label}
    </EuiText>
    <Link href={href}>
      <div style={{ fontSize: 28, fontWeight: 300, lineHeight: 1.3 }}>
        {fmt(value)}
      </div>
    </Link>
    <div style={{ margin: '6px 0' }}>{bar}</div>
    <EuiText size='xs' color='subdued'>
      {detail}
    </EuiText>
  </div>
);

const Arrow = () => (
  <div style={{ alignSelf: 'center', padding: '0 4px' }}>
    <EuiIcon type='sortRight' color='subdued' size='l' />
  </div>
);

export const VariantC: React.FC<VariantProps> = ({ ir, cases, findings }) => {
  const sev = findings.data?.severity ?? {};
  const serious = (sev.critical ?? 0) + (sev.high ?? 0);
  const s = cases.data?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const p = cases.data?.openByPriority ?? {};
  const top = ir.data?.topCommands?.[0];
  return (
    <EuiPanel paddingSize='m' hasBorder>
      <CardTitle
        title='Response'
        href={getActiveResponseUrl()}
        caption='From detection to resolution · findings and responses: last 24 hours · cases: current state'
      />
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}
      >
        <Stage
          label='Detected'
          value={serious}
          href={getDiscoverFindingsBySeverityUrl(
            'critical',
            findings.indexPatternId,
          )}
          bar={
            <SegmentBar
              parts={[
                {
                  key: 'c',
                  value: sev.critical ?? 0,
                  color: HOME_OVERVIEW_COLOR.danger,
                },
                {
                  key: 'h',
                  value: sev.high ?? 0,
                  color: HOME_OVERVIEW_COLOR.warning,
                },
              ]}
            />
          }
          detail={`${fmt(sev.critical)} critical · ${fmt(
            sev.high,
          )} high findings`}
        />
        <Arrow />
        <Stage
          label='Responded'
          value={ir.data?.total}
          href={getActiveResponseResponsesUrl()}
          bar={<HourlyBars hourly={ir.data?.hourly ?? []} height={8} />}
          detail={
            top ? (
              <>
                Most run: <code>{top.key}</code> ({fmt(top.count)})
              </>
            ) : (
              'No active responses'
            )
          }
        />
        <Arrow />
        <Stage
          label='Investigating'
          value={open}
          href={casesUrl(
            [{ field: 'wazuh.case.status', value: OPEN }],
            cases.indexPatternId,
          )}
          bar={
            <SegmentBar
              parts={[
                {
                  key: 'a',
                  value: s.active ?? 0,
                  color: HOME_OVERVIEW_COLOR.info,
                },
                {
                  key: 'k',
                  value: s.acknowledged ?? 0,
                  color: HOME_OVERVIEW_COLOR.warning,
                },
              ]}
            />
          }
          detail={`${fmt(s.active)} active · ${fmt(
            s.acknowledged,
          )} acknowledged · ${fmt(p.urgent)} urgent`}
        />
        <Arrow />
        <Stage
          label='Resolved'
          value={s.completed}
          href={casesUrl(
            [{ field: 'wazuh.case.status', value: 'completed' }],
            cases.indexPatternId,
          )}
          bar={
            <SegmentBar
              parts={[
                {
                  key: 'done',
                  value: s.completed ?? 0,
                  color: HOME_OVERVIEW_COLOR.success,
                },
                {
                  key: 'open',
                  value: open,
                  color: HOME_OVERVIEW_CHROME.trackBackground,
                },
              ]}
            />
          }
          detail={`${fmt(s.completed)} of ${fmt(
            (s.completed ?? 0) + open,
          )} cases completed`}
        />
      </div>
    </EuiPanel>
  );
};
VariantC.displayName = 'Detect → respond → resolve';

/* ---------- D: compact strip ---------- */

export const VariantD: React.FC<VariantProps> = ({ ir, cases }) => {
  const s = cases.data?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const sev = cases.data?.openBySeverity ?? {};
  const p = cases.data?.openByPriority ?? {};
  const half: React.CSSProperties = {
    flex: '1 1 420px',
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0,1fr)',
    gap: 16,
    alignItems: 'center',
    padding: '4px 8px',
  };
  return (
    <EuiPanel paddingSize='m' hasBorder>
      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: 16 }}>
        <div style={half}>
          <div>
            <EuiText size='xs'>
              <Link href={getActiveResponseUrl()}>
                <strong>Incident Response</strong>
              </Link>
            </EuiText>
            <Link href={getActiveResponseResponsesUrl()}>
              <div style={{ fontSize: 28, fontWeight: 300 }}>
                {fmt(ir.data?.total)}
              </div>
            </Link>
            <EuiText size='xs' color='subdued'>
              responses, 24 h
            </EuiText>
          </div>
          <div>
            <HourlyBars hourly={ir.data?.hourly ?? []} height={40} />
            <EuiText size='xs' color='subdued' style={{ marginTop: 6 }}>
              {(ir.data?.topCommands ?? []).slice(0, 3).map((c, i) => (
                <React.Fragment key={c.key}>
                  {i > 0 && ' · '}
                  <code>{c.key}</code> {fmt(c.count)}
                </React.Fragment>
              ))}
            </EuiText>
          </div>
        </div>
        <div
          style={{
            ...half,
            borderLeft: HOME_OVERVIEW_CHROME.hairline,
            paddingLeft: 24,
          }}
        >
          <div>
            <EuiText size='xs'>
              <Link href={getCaseManagementUrl()}>
                <strong>Case Management</strong>
              </Link>
            </EuiText>
            <Link
              href={casesUrl(
                [{ field: 'wazuh.case.status', value: OPEN }],
                cases.indexPatternId,
              )}
            >
              <div style={{ fontSize: 28, fontWeight: 300 }}>{fmt(open)}</div>
            </Link>
            <EuiText size='xs' color='subdued'>
              open cases
            </EuiText>
          </div>
          <div>
            <SegmentBar
              height={10}
              parts={['critical', 'high', 'medium', 'low', 'informational'].map(
                k => ({
                  key: k,
                  value: sev[k] ?? 0,
                  color: SEVERITY_COLOR[k],
                }),
              )}
            />
            <EuiText size='xs' color='subdued' style={{ marginTop: 6 }}>
              <span style={{ color: HOME_OVERVIEW_COLOR.danger }}>●</span>{' '}
              {fmt(sev.critical)} critical · {fmt(p.urgent)} urgent ·{' '}
              {fmt(s.active)} active · {fmt(s.acknowledged)} acknowledged ·{' '}
              {fmt(s.completed)} completed
            </EuiText>
          </div>
        </div>
      </div>
    </EuiPanel>
  );
};
VariantD.displayName = 'Compact strip';

// Kept: A (current), J (chosen layout). K, L, M: Incident Response insight variants.
export const VARIANTS: Record<string, React.FC<VariantProps>> = {
  A: VariantA,
  J: VariantJ,
  K: VariantK,
  L: VariantL,
  M: VariantM,
  N: VariantN,
  O: VariantO,
};
