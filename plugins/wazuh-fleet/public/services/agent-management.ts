import { PLUGIN_ID } from '../../common/constants';
import { AgentWrapper } from '../../common/types';
import {
  IAgentManagement,
  IAgentManagementProps,
  IGetAllParams,
} from '../application/types';
import { getIndexPattern, getToasts } from '../plugin-services';

export const AgentManagement = ({
  queryManagerService,
  deleteAgent,
  removeGroups,
  editAgentName,
  addGroups,
  upgradeAgent,
}: IAgentManagementProps): IAgentManagement => {
  const createSearchContext = async () =>
    await queryManagerService.createSearchContext({
      indexPatternId: await getIndexPattern().getIndexPatternId(),
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
      getToasts().addDanger({
        title: 'Error fetching agents',
        text: error instanceof Error ? error.message : 'Error fetching agents',
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

      if (results?.hits?.hits?.length === 0) {
        return null;
      }

      const hit = results.hits.hits[0];

      return {
        ...hit,
        agent: hit._source?.agent,
      };
    } catch (error) {
      getToasts().addDanger({
        title: 'Error fetching agent',
        text: error instanceof Error ? error.message : 'Error fetching agent',
      });
    }
  };

  const handleDeleteAgent = async (documentId: string | string[]) => {
    try {
      await deleteAgent(documentId);
      getToasts().addInfo({
        title: 'Agent deleted',
        text: 'Agent deleted successfully',
      });
    } catch (error) {
      getToasts().addDanger({
        title: 'Error deleting agent',
        text:
          error instanceof Error ? error.message : 'Agent could not be deleted',
      });
      throw error;
    }
  };

  const handleUpgradeAgent = async (id: string[], version: string) => {
    try {
      const result = await upgradeAgent(id, version);

      getToasts().addInfo({
        title: 'Agent upgraded',
        text: 'Agent upgraded successfully',
      });

      return result;
    } catch (error) {
      getToasts().addDanger({
        title: 'Error upgrading agent',
        text:
          error instanceof Error
            ? error.message
            : 'Agent could not be upgraded',
      });
      throw error;
    }
  };

  const handleEditAgentName = async (id: string, newName: string) => {
    try {
      await editAgentName(id, newName);
      getToasts().addInfo({
        title: 'Agent name edited',
        text: `Agent name edited successfully to ${newName}`,
      });
    } catch (error) {
      getToasts().addDanger({
        title: 'Error editing agent name',
        text:
          error instanceof Error ? error.message : 'Error editing agent name',
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
    upgrade: async (id: string[], verion: string) =>
      await handleUpgradeAgent(id, verion),
    editName: async (id: string, newName: string) =>
      await handleEditAgentName(id, newName),
    removeGroups: async (documentId: string, groupsIds: string | string[]) =>
      await handleRemoveGroupToAgents(documentId, groupsIds),
    addGroups: async (documentId: string, groupsIds: string | string[]) =>
      await handleAddGroupToAgents(documentId, groupsIds),
  };
};
