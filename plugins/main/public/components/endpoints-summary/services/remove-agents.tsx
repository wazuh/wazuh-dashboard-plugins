import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { ResponseRemoveAgent } from '../types';
import { paginatedAgentsRequestService } from './paginated-agents-request';

export const removeAgentsService = async ({
  agentIds,
}: {
  agentIds: string[];
}) =>
  (await paginatedAgentsRequestService({
    method: 'DELETE',
    url: '/agents',
    agentIds,
    requestParams: {
      status: 'all',
      older_than: '0s',
    },
  })) as IApiResponse<ResponseRemoveAgent>;
