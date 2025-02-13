import { IAgentManagement } from '../application/types';
import { getToasts } from '../plugin-services';

export const AgentManagement = (): IAgentManagement => {
  const getAll = () => {
    console.log('Get all');

    return [];
  };

  const getByAgentId = (id: string) => {
    console.log(`Get by agent id ${id}`);

    return;
  };

  const deleteAgent = (id: string | string[]) => {
    if (Array.isArray(id)) {
      console.log(`Delete ${id.join(', ')}`);
    } else {
      console.log(`Delete ${id}`);
    }

    getToasts().add({
      color: 'primary',
      title: 'Agent deleted',
      text: 'Agent deleted successfully',
      toastLifeTimeMs: 3000,
    });
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
    getAll: async () => await getAll(),
    getByAgentId: async (id: string) => await getByAgentId(id),
    delete: async (id: string | string[]) => await deleteAgent(id),
    upgrade: async (id: string) => await upgradeAgent(id),
    editName: async (id: string) => await editAgentName(id),
    editGroup: async (id: string, groups: string[]) =>
      await editAgentGroup(id, groups),
  };
};
