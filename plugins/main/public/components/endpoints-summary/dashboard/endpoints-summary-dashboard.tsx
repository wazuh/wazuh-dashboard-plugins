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
  filterByOutdatedAgent: (data: any) => void;
}

export const EndpointsSummaryDashboard: FC<EndpointsSummaryDashboardProps> = ({
  filterAgentByStatus,
  filterAgentByOS,
  filterAgentByGroup,
  filterByOutdatedAgent,
}) => {
  return (
    <div className='endpoints-summary-container-indicators'>
      <DonutCard
        betaBadgeLabel='Agents by Status'
        onClickLabel={filterAgentByStatus}
        getInfo={getSummaryAgentsStatus}
      />
      <DonutCard
        betaBadgeLabel='Agents by OS'
        onClickLabel={filterAgentByOS}
        getInfo={getAgentsByOs}
      />
      <DonutCard
        betaBadgeLabel='Agents by Group'
        onClickLabel={filterAgentByGroup}
        getInfo={getAgentsByGroup}
      />
      <OutdatedAgentsCard onClick={filterByOutdatedAgent} />
    </div>
  );
};
