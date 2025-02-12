import { IAgentManagement } from '../application/types';

export const AgentManagement = (): IAgentManagement => {
  const deleteAgent = (id: string) => {
    console.log(`Delete ${id}`);
  };

  const upgradeAgent = (id: string) => {
    console.log(`Upgrade ${id}`);
  };

  const editAgentName = (id: string) => {
    console.log(`Edit name ${id}`);
  };

  const editAgentGroup = (id: string) => {
    console.log(`Edit group ${id}`);
  };

  return {
    delete: async (id: string) => await deleteAgent(id),
    upgrade: async (id: string) => await upgradeAgent(id),
    editName: async (id: string) => await editAgentName(id),
    editGroup: async (id: string) => await editAgentGroup(id),
  };
};
