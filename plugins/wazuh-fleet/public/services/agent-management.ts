import { IAgentManagement } from '../application/types';
import { getToasts } from '../plugin-services';

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

  const editAgentGroup = (id: string, groups: string[]) => {
    console.log(`Edit group ${id}`);
    getToasts().add({
      color: 'primary',
      title: 'Agent group updated',
      text: 'Agent group updated successfully to: ' + groups.join(', '),
      toastLifeTimeMs: 3000,
    });
  };

  return {
    delete: async (id: string) => await deleteAgent(id),
    upgrade: async (id: string) => await upgradeAgent(id),
    editName: async (id: string) => await editAgentName(id),
    editGroup: async (id: string, groups: string[]) =>
      await editAgentGroup(id, groups),
  };
};
