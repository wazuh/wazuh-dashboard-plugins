import React, { FC } from 'react';
import { getAgentsByGroup } from '../services/get-agents-by-group';
import { getAgentsByOs } from '../services/get-agents-by-os';
import { getSummaryAgentsStatus } from '../services/get-summary-agents-status';
import DonutCard from './components/donut-card';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

interface EndpointsSummaryDashboardProps {
  filterAgentByStatus: (data: any) => void;
  filterAgentByOS: (data: any) => void;
  filterAgentByGroup: (data: any) => void;
  reloadDashboard?: number;
}

export const EndpointsSummaryDashboard: FC<EndpointsSummaryDashboardProps> = ({
  filterAgentByStatus,
  filterAgentByOS,
  filterAgentByGroup,
  reloadDashboard,
}) => {
  return (
    <EuiFlexGroup gutterSize='m' responsive={false} wrap>
      <EuiFlexItem>
        <DonutCard
          betaBadgeLabel='Agents by Status'
          onClickLabel={filterAgentByStatus}
          getInfo={getSummaryAgentsStatus}
          reload={reloadDashboard}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <DonutCard
          betaBadgeLabel='Top 5 agents by OS'
          onClickLabel={filterAgentByOS}
          getInfo={getAgentsByOs}
          reload={reloadDashboard}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <DonutCard
          betaBadgeLabel='Top 5 agents by Group'
          onClickLabel={filterAgentByGroup}
          getInfo={getAgentsByGroup}
          reload={reloadDashboard}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
