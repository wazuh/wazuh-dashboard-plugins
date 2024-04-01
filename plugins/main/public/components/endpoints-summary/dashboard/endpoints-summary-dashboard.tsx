import React, { FC } from 'react';
import { getAgentsByGroup } from '../services/get-agents-by-group';
import { getAgentsByOs } from '../services/get-agents-by-os';
import { getSummaryAgentsStatus } from '../services/get-summary-agents-status';
import DonutCard from './components/donut-card';
import OutdatedAgentsCard from './components/outdated-agents-card';

interface EndpointsSummaryDashboardProps {
  filterAgentByStatus: (data: any) => void;
  filterAgentByOS: (data: any) => void;
  filterAgentByGroup: (data: any) => void;
  outdatedAgents: number;
  isLoadingOutdatedAgents: boolean;
  filterByOutdatedAgent: (data: any) => void;
  reloadDashboard?: number;
}

export const EndpointsSummaryDashboard: FC<EndpointsSummaryDashboardProps> = ({
  filterAgentByStatus,
  filterAgentByOS,
  filterAgentByGroup,
  outdatedAgents,
  isLoadingOutdatedAgents,
  filterByOutdatedAgent,
  reloadDashboard,
}) => {
  return (
    <div className='endpoints-summary-container-indicators'>
      <DonutCard
        betaBadgeLabel='Agents by Status'
        onClickLabel={filterAgentByStatus}
        getInfo={getSummaryAgentsStatus}
        reload={reloadDashboard}
      />
      <DonutCard
        betaBadgeLabel='Top 5 agents by OS'
        onClickLabel={filterAgentByOS}
        getInfo={getAgentsByOs}
        reload={reloadDashboard}
      />
      <DonutCard
        betaBadgeLabel='Top 5 agents by Group'
        onClickLabel={filterAgentByGroup}
        getInfo={getAgentsByGroup}
        reload={reloadDashboard}
      />
      <OutdatedAgentsCard
        outdatedAgents={outdatedAgents}
        isLoading={isLoadingOutdatedAgents}
        filterByOutdatedAgent={filterByOutdatedAgent}
      />
    </div>
  );
};
