import React from 'react';
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
  getMitreIntelligenceResourceUrl,
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
            title='Agents by status'
            titleLink={{ href: getAgentsUrl(), destination: 'Agents' }}
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
            title='Findings'
            caption='Last 24 hours'
            titleLink={{
              href: getThreatHuntingUrl(),
              destination: 'Threat Hunting',
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
                  `Click to see ${FINDING_SEVERITY_FIELD}: ${band}`
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
            title='MITRE ATT&CK top tactics'
            caption='Last 24 hours'
            titleLink={{ href: getMitreUrl(), destination: 'MITRE ATT&CK' }}
            loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            data-test-subj='home-overview-mitre-tactics'
          >
            {findings.data && (
              <BarList
                items={findings.data.topTactics}
                emptyMessage='No MITRE ATT&CK tactics observed'
                getHref={item =>
                  getMitreIntelligenceResourceUrl('tactics', item)
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
