/*
 * PROTOTYPE (issue #9672) — throwaway. Variant G: F's content as two mirrored
 * cards in the standard Home card frame.
 *   hero (left) + context (right) → ranked bar list → (severity bar) → action
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
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { getCore } from '../../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  BarList,
  SeverityDistributionBar,
  StatTile,
  WidgetGroup,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../../common';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
  getCreateActiveResponseUrl,
  getThreatHuntingUrl,
  isActiveResponsesRegistered,
} from '../../../utils/navigation';
import {
  HOME_OVERVIEW_CHROME,
  HOME_OVERVIEW_COLOR,
} from '../../../lib/theme-colors';
import { CARD_MIN_WIDTH, KPI_LINK_STYLE } from '../../../lib/constants';
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

/** Hero row: the card's KPI on the left, its context on the right. */
const HeroRow: React.FC<{
  value?: number;
  label: string;
  href: string;
  context: React.ReactNode;
}> = ({ value, label, href, context }) => (
  <EuiFlexGroup gutterSize='l' alignItems='center' responsive={false}>
    <EuiFlexItem grow={false}>
      <StatTile
        textAlign='left'
        reverse
        value={
          <Redirect>
            <EuiLink href={href} style={KPI_LINK_STYLE}>
              {fmt(value)}
            </EuiLink>
          </Redirect>
        }
        label={label}
      />
    </EuiFlexItem>
    <EuiFlexItem>{context}</EuiFlexItem>
  </EuiFlexGroup>
);

const Sparkline: React.FC<{
  hourly: Array<{ time: number; count: number }>;
}> = ({ hourly }) => {
  const max = Math.max(1, ...hourly.map(h => h.count));
  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 36 }}
        aria-label='Active responses per hour'
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
      <EuiFlexGroup
        justifyContent='spaceBetween'
        responsive={false}
        gutterSize='none'
      >
        <EuiText size='xs' color='subdued'>
          24 h ago
        </EuiText>
        <EuiText size='xs' color='subdued'>
          Per hour
        </EuiText>
        <EuiText size='xs' color='subdued'>
          Now
        </EuiText>
      </EuiFlexGroup>
    </div>
  );
};

const Callout: React.FC<{ value?: number; label: string; href: string }> = ({
  value,
  label,
  href,
}) => (
  <EuiHealth
    color={value ? HOME_OVERVIEW_COLOR.danger : HOME_OVERVIEW_COLOR.disabled}
  >
    <Redirect>
      <EuiLink href={href} style={{ fontWeight: 'normal' }}>
        <strong className='tab-num'>{fmt(value)}</strong> {label}
      </EuiLink>
    </Redirect>
  </EuiHealth>
);

/** Card footer: one action, same place in both cards. */
const CardAction: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <div
    style={{
      marginTop: 'auto',
      paddingTop: 12,
      borderTop: HOME_OVERVIEW_CHROME.hairline,
    }}
  >
    <Redirect>
      <EuiButtonEmpty size='s' flush='left' iconType='plusInCircle' href={href}>
        {children}
      </EuiButtonEmpty>
    </Redirect>
  </div>
);

/** WidgetGroup's body is not a flex column; this lets the footer sit at the bottom. */
const Column: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 340,
      height: '100%',
    }}
  >
    {children}
  </div>
);

const IncidentResponse: React.FC<Pick<VariantProps, 'ir'>> = ({ ir }) => {
  const apps = useObservable(getCore().application.applications$, NO_APPS);
  const d = ir.data;
  return (
    <WidgetGroup
      status={d ? 'available' : 'loading'}
      title='Incident Response'
      titleLink={{ href: getActiveResponseUrl() }}
      caption='Last 24 hours'
      loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
    >
      {d && (
        <Column>
          <HeroRow
            value={d.total}
            label='Active responses triggered'
            href={getActiveResponseResponsesUrl()}
            context={d.total > 0 ? <Sparkline hourly={d.hourly} /> : null}
          />
          <EuiSpacer size='m' />
          <BarList
            title='Top 5 commands executed'
            items={d.topCommands}
            emptyMessage='No active responses ran in this period'
            getHref={item =>
              getActiveResponseResponsesUrl(
                { field: 'wazuh.active_response.executable', value: item.key },
                ir.indexPatternId,
              )
            }
          />
          {isActiveResponsesRegistered(apps) && (
            <CardAction href={getCreateActiveResponseUrl()}>
              Create active response
            </CardAction>
          )}
        </Column>
      )}
    </WidgetGroup>
  );
};

const STATUSES: Array<[string, string]> = [
  ['active', 'Active'],
  ['acknowledged', 'Acknowledged'],
  ['completed', 'Completed'],
];

const CaseManagement: React.FC<Pick<VariantProps, 'cases'>> = ({ cases }) => {
  const c = cases.data;
  const s = c?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const url = (f: Parameters<typeof getCaseManagementCasesUrl>[0]) =>
    getCaseManagementCasesUrl(f, cases.indexPatternId);
  const openFilter = { field: 'wazuh.case.status', value: OPEN };
  return (
    <WidgetGroup
      status={c ? 'available' : 'loading'}
      title='Case Management'
      titleLink={{ href: getCaseManagementUrl() }}
      caption='Current state'
      loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
    >
      {c && (
        <Column>
          {c.total ? (
            <>
              <HeroRow
                value={open}
                label='Open cases'
                href={url([openFilter])}
                context={
                  <EuiFlexGroup
                    direction='column'
                    gutterSize='xs'
                    responsive={false}
                  >
                    <EuiFlexItem>
                      <Callout
                        value={c.openByPriority?.urgent}
                        label='urgent'
                        href={url([
                          openFilter,
                          { field: 'wazuh.case.priority', value: 'urgent' },
                        ])}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <Callout
                        value={c.openBySeverity?.critical}
                        label='critical'
                        href={url([
                          openFilter,
                          { field: 'wazuh.case.severity', value: 'critical' },
                        ])}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
              />
              <EuiSpacer size='m' />
              <BarList
                title='Cases by status'
                items={STATUSES.map(([key, label]) => ({
                  key: label,
                  id: key,
                  count: s[key] ?? 0,
                }))}
                getHref={item =>
                  url([
                    { field: 'wazuh.case.status', value: item.id as string },
                  ])
                }
              />
              <EuiSpacer size='m' />
              <SeverityDistributionBar
                counts={open ? (c.openBySeverity as any) : {}}
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
                testSubjPrefix='proto-g-open-cases-severity'
              />
            </>
          ) : (
            <EuiText
              size='s'
              color='subdued'
              textAlign='center'
              style={{ margin: 'auto' }}
            >
              No cases yet.
            </EuiText>
          )}
          <CardAction href={getThreatHuntingUrl()}>
            New case from a finding
          </CardAction>
        </Column>
      )}
    </WidgetGroup>
  );
};

export const VariantG: React.FC<VariantProps> = ({ ir, cases }) => (
  <EuiFlexGroup wrap responsive={false}>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <IncidentResponse ir={ir} />
    </EuiFlexItem>
    <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
      <CaseManagement cases={cases} />
    </EuiFlexItem>
  </EuiFlexGroup>
);
VariantG.displayName = 'Two mirrored cards';
