import { WzRequest } from '../../../react-services/wz-request';

export const getOutdatedAgents = async ({
  agentIds,
  limit,
}: {
  agentIds?: string[];
  limit?: number;
}) => {
  const {
    data: { data },
  } = await WzRequest.apiReq('GET', '/agents/outdated', {
    params: {
      ...(agentIds?.length
        ? { q: `(${agentIds.map(agentId => `id=${agentId}`).join(',')})` }
        : {}),
      limit,
    },
  });
  return data;
};
