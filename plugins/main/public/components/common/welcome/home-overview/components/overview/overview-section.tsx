import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { WidgetGroup, FindingSeverityTiles } from '../common';
import { AgentsByStatus } from './agents-by-status';
import { MitreTopTactics } from './mitre-top-tactics';
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
  goToAgents,
  goToThreatHunting,
  goToMitre,
  goToItHygiene,
  goToMitreTactic,
} from '../../navigation';

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
            headerLink={{ label: 'Agents', onClick: goToAgents }}
            centerBody
            data-test-subj='home-overview-agents'
          >
            {agents.data && (
              <AgentsByStatus
                data={agents.data}
                deployAgentUrl={getDeployAgentUrl()}
              />
            )}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={findings.status}
            title='Findings — last 24 hours'
            caption='Last 24 hours'
            headerLink={{ label: 'Threat Hunting', onClick: goToThreatHunting }}
            centerBody
            data-test-subj='home-overview-findings-severity'
          >
            {findings.data && (
              <FindingSeverityTiles counts={findings.data.severity} />
            )}
          </WidgetGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size='m' />

      <WidgetGroup
        status={findings.status}
        title='MITRE ATT&CK — last 24 hours (top tactics)'
        caption='Last 24 hours'
        headerLink={{ label: 'MITRE ATT&CK', onClick: goToMitre }}
        data-test-subj='home-overview-mitre-tactics'
      >
        {findings.data && (
          <MitreTopTactics
            items={findings.data.topTactics}
            onSelect={item =>
              goToMitreTactic(item.key, findings.indexPatternId)
            }
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
              caption='Current'
              headerLink={{ label: 'IT Hygiene', onClick: goToItHygiene }}
              data-test-subj='home-overview-top-os'
            >
              {topOs.data && <TopOsTable items={topOs.data} />}
            </WidgetGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <WidgetGroup
              status={topServices.status}
              title='Top 5 network services'
              caption='Current'
              headerLink={{ label: 'IT Hygiene', onClick: goToItHygiene }}
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

export const OverviewSection = withErrorBoundary(OverviewSectionComponent);
