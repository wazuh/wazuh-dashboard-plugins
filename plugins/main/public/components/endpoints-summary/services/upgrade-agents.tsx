import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { ResponseUpgradeAgents } from '../types';
import { paginatedAgentsRequestService } from './paginated-agents-request';

export const upgradeAgentsService = async ({
  agentIds,
}: {
  agentIds: string[];
}) =>
  (await paginatedAgentsRequestService({
    method: 'PUT',
    url: '/agents/upgrade',
    agentIds,
  })) as IApiResponse<ResponseUpgradeAgents>;
