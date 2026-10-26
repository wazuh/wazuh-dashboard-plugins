import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import {
  WidgetGroup,
  FindingSeverityTiles,
  BarList,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { AgentsByStatus } from './agents-by-status';
import {
  useAgentStatus,
  useFindingsOverview,
} from '../../hooks/use-overview-data';
import {
  getDeployAgentUrl,
  getAgentsUrl,
  goToAgentsByStatus,
  getThreatHuntingUrl,
  getMitreFrameworkTacticUrl,
  getMitreUrl,
  getDiscoverFindingsBySeverityUrl,
} from '../../utils/navigation';
import { FINDING_SEVERITY_FIELD } from '../../lib/fields';
import { UI_COLOR_STATUS } from '../../../../../../../common/constants';

export interface OverviewSectionProps {
  /** Owned by the page shell so Threat Hunting reuses the same on-mount search. */
  findings: ReturnType<typeof useFindingsOverview>;
}

const OverviewSectionComponent: React.FC<OverviewSectionProps> = ({
  findings,
}) => {
  const agents = useAgentStatus();

  return (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem style={{ minWidth: 0 }}>
          <WidgetGroup
            status={agents.status}
            errorLabel={agents.error?.message}
            isPermissionDenied={agents.error?.kind === 'permission-denied'}
            title={i18n.translate(
              'wazuh.common.homeOverviewSection.agentsByStatusTitle',
              { defaultMessage: 'Agents by status' },
            )}
            titleLink={{
              href: getAgentsUrl(),
              destination: i18n.translate(
                'wazuh.common.homeOverviewSection.agentsDestination',
                { defaultMessage: 'Agents' },
              ),
            }}
            centerBody
            data-test-subj='home-overview-agents'
          >
            {agents.data && (
              <AgentsByStatus
                data={agents.data}
                deployAgentUrl={getDeployAgentUrl()}
                onStatusSelect={goToAgentsByStatus}
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem style={{ minWidth: 0 }}>
          <WidgetGroup
            status={findings.status}
            errorLabel={findings.error?.message}
            isPermissionDenied={findings.error?.kind === 'permission-denied'}
            title={i18n.translate(
              'wazuh.common.homeOverviewSection.findingsTitle',
              { defaultMessage: 'Findings' },
            )}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionLast24Hours',
              { defaultMessage: 'Last 24 hours' },
            )}
            titleLink={{
              href: getThreatHuntingUrl(),
              destination: i18n.translate(
                'wazuh.common.homeOverviewSection.threatHuntingDestination',
                { defaultMessage: 'Threat Hunting' },
              ),
            }}
            centerBody
            data-test-subj='home-overview-findings-severity'
          >
            {findings.data && (
              <FindingSeverityTiles
                counts={findings.data.severity}
                onSelect={band =>
                  getDiscoverFindingsBySeverityUrl(
                    band,
                    findings.indexPatternId,
                  )
                }
                getTooltip={band =>
                  i18n.translate(
                    'wazuh.common.homeOverviewSection.findingsSeverityTooltip',
                    {
                      defaultMessage: 'Click to see {field}: {band}',
                      values: { field: FINDING_SEVERITY_FIELD, band },
                    },
                  )
                }
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size='m' />

      <EuiFlexGroup>
        <EuiFlexItem style={{ minWidth: 0 }}>
          <WidgetGroup
            status={findings.status}
            errorLabel={findings.error?.message}
            showManageIndexPatternsLink={
              findings.error?.kind === 'index-pattern-missing'
            }
            isPermissionDenied={findings.error?.kind === 'permission-denied'}
            title={i18n.translate(
              'wazuh.common.homeOverviewSection.mitreTopTacticsTitle',
              { defaultMessage: 'MITRE ATT&CK top tactics' },
            )}
            caption={i18n.translate(
              'wazuh.common.homeOverviewWidget.captionLast24Hours',
              { defaultMessage: 'Last 24 hours' },
            )}
            titleLink={{
              href: getMitreUrl(),
              destination: i18n.translate(
                'wazuh.common.homeOverviewSection.mitreDestination',
                { defaultMessage: 'MITRE ATT&CK' },
              ),
            }}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            data-test-subj='home-overview-mitre-tactics'
          >
            {findings.data && (
              <BarList
                items={findings.data.topTactics}
                emptyMessage={i18n.translate(
                  'wazuh.common.homeOverviewSection.mitreNoTactics',
                  { defaultMessage: 'No MITRE ATT&CK tactics observed' },
                )}
                getHref={item =>
                  getMitreFrameworkTacticUrl(item, findings.indexPatternId)
                }
                data-test-subj='mitre-top-tactics'
                barColor={UI_COLOR_STATUS.success}
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

// Annotated: `withErrorBoundary` is untyped, so without this the props
// would reach every call site as `any`.
export const OverviewSection: React.FC<OverviewSectionProps> = React.memo(
  withErrorBoundary(OverviewSectionComponent),
);
