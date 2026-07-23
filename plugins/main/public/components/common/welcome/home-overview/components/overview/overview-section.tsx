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
import { TopOsTable } from './top-os-table';
import { TopNetworkServicesTable } from './top-network-services-table';
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
  getMitreUrlTactic,
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
            title='Agents by status'
            headerLink={{ label: 'Agents', href: getAgentsUrl() }}
            centerBody
            errorDisplay='dash'
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
            title='Findings'
            caption='Last 24 hours'
            headerLink={{
              label: 'Threat Hunting',
              href: getThreatHuntingUrl(),
            }}
            centerBody
            errorDisplay='dash'
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
        title='MITRE ATT&CK top tactics'
        caption='Last 24 hours'
        headerLink={{ label: 'MITRE ATT&CK', href: getMitreUrl() }}
        loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
        data-test-subj='home-overview-mitre-tactics'
      >
        {findings.data && (
          <BarList
            items={findings.data.topTactics}
            emptyMessage='No MITRE ATT&CK tactics observed in the last 24 hours'
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
              title='Top 5 operating systems'
              caption='Current state'
              headerLink={{ label: 'IT Hygiene', href: getItHygieneUrl() }}
              loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
              data-test-subj='home-overview-top-os'
            >
              {topOs.data && <TopOsTable items={topOs.data} />}
            </WidgetGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <WidgetGroup
              status={topServices.status}
              title='Top 5 network services'
              caption='Current state'
              headerLink={{ label: 'IT Hygiene', href: getItHygieneUrl() }}
              loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
              data-test-subj='home-overview-top-network-services'
            >
              {topServices.data && (
                <TopNetworkServicesTable items={topServices.data} />
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
