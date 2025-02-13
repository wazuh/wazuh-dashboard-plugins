import { IAgentManagement, IGetAllParams } from '../application/types';
import { getToasts } from '../plugin-services';
import { queryManagerService } from './mocks/agent-management';

export const AgentManagement = (): IAgentManagement => {
  const getAll = async (params: IGetAllParams) => {
    const { filter, query, pagination, sort } = params;

    console.log(params);

    const manager = queryManagerService();

    try {
      const results = manager
        .addFilter(filter || [])
        .addQuery(query)
        .addSort(sort)
        .addPagination(pagination)
        .executeQuery();

      console.log(results);

      return results.hits;
    } catch (error) {
      console.log(error);
    }
  };

  const getByAgentId = async (id: string) => {
    console.log(`Get by agent id ${id}`);

    const results = await queryManagerService().executeQuery();

    return results.hits;
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
    getAll: async ({ filter, query, pagination, sort }: IGetAllParams) =>
      await getAll({ filter, query, pagination, sort }),
    getByAgentId: async (id: string) => await getByAgentId(id),
    delete: async (id: string | string[]) => await deleteAgent(id),
    upgrade: async (id: string) => await upgradeAgent(id),
    editName: async (id: string) => await editAgentName(id),
    editGroup: async (id: string, groups: string[]) =>
      await editAgentGroup(id, groups),
  };
};
