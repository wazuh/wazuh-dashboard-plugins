import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { ResponseUpgradeAgents } from '../types';
import { paginatedAgentsRequestService } from './paginated-agents-request';

export const upgradeAgentsService = async ({
  agentIds,
}: {
  agentIds: string[];
}) =>
  (agentIds.length === 1
    ? await WzRequest.apiReq('PUT', '/agents/upgrade', {
        params: {
          agents_list: agentIds.join(','),
          wait_for_complete: true,
        },
      })
    : await paginatedAgentsRequestService({
        method: 'PUT',
        url: '/agents/upgrade',
        agentIds,
      })) as IApiResponse<ResponseUpgradeAgents>;
