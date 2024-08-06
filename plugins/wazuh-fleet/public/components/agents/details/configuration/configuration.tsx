import React from 'react';

export interface AgentConfigurationProps {
  agentId: string;
}

export const AgentConfiguration = ({ agentId }: AgentConfigurationProps) => {
  return <div>Configuration {agentId}</div>;
};
