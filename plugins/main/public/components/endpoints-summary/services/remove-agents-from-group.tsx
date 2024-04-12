import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { paginatedAgentsRequestService } from './paginated-agents-request';

export const removeAgentsFromGroupService = async (parameters: {
  agentIds: string[];
  groupId: string;
  pageSize?: number;
}): Promise<IApiResponse<string>> =>
  await paginatedAgentsRequestService({
    method: 'DELETE',
    url: '/agents/group',
    ...parameters,
  });
