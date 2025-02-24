import {
  IAgentManagement,
  IAgentManagementProps,
  IGetAllParams,
} from '../application/types';
import { getToasts } from '../plugin-services';

export const AgentManagement = ({
  queryManagerService,
  getIndexPatternId,
  deleteAgent,
  removeGroups,
  editAgentName,
  addGroups,
  upgradeAgent,
}: IAgentManagementProps): IAgentManagement => {
  const getAll = async (params: IGetAllParams) => {
    const { filter, query, pagination, sort } = params;
    const manager = queryManagerService();

    await manager.createContext({
      indexPatternId: await getIndexPatternId(),
      fixedFilters: [],
    });

    try {
      const results = await manager.search({ filter, query, pagination, sort });

      return results.hits;
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error fetching agents',
        text: error.message || 'Error fetching agents',
        toastLifeTimeMs: 3000,
      });
    }
  };

  const getByAgentId = async (agentId: string) => {
    const manager = queryManagerService();

    await manager.createContext({
      indexPatternId: await getIndexPatternId(),
      fixedFilters: [],
    });

    try {
      const results = await manager.search({
        filter: [
          {
            match_phrase: {
              'agent.id': {
                query: agentId,
              },
            },
          },
        ],
      });

      return results.hits;
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error fetching agent',
        text: error.message || 'Error fetching agent',
        toastLifeTimeMs: 3000,
      });
    }
  };

  const handleDeleteAgent = async (documentId: string | string[]) => {
    try {
      await deleteAgent(documentId);
      getToasts().add({
        color: 'primary',
        title: 'Agent deleted',
        text: 'Agent deleted successfully',
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error deleting agent',
        text: error.message || 'Agent could not be deleted',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  const handleUpgradeAgent = async (id: string[]) => {
    try {
      const result = await upgradeAgent(id);

      getToasts().add({
        color: 'primary',
        title: 'Agent upgraded',
        text: 'Agent upgraded successfully',
        toastLifeTimeMs: 3000,
      });

      return result;
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error upgrading agent',
        text: error.message || 'Agent could not be upgraded',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  const handleEditAgentName = async (id: string, newName: string) => {
    try {
      await editAgentName(id, newName);
      getToasts().add({
        color: 'primary',
        title: 'Agent name edited',
        text: `Agent name edited successfully to ${newName}`,
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent name',
        text: error.message || 'Error editing agent name',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  const handleRemoveGroupToAgents = async (
    agentId: string,
    groupsIds: string | string[],
  ) => {
    try {
      return await removeGroups(agentId, groupsIds);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const handleAddGroupToAgents = async (
    agentId: string,
    groupsIds: string | string[],
  ) => {
    try {
      return await addGroups(agentId, groupsIds);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  return {
    getAll: async ({ filter, query, pagination, sort }: IGetAllParams) =>
      await getAll({ filter, query, pagination, sort }),
    getByAgentId: async (id: string) => await getByAgentId(id),
    delete: async (documentId: string | string[]) =>
      await handleDeleteAgent(documentId),
    upgrade: async (id: string[]) => await handleUpgradeAgent(id),
    editName: async (id: string, newName: string) =>
      await handleEditAgentName(id, newName),
    removeGroups: async (documentId: string, groupsIds: string | string[]) =>
      await handleRemoveGroupToAgents(documentId, groupsIds),
    addGroups: async (documentId: string, groupsIds: string | string[]) =>
      await handleAddGroupToAgents(documentId, groupsIds),
  };
};
