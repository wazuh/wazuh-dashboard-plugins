import React, { FC } from 'react';
import { getAgentsInfo } from '../services/get-agents-info';
import DonutCard from './components/donut-card';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { useService } from '../../common/hooks/use-service';

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
  const { data, isLoading } = useService<any>(
    getAgentsInfo,
    undefined,
    reloadDashboard,
  );

  return (
    <EuiFlexGroup gutterSize='m' responsive={false} wrap>
      <EuiFlexItem>
        <DonutCard
          betaBadgeLabel='Agents by Status'
          onClickLabel={filterAgentByStatus}
          data={data?.statusData}
          isLoading={isLoading}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <DonutCard
          betaBadgeLabel='Top 5 OS'
          onClickLabel={filterAgentByOS}
          data={data?.osData}
          isLoading={isLoading}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <DonutCard
          betaBadgeLabel='Top 5 groups'
          onClickLabel={filterAgentByGroup}
          data={data?.groupsData}
          isLoading={isLoading}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
