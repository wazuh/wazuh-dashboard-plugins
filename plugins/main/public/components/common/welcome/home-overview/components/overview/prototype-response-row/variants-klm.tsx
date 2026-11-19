/*
 * PROTOTYPE (issue #9672) — throwaway. Variants K, L, M: Incident Response
 * built on coverage and gaps, after the design prototype. Case Management is
 * J's card in all three.
 *
 * Data: active responses store the finding they answered (event.doc_id), so
 *  - answered = distinct critical/high findings with a response (AR search),
 *  - total    = critical/high findings, last 24 h (findings search),
 *  - gaps     = top critical/high rules with no response (rule titles diff).
 */
import React from 'react';
import rison from 'rison-node';
import useObservable from 'react-use/lib/useObservable';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIconTip,
  EuiLink,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import NavigationService from '../../../../../../../react-services/navigation-service';
import { threatHunting } from '../../../../../../../utils/applications';
import { BarList, StatTile, StatTileGroup } from '../../common';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCreateActiveResponseUrl,
  isActiveResponsesRegistered,
} from '../../../utils/navigation';
import {
  HOME_OVERVIEW_CHROME,
  HOME_OVERVIEW_COLOR,
  HOME_OVERVIEW_TEXT_COLOR,
} from '../../../lib/theme-colors';
import { KPI_LINK_STYLE } from '../../../lib/constants';
import type { VariantProps } from './variants';
import {
  VariantJ,
  Action,
  HalfHeader,
  Redirect,
  fmt,
  NO_APPS,
  OPEN,
} from './variant-j';
import {
  ProtoCase,
  ProtoSeriousRule,
  usePrototypeSeriousFindings,
} from './use-prototype-data';
import moment from 'moment';
import { SeverityDistributionBar } from '../../common';
import {
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
} from '../../../utils/navigation';
import { CARD_MIN_WIDTH } from '../../../lib/constants';

/* ---------- shared ---------- */

const LEVEL_COLOR: Record<string, string> = {
  critical: HOME_OVERVIEW_COLOR.danger,
  high: HOME_OVERVIEW_COLOR.warning,
};

const findingsByRuleUrl = (title: string) =>
  NavigationService.getInstance().getUrlForApp(threatHunting.id, {
    path: `#overview/?tab=general&tabView=findings&_a=${rison.encode({
      filters: [],
      query: {
        language: 'kuery',
        query: `wazuh.rule.title:"${title.replace(/"/g, '\\"')}"`,
      },
    })}&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))`,
  });

export function useCoverage(ir: VariantProps['ir']) {
  const serious = usePrototypeSeriousFindings();
  const apps = useObservable(getCore().application.applications$, NO_APPS);
  const total = serious.data
    ? serious.data.total.critical + serious.data.total.high
    : undefined;
  const answered = ir.data
    ? ir.data.answered.critical + ir.data.answered.high
    : undefined;
  const responded = new Set(ir.data?.respondedRules ?? []);
  const gaps: ProtoSeriousRule[] = (serious.data?.rules ?? []).filter(
    r => !responded.has(r.title),
  );
  const gapFindings = gaps.reduce((n, r) => n + r.count, 0);
  const pct =
    total && answered !== undefined
      ? Math.round((Math.min(answered, total) / total) * 100)
      : undefined;
  return {
    ready: Boolean(serious.data && ir.data),
    total,
    answered,
    unanswered:
      total !== undefined && answered !== undefined
        ? Math.max(total - answered, 0)
        : undefined,
    pct,
    gaps,
    gapFindings,
    perLevel: {
      critical: {
        total: serious.data?.total.critical ?? 0,
        answered: ir.data?.answered.critical ?? 0,
      },
      high: {
        total: serious.data?.total.high ?? 0,
        answered: ir.data?.answered.high ?? 0,
      },
    },
    canCreate: isActiveResponsesRegistered(apps),
  };
}

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  right?: React.ReactNode;
}> = ({ children, right }) => (
  <EuiFlexGroup
    justifyContent='spaceBetween'
    alignItems='center'
    responsive={false}
    gutterSize='s'
  >
    <EuiFlexItem grow={false}>
      <EuiText size='xs'>
        <strong
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          {children}
        </strong>
      </EuiText>
    </EuiFlexItem>
    {right && <EuiFlexItem grow={false}>{right}</EuiFlexItem>}
  </EuiFlexGroup>
);

/** One rule with no response: severity dot, title (→ findings), count, action. */
const GapRow: React.FC<{
  rule: ProtoSeriousRule;
  canCreate: boolean;
  first?: boolean;
}> = ({ rule, canCreate, first }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '8px minmax(0, 1fr) auto',
      gap: 12,
      alignItems: 'center',
      padding: '6px 0',
      borderTop: first ? HOME_OVERVIEW_CHROME.hairline : undefined,
      borderBottom: HOME_OVERVIEW_CHROME.hairline,
    }}
  >
    <span
      aria-hidden='true'
      style={{
        width: 8,
        height: 8,
        borderRadius: 8,
        background: LEVEL_COLOR[rule.level] ?? HOME_OVERVIEW_COLOR.warning,
      }}
    />
    <EuiText size='s' title={rule.title} style={{ minWidth: 0 }}>
      <RedirectAppLinks
        application={getCore().application}
        className='eui-textTruncate'
      >
        <EuiLink
          href={findingsByRuleUrl(rule.title)}
          style={{ fontWeight: 'normal' }}
        >
          {rule.title}
        </EuiLink>
      </RedirectAppLinks>
    </EuiText>
    <EuiText size='xs' color='subdued' className='tab-num'>
      {fmt(rule.count)} {rule.count === 1 ? 'finding' : 'findings'}
    </EuiText>
  </div>
);

export const GapList: React.FC<{
  cov: ReturnType<typeof useCoverage>;
  max: number;
  title?: string;
}> = ({ cov, max, title = 'Needs a response' }) => (
  <>
    <SectionTitle
      right={
        cov.canCreate && cov.gaps.length ? (
          <Redirect>
            <EuiButtonEmpty
              size='xs'
              flush='right'
              iconType='plusInCircle'
              href={getCreateActiveResponseUrl()}
            >
              Create active response
            </EuiButtonEmpty>
          </Redirect>
        ) : undefined
      }
    >
      {title}
      <EuiIconTip
        type='iInCircle'
        color='subdued'
        size='s'
        content='Rules behind critical and high findings with no active response in the last 24 hours.'
      />
      {cov.gaps.length > max && (
        <span
          style={{
            fontWeight: 'normal',
            color: 'var(--euiTextSubduedColor, #69707d)',
          }}
        >
          · {cov.gaps.length - max} more
        </span>
      )}
    </SectionTitle>
    <EuiSpacer size='xs' />
    {cov.gaps.length ? (
      cov.gaps
        .slice(0, max)
        .map((r, i) => (
          <GapRow
            key={r.title}
            rule={r}
            canCreate={cov.canCreate}
            first={i === 0}
          />
        ))
    ) : (
      <EuiText size='s' color='subdued'>
        Every rule behind a critical or high finding got a response.
      </EuiText>
    )}
  </>
);

/** Answered vs unanswered bar, colored by what is left. */
export const CoverageBar: React.FC<{
  answered: number;
  total: number;
  height?: number;
}> = ({ answered, total, height = 8 }) => {
  const pct = total ? (Math.min(answered, total) / total) * 100 : 0;
  return (
    <div
      style={{
        display: 'flex',
        height,
        borderRadius: height,
        overflow: 'hidden',
        background: HOME_OVERVIEW_CHROME.trackBackground,
      }}
      role='img'
      aria-label={`${fmt(answered)} of ${fmt(total)} answered`}
    >
      <div
        style={{ width: `${pct}%`, background: HOME_OVERVIEW_COLOR.success }}
      />
    </div>
  );
};

const Card: React.FC<{
  actions: React.ReactNode;
  children: React.ReactNode;
}> = ({ actions, children }) => (
  <EuiPanel paddingSize='m' hasBorder>
    <HalfHeader
      title='Incident Response'
      href={getActiveResponseUrl()}
      caption='Last 24 hours'
      actions={actions}
    />
    <EuiSpacer size='m' />
    {children}
  </EuiPanel>
);

export const pctColor = (pct?: number) =>
  pct === undefined
    ? undefined
    : pct >= 80
    ? HOME_OVERVIEW_TEXT_COLOR.success
    : pct >= 40
    ? HOME_OVERVIEW_TEXT_COLOR.warning
    : HOME_OVERVIEW_TEXT_COLOR.danger;

/* ---------- K: coverage first ---------- */

export const IrK: React.FC<VariantProps> = ({ ir }) => {
  const cov = useCoverage(ir);
  return (
    <Card
      actions={
        <Action href={getActiveResponseResponsesUrl()}>View responses</Action>
      }
    >
      {cov.ready && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px minmax(0, 1fr)',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                paddingRight: 24,
                borderRight: HOME_OVERVIEW_CHROME.hairline,
              }}
            >
              <StatTile
                reverse
                color={pctColor(cov.pct)}
                value={`${fmt(cov.pct)}%`}
                label='response coverage'
              />
            </div>
            <div>
              <CoverageBar
                answered={cov.answered ?? 0}
                total={cov.total ?? 0}
                height={10}
              />
              <EuiText size='xs' style={{ marginTop: 8 }}>
                <strong className='tab-num'>{fmt(cov.answered)}</strong> of{' '}
                <strong className='tab-num'>{fmt(cov.total)}</strong> critical
                and high findings got an active response
              </EuiText>
              <EuiText size='xs' color='subdued' style={{ marginTop: 2 }}>
                {fmt(ir.data?.total)} responses ran in total, on{' '}
                {fmt(ir.data?.agentsCount)} agents.
              </EuiText>
            </div>
          </div>
          <EuiSpacer size='l' />
          <GapList cov={cov} max={3} />
        </>
      )}
    </Card>
  );
};

export const VariantK: React.FC<VariantProps> = props => (
  <VariantJ {...props} irSlot={<IrK {...props} />} />
);
VariantK.displayName = 'Coverage first';

/* ---------- L: gap banner + KPI row ---------- */

const IrL: React.FC<VariantProps> = ({ ir }) => {
  const cov = useCoverage(ir);
  return (
    <Card
      actions={
        <Action href={getActiveResponseResponsesUrl()}>View responses</Action>
      }
    >
      {cov.ready && (
        <>
          {cov.unanswered ? (
            <EuiCallOut
              size='s'
              color='warning'
              iconType='alert'
              title={`${fmt(
                cov.unanswered,
              )} critical and high findings had no active response`}
            >
              {cov.canCreate && (
                <Redirect>
                  <EuiButton
                    size='s'
                    color='warning'
                    iconType='plusInCircle'
                    href={getCreateActiveResponseUrl()}
                  >
                    Create active response
                  </EuiButton>
                </Redirect>
              )}
            </EuiCallOut>
          ) : (
            <EuiCallOut
              size='s'
              color='success'
              iconType='check'
              title='Every critical and high finding got a response'
            />
          )}
          <EuiSpacer size='m' />
          <StatTileGroup
            tiles={[
              {
                key: 'total',
                label: 'Responses',
                testSubj: 'proto-l-total',
                onSelect: () => getActiveResponseResponsesUrl(),
              },
              {
                key: 'answered',
                label: 'Findings answered',
                testSubj: 'proto-l-answered',
              },
              { key: 'pct', label: 'Coverage %', testSubj: 'proto-l-pct' },
            ]}
            results={{
              total: { status: 'available', data: ir.data?.total },
              answered: { status: 'available', data: cov.answered },
              pct: { status: 'available', data: cov.pct },
            }}
          />
          <EuiSpacer size='m' />
          <GapList cov={cov} max={4} title='Rules without a response' />
        </>
      )}
    </Card>
  );
};

export const VariantL: React.FC<VariantProps> = props => (
  <VariantJ {...props} irSlot={<IrL {...props} />} />
);
VariantL.displayName = 'Gap banner + KPI row';

/* ---------- M: answered vs unanswered per severity ---------- */

const LevelRow: React.FC<{
  label: string;
  color: string;
  answered: number;
  total: number;
}> = ({ label, color, answered, total }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '80px minmax(0, 1fr) 70px',
      gap: 10,
      alignItems: 'center',
    }}
  >
    <EuiHealth color={color}>{label}</EuiHealth>
    <EuiToolTip
      content={`${fmt(Math.min(answered, total))} answered, ${fmt(
        Math.max(total - answered, 0),
      )} without a response`}
    >
      <div
        style={{
          display: 'flex',
          height: 10,
          borderRadius: 10,
          overflow: 'hidden',
          background: HOME_OVERVIEW_COLOR.failed,
          opacity: total ? 1 : 0.3,
        }}
      >
        <div
          style={{
            width: `${total ? (Math.min(answered, total) / total) * 100 : 0}%`,
            background: HOME_OVERVIEW_COLOR.success,
          }}
        />
      </div>
    </EuiToolTip>
    <EuiText size='s' className='tab-num' textAlign='right'>
      {fmt(Math.min(answered, total))} / {fmt(total)}
    </EuiText>
  </div>
);

const IrM: React.FC<VariantProps> = ({ ir }) => {
  const cov = useCoverage(ir);
  return (
    <Card
      actions={
        <>
          {cov.canCreate && (
            <Action href={getCreateActiveResponseUrl()} icon='plusInCircle'>
              Create
            </Action>
          )}
          <Action href={getActiveResponseResponsesUrl()}>View responses</Action>
        </>
      }
    >
      {cov.ready && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px minmax(0, 1fr)',
              gap: 24,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                paddingRight: 24,
                borderRight: HOME_OVERVIEW_CHROME.hairline,
              }}
            >
              <StatTile
                reverse
                value={
                  <Redirect>
                    <EuiLink
                      href={getActiveResponseResponsesUrl()}
                      style={KPI_LINK_STYLE}
                    >
                      {fmt(ir.data?.total)}
                    </EuiLink>
                  </Redirect>
                }
                label='active responses'
              />
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <SectionTitle
                right={
                  <EuiFlexGroup gutterSize='m' responsive={false}>
                    <EuiFlexItem grow={false}>
                      <EuiHealth color={HOME_OVERVIEW_COLOR.success}>
                        <EuiText size='xs'>Answered</EuiText>
                      </EuiHealth>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiHealth color={HOME_OVERVIEW_COLOR.failed}>
                        <EuiText size='xs'>No response</EuiText>
                      </EuiHealth>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
              >
                Findings answered
              </SectionTitle>
              <LevelRow
                label='Critical'
                color={HOME_OVERVIEW_COLOR.danger}
                {...cov.perLevel.critical}
              />
              <LevelRow
                label='High'
                color={HOME_OVERVIEW_COLOR.warning}
                {...cov.perLevel.high}
              />
            </div>
          </div>
          <EuiSpacer size='l' />
          <EuiFlexGroup gutterSize='l' responsive={false} wrap>
            <EuiFlexItem style={{ minWidth: 260 }}>
              <GapList cov={cov} max={3} />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size='m' />
          <BarList
            title='Most run commands'
            items={(ir.data?.topCommands ?? []).slice(0, 3)}
            getHref={item =>
              getActiveResponseResponsesUrl(
                { field: 'wazuh.active_response.executable', value: item.key },
                ir.indexPatternId,
              )
            }
          />
        </>
      )}
    </Card>
  );
};

export const VariantM: React.FC<VariantProps> = props => (
  <VariantJ {...props} irSlot={<IrM {...props} />} />
);
VariantM.displayName = 'Answered vs unanswered per severity';

/* ---------- N: K + Case Management composed vertically ---------- */

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const CASE_SEVERITY_COLOR: Record<string, string> = {
  critical: HOME_OVERVIEW_COLOR.danger,
  high: HOME_OVERVIEW_COLOR.warning,
  medium: HOME_OVERVIEW_COLOR.info,
  low: HOME_OVERVIEW_COLOR.success,
  informational: HOME_OVERVIEW_COLOR.subdued,
};

const AttentionRow: React.FC<{
  c: ProtoCase;
  href: string;
  first?: boolean;
}> = ({ c, href, first }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '8px minmax(0, 1fr) auto auto',
      gap: 12,
      alignItems: 'center',
      padding: '6px 0',
      borderTop: first ? HOME_OVERVIEW_CHROME.hairline : undefined,
      borderBottom: HOME_OVERVIEW_CHROME.hairline,
    }}
  >
    <EuiToolTip content={`Severity: ${c.severity ?? 'none'}`}>
      <span
        aria-hidden='true'
        style={{
          display: 'block',
          width: 8,
          height: 8,
          borderRadius: 8,
          background:
            CASE_SEVERITY_COLOR[c.severity ?? ''] ??
            HOME_OVERVIEW_COLOR.disabled,
        }}
      />
    </EuiToolTip>
    <EuiText size='s' title={c.title} style={{ minWidth: 0 }}>
      <RedirectAppLinks
        application={getCore().application}
        className='eui-textTruncate'
      >
        <EuiLink href={href} style={{ fontWeight: 'normal' }}>
          {c.title ?? '-'}
        </EuiLink>
      </RedirectAppLinks>
    </EuiText>
    <EuiText
      size='xs'
      style={{
        color:
          c.priority === 'urgent' ? HOME_OVERVIEW_TEXT_COLOR.danger : undefined,
      }}
      color={c.priority === 'urgent' ? undefined : 'subdued'}
    >
      {PRIORITY_LABEL[c.priority ?? ''] ?? 'No priority'}
    </EuiText>
    <EuiToolTip content={c.updatedAt ? moment(c.updatedAt).format('lll') : ''}>
      <EuiText
        size='xs'
        color='subdued'
        style={{ minWidth: 76, textAlign: 'right' }}
      >
        {c.updatedAt ? moment(c.updatedAt).fromNow() : '-'}
      </EuiText>
    </EuiToolTip>
  </div>
);

export const CmN: React.FC<VariantProps> = ({ cases }) => {
  const c = cases.data;
  const s = c?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const url = (f: Parameters<typeof getCaseManagementCasesUrl>[0]) =>
    getCaseManagementCasesUrl(f, cases.indexPatternId);
  const openFilter = { field: 'wazuh.case.status', value: OPEN };
  const statusLink = (key: string, label: string) => (
    <EuiLink
      href={url([{ field: 'wazuh.case.status', value: key }])}
      style={{ fontWeight: 'normal' }}
    >
      <strong className='tab-num'>{fmt(s[key])}</strong> {label}
    </EuiLink>
  );
  const attention = c?.tabs?.attention ?? [];
  const attentionTotal = Math.max(
    c?.openByPriority?.urgent ?? 0,
    c?.openBySeverity?.critical ?? 0,
  );
  return (
    <EuiPanel paddingSize='m' hasBorder>
      <HalfHeader
        title='Case Management'
        href={getCaseManagementUrl()}
        caption='Current state'
        actions={<Action href={url([openFilter])}>View open cases</Action>}
      />
      <EuiSpacer size='m' />
      {c && !c.total ? (
        <EuiText size='s' color='subdued'>
          No cases yet. Open a finding and create one from its Case tab.
        </EuiText>
      ) : (
        c && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '180px minmax(0, 1fr)',
                gap: 24,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  paddingRight: 24,
                  borderRight: HOME_OVERVIEW_CHROME.hairline,
                }}
              >
                <StatTile
                  reverse
                  value={
                    <Redirect>
                      <EuiLink href={url([openFilter])} style={KPI_LINK_STYLE}>
                        {fmt(open)}
                      </EuiLink>
                    </Redirect>
                  }
                  label='open cases'
                />
              </div>
              <div>
                <SeverityDistributionBar
                  counts={open ? (c.openBySeverity as any) : {}}
                  onSelect={band =>
                    url([
                      openFilter,
                      { field: 'wazuh.case.severity', value: band },
                    ])
                  }
                  emptyMessage='No open cases'
                  testSubjPrefix='proto-n-severity'
                />
                <Redirect>
                  <EuiText size='xs' style={{ marginTop: 8 }}>
                    {statusLink('active', 'active')} ·{' '}
                    {statusLink('acknowledged', 'acknowledged')}{' '}
                    <span style={{ opacity: 0.75 }}>
                      · {statusLink('completed', 'completed')}
                    </span>
                  </EuiText>
                </Redirect>
              </div>
            </div>
            <EuiSpacer size='l' />
            <SectionTitle
              right={
                attentionTotal > 3 ? (
                  <EuiText size='xs' color='subdued'>
                    {attentionTotal - 3} more
                  </EuiText>
                ) : undefined
              }
            >
              Needs attention
              <EuiIconTip
                type='iInCircle'
                color='subdued'
                size='s'
                content='Open cases that are urgent or critical, latest updated first.'
              />
            </SectionTitle>
            <EuiSpacer size='xs' />
            {attention.length ? (
              attention
                .slice(0, 3)
                .map((x, i) => (
                  <AttentionRow
                    key={x.id}
                    c={x}
                    first={i === 0}
                    href={url([{ field: '_id', value: x.id }])}
                  />
                ))
            ) : (
              <EuiText size='s' color='subdued'>
                No urgent or critical case is open.
              </EuiText>
            )}
          </>
        )
      )}
    </EuiPanel>
  );
};

export const VariantN: React.FC<VariantProps> = props => (
  <EuiFlexGroup wrap responsive={false}>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <IrK {...props} />
    </EuiFlexItem>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <CmN {...props} />
    </EuiFlexItem>
  </EuiFlexGroup>
);
VariantN.displayName = 'K + Case Management mirrored';
