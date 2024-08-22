import React from 'react';

export interface AgentNetworksProps {
  agentId: string;
}

export const AgentNetworks = ({ agentId }: AgentNetworksProps) => {
  return <div>Networks {agentId}</div>;
};
