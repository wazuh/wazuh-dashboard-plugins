import { PLUGIN_ID } from '../../common/constants';
import { AgentWrapper } from '../../common/types';
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
  const createSearchContext = async () =>
    await queryManagerService.createSearchContext({
      indexPatternId: await getIndexPatternId(),
      fixedFilters: [],
      contextId: PLUGIN_ID,
    });

  const getAll = async (params: IGetAllParams) => {
    const { filters, query, pagination, sort: sorting } = params;
    const searchContext = await createSearchContext();

    try {
      searchContext.setUserFilters(filters || []);

      const results = await searchContext.executeQuery({
        query,
        pagination,
        sorting,
      });

      return {
        ...results.hits,
        hits: results.hits.hits.map(
          ({ _source: { agent }, ...item }: { _source: AgentWrapper }) => ({
            ...item,
            agent,
          }),
        ),
      };
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
    const searchContext = await createSearchContext();

    searchContext.setFixedFilters([
      {
        match: {
          'agent.id': agentId,
        },
      },
    ]);

    try {
      const results = await searchContext.executeQuery();

      return results?.hits?.hits?.[0]
        ? {
            ...results?.hits?.hits?.[0],
            agent: results?.hits?.hits?.[0]?._source?.agent,
          }
        : null;
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
    getAll: async ({ filters, query, pagination, sort }: IGetAllParams) =>
      await getAll({ filters, query, pagination, sort }),
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
