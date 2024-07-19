import { WzRequest } from '../../../react-services/wz-request';

export const getOutdatedAgentsService = async ({
  agentIds,
  limit,
  q,
}: {
  agentIds?: string[];
  limit?: number;
  q?: string;
}) => {
  const qArray = q?.split(';') ?? [];
  const qAgents = agentIds?.length
    ? [agentIds.map(agentId => `id=${agentId}`).join(',')]
    : [];
  const finalQ = [...qArray, ...qAgents].join(';');

  const {
    data: { data },
  } = await WzRequest.apiReq('GET', '/agents/outdated', {
    params: {
      ...(agentIds?.length || q
        ? {
            q: finalQ,
          }
        : {}),
      limit,
    },
  });
  return data;
};
