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
    console.log(`Get by agent id ${agentId}`);

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

  const upgradeAgent = (id: string) => {
    console.log(`Upgrade ${id}`);
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
      await removeGroups(agentId, groupsIds);
      getToasts().add({
        color: 'primary',
        title: 'Agent groups removed',
        text: `${
          Array.isArray(groupsIds) ? groupsIds.join(', ') : groupsIds
        } removed from agent ${agentId} successfully`,
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error removing agent groups',
        text: error.message || 'Error removing agent groups',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  const handleAddGroupToAgents = async (
    agentId: string,
    groupsIds: string | string[],
  ) => {
    try {
      await addGroups(agentId, groupsIds);
      getToasts().add({
        color: 'primary',
        title: 'Agent groups edited',
        text: `${
          Array.isArray(groupsIds) ? groupsIds.join(', ') : groupsIds
        } added to agent ${agentId} successfully`,
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent groups',
        text: error.message || 'Error adding agent groups',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  return {
    getAll: async ({ filter, query, pagination, sort }: IGetAllParams) =>
      await getAll({ filter, query, pagination, sort }),
    getByAgentId: async (id: string) => await getByAgentId(id),
    delete: async (documentId: string | string[]) =>
      await handleDeleteAgent(documentId),
    upgrade: async (id: string) => await upgradeAgent(id),
    editName: async (id: string, newName: string) =>
      await handleEditAgentName(id, newName),
    removeGroups: async (id: string, groupsIds: string | string[]) =>
      await handleRemoveGroupToAgents(id, groupsIds),
    addGroups: async (listIds: string, groupsIds: string | string[]) =>
      await handleAddGroupToAgents(listIds, groupsIds),
  };
};
