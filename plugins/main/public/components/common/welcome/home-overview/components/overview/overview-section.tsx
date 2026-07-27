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
import { useInViewport } from '../../../../hooks';
import {
  useAgentStatus,
  useFindingsOverview,
  useTopOperatingSystems,
  useTopNetworkServices,
} from '../../hooks/use-overview-data';
import {
  getDeployAgentUrl,
  getAgentsUrl,
  goToAgentsByStatus,
  getThreatHuntingUrl,
  getMitreUrl,
  getItHygieneUrl,
  getDiscoverFindingsBySeverityUrl,
} from '../../utils/navigation';
import { FINDING_SEVERITY_FIELD } from '../../lib/fields';

export interface OverviewSectionProps {
  /** Owned by the page shell so Threat Hunting reuses the same on-mount search. */
  findings: ReturnType<typeof useFindingsOverview>;
}

/** Findings fire on mount; the inventory row is lazy. */
const OverviewSectionComponent: React.FC<OverviewSectionProps> = ({
  findings,
}) => {
  const agents = useAgentStatus();
  const [inventoryRef, inventoryVisible] = useInViewport<HTMLDivElement>();
  const topOs = useTopOperatingSystems(inventoryVisible);
  const topServices = useTopNetworkServices(inventoryVisible);

  return (
    <div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <WidgetGroup
            status={agents.status}
            errorLabel={agents.error?.message}
            isPermissionDenied={agents.error?.kind === 'permission-denied'}
            title='Agents by status'
            headerLink={{ label: 'Agents', href: getAgentsUrl() }}
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
        <EuiFlexItem>
          <WidgetGroup
            status={findings.status}
            errorLabel={findings.error?.message}
            isPermissionDenied={findings.error?.kind === 'permission-denied'}
            title='Findings'
            caption='Last 24 hours'
            headerLink={{
              label: 'Threat Hunting',
              href: getThreatHuntingUrl(),
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

      <WidgetGroup
        status={findings.status}
        errorLabel={findings.error?.message}
        showManageIndexPatternsLink={
          findings.error?.kind === 'index-pattern-missing'
        }
        isPermissionDenied={findings.error?.kind === 'permission-denied'}
        title='MITRE ATT&CK top tactics'
        caption='Last 24 hours'
        headerLink={{ label: 'MITRE ATT&CK', href: getMitreUrl() }}
        loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
        data-test-subj='home-overview-mitre-tactics'
      >
        {findings.data && (
          <BarList
            items={findings.data.topTactics}
            emptyMessage='No MITRE ATT&CK tactics observed'
            data-test-subj='mitre-top-tactics'
          />
        )}
      </WidgetGroup>

      <EuiSpacer size='m' />

      <div ref={inventoryRef}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <WidgetGroup
              status={topOs.status}
              errorLabel={topOs.error?.message}
              showManageIndexPatternsLink={
                topOs.error?.kind === 'index-pattern-missing'
              }
              isPermissionDenied={topOs.error?.kind === 'permission-denied'}
              title='Top 5 operating systems'
              caption='Current state'
              headerLink={{ label: 'IT Hygiene', href: getItHygieneUrl() }}
              loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
              data-test-subj='home-overview-top-os'
            >
              {topOs.data && (
                <BarList
                  items={topOs.data}
                  emptyMessage='No operating systems found'
                  data-test-subj='top-os'
                />
              )}
            </WidgetGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <WidgetGroup
              status={topServices.status}
              errorLabel={topServices.error?.message}
              showManageIndexPatternsLink={
                topServices.error?.kind === 'index-pattern-missing'
              }
              isPermissionDenied={
                topServices.error?.kind === 'permission-denied'
              }
              title='Top 5 network services'
              caption='Current state'
              headerLink={{ label: 'IT Hygiene', href: getItHygieneUrl() }}
              loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
              data-test-subj='home-overview-top-network-services'
            >
              {topServices.data && (
                <BarList
                  items={topServices.data}
                  emptyMessage='No network services found'
                  data-test-subj='top-network-services'
                />
              )}
            </WidgetGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </div>
  );
};

export const OverviewSection = React.memo(
  withErrorBoundary(OverviewSectionComponent),
);
