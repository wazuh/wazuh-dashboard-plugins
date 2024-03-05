import { WzRequest } from '../../../react-services/wz-request';

export const getOutdatedAgents = async (agentIds?: string[]) => {
  const {
    data: {
      data: { affected_items },
    },
  } = await WzRequest.apiReq(
    'GET',
    '/agents/outdated',
    agentIds
      ? {
          params: {
            q: `(${agentIds.map(agentId => `id=${agentId}`).join(',')})`,
          },
        }
      : {},
  );
  return affected_items;
};
