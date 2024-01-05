import React from 'react';
import { Agent } from '../../types';
import { EuiBadge, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

interface AgentListProps {
  agents: Agent[];
}

export const AgentList = ({ agents }: AgentListProps) => {
  return (
    <EuiFlexGroup wrap responsive={false} gutterSize='xs'>
      {agents.map(agent => (
        <EuiFlexItem key={agent.id} grow={false}>
          <EuiBadge color='hollow'>{agent.name}</EuiBadge>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
