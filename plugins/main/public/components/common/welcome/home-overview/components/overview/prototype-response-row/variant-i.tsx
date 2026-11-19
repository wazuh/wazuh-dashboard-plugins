/*
 * PROTOTYPE (issue #9672) — throwaway. Variant I: the Home card pattern
 * (centered KPI row with dividers, then titled sections), as in
 * Configuration Assessment. Shared components only.
 */
import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer, EuiText } from '@elastic/eui';
import {
  BarList,
  DistributionBar,
  SeverityDistributionBar,
  StatTileGroup,
  WidgetGroup,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../../common';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
} from '../../../utils/navigation';
import { HOME_OVERVIEW_COLOR } from '../../../lib/theme-colors';
import { CARD_MIN_WIDTH } from '../../../lib/constants';
import type { VariantProps } from './variants';

const OPEN = ['active', 'acknowledged'];
const ok = (data?: number) => ({ status: 'available' as const, data });

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <EuiText size='xs'>
    <strong>{children}</strong>
  </EuiText>
);

const PRIORITIES: Array<[string, string, string]> = [
  ['urgent', 'Urgent', HOME_OVERVIEW_COLOR.danger],
  ['high', 'High', HOME_OVERVIEW_COLOR.warning],
  ['medium', 'Medium', HOME_OVERVIEW_COLOR.info],
  ['low', 'Low', HOME_OVERVIEW_COLOR.success],
];

export const VariantI: React.FC<VariantProps> = ({ ir, cases }) => {
  const d = ir.data;
  const c = cases.data;
  const s = c?.byStatus ?? {};
  const open = (s.active ?? 0) + (s.acknowledged ?? 0);
  const url = (f: Parameters<typeof getCaseManagementCasesUrl>[0]) =>
    getCaseManagementCasesUrl(f, cases.indexPatternId);
  const openFilter = { field: 'wazuh.case.status', value: OPEN };

  return (
    <EuiFlexGroup wrap responsive={false}>
      <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
        <WidgetGroup
          status={d ? 'available' : 'loading'}
          title='Incident Response'
          titleLink={{ href: getActiveResponseUrl() }}
          caption='Last 24 hours'
          loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
        >
          {d && (
            <>
              <StatTileGroup
                tiles={[
                  {
                    key: 'total',
                    label: 'Active responses',
                    testSubj: 'proto-ir-total',
                    onSelect: () => getActiveResponseResponsesUrl(),
                  },
                  {
                    key: 'agents',
                    label: 'Agents',
                    testSubj: 'proto-ir-agents',
                  },
                  {
                    key: 'commands',
                    label: 'Commands',
                    testSubj: 'proto-ir-commands',
                  },
                ]}
                results={{
                  total: ok(d.total),
                  agents: ok(d.agentsCount),
                  commands: ok(d.commandsCount),
                }}
              />
              <EuiSpacer size='l' />
              <BarList
                title='Top 5 commands executed'
                items={d.topCommands}
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
            </>
          )}
        </WidgetGroup>
      </EuiFlexItem>
      <EuiFlexItem style={{ minWidth: CARD_MIN_WIDTH }}>
        <WidgetGroup
          status={c ? 'available' : 'loading'}
          title='Case Management'
          titleLink={{ href: getCaseManagementUrl() }}
          caption='Current state'
          loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
        >
          {c && (
            <>
              <StatTileGroup
                tiles={(['active', 'acknowledged', 'completed'] as const).map(
                  k => ({
                    key: k,
                    label: k[0].toUpperCase() + k.slice(1),
                    testSubj: `proto-case-${k}`,
                    onSelect: () =>
                      url([{ field: 'wazuh.case.status', value: k }]),
                  }),
                )}
                results={{
                  active: ok(s.active),
                  acknowledged: ok(s.acknowledged),
                  completed: ok(s.completed),
                }}
              />
              <EuiSpacer size='l' />
              <SeverityDistributionBar
                counts={open ? (c.openBySeverity as any) : {}}
                headline={<SectionTitle>Open cases by severity</SectionTitle>}
                onSelect={band =>
                  url([
                    openFilter,
                    { field: 'wazuh.case.severity', value: band },
                  ])
                }
                emptyMessage='No open cases'
                testSubjPrefix='proto-i-severity'
              />
              <EuiSpacer size='l' />
              <DistributionBar
                headline={<SectionTitle>Open cases by priority</SectionTitle>}
                segments={
                  open
                    ? PRIORITIES.map(([key, label, color]) => ({
                        key,
                        label,
                        color,
                        count: c.openByPriority?.[key] ?? 0,
                        href: url([
                          openFilter,
                          { field: 'wazuh.case.priority', value: key },
                        ]),
                      }))
                    : []
                }
                emptyMessage='No open cases'
                data-test-subj='proto-i-priority'
              />
            </>
          )}
        </WidgetGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
VariantI.displayName = 'Home card pattern';
