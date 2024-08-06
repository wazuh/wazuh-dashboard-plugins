import React from 'react';

export interface AgentInventoryProps {
  agentId: string;
}

export const AgentInventory = ({ agentId }: AgentInventoryProps) => {
  return <div>Inventory {agentId}</div>;
};
