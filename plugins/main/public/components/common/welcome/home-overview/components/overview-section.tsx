import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { WidgetGroup } from './widget-group';
import { AgentsByStatus } from './agents-by-status';
import { FindingSeverityTiles } from './finding-severity-tiles';
import { MitreTopTactics } from './mitre-top-tactics';
import { TopOsTable } from './top-os-table';
import { TopNetworkServicesTable } from './top-network-services-table';
import { useInViewport } from '../../../hooks';
import {
  useAgentStatus,
  useFindingsOverview,
  useTopOperatingSystems,
  useTopNetworkServices,
} from '../services/use-overview-data';
import {
  goToThreatHunting,
  goToMitre,
  goToItHygiene,
  goToMitreTactic,
} from '../services/navigation';

/**
 * The OVERVIEW section: fleet health, recent findings, MITRE activity, and
 * inventory. Owns navigation wiring; widgets stay pure and receive href/onClick.
 * Findings (severity + tactics) fire on mount; the inventory row is lazy.
 */
export const OverviewSection: React.FC = () => {
  const agents = useAgentStatus();
  const findings = useFindingsOverview();
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
            data-test-subj='home-overview-agents'
          >
            {agents.data && <AgentsByStatus data={agents.data} />}
          </WidgetGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <WidgetGroup
            status={findings.status}
            title='Findings — last 24 hours'
            caption='Last 24 hours'
            headerLink={{ label: 'Threat Hunting', onClick: goToThreatHunting }}
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
