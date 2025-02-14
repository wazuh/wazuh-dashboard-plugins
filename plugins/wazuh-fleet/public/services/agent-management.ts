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
  editAgentGroups,
  editAgentName,
  addOrRemoveGroups,
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
    if (newName === '') {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent name',
        text: 'Agent name cannot be empty',
        toastLifeTimeMs: 3000,
      });
      throw new Error('Agent name cannot be empty');
    }

    try {
      await editAgentName(id, newName);
      getToasts().add({
        color: 'primary',
        title: 'Agent groups edited',
        text: 'Agent groups edited successfully',
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent groups',
        text: error.message || 'Error editing agent groups',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  const editAgentGroup = async (
    id: string | string[],
    groupsIds: string | string[],
  ) => {
    if (groupsIds.length === 0) {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent groups',
        text: 'Agent groups cannot be empty',
        toastLifeTimeMs: 3000,
      });

      throw new Error('Agent groups cannot be empty');
    }

    try {
      await editAgentGroups(id, groupsIds);
      getToasts().add({
        color: 'primary',
        title: 'Agent groups edited',
        text: 'Agent groups edited successfully',
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent groups',
        text: error.message || 'Error editing agent groups',
        toastLifeTimeMs: 3000,
      });
      throw error;
    }
  };

  const handleAddOrRemoveGroupsToAgents = async (
    listIds: string[],
    groupsIds: string | string[],
    addOrRemove: 'add' | 'remove',
  ) => {
    try {
      await addOrRemoveGroups(listIds, groupsIds, addOrRemove);
      getToasts().add({
        color: 'primary',
        title: 'Agent groups edited',
        text: 'Agent groups edited successfully',
        toastLifeTimeMs: 3000,
      });
    } catch (error) {
      getToasts().add({
        color: 'danger',
        title: 'Error editing agent groups',
        text: error.message || 'Error editing agent groups',
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
    editGroup: async (id: string, groupsIds: string | string[]) =>
      await editAgentGroup(id, groupsIds),
    addOrRemoveGroupsToAgents: async (
      listIds: string[],
      groupsIds: string | string[],
      addOrRemove: 'add' | 'remove',
    ) => await handleAddOrRemoveGroupsToAgents(listIds, groupsIds, addOrRemove),
  };
};
