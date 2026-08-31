import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { ResponseScanAgentsVulnerabilities } from '../types';
import { paginatedAgentsRequestService } from './paginated-agents-request';

export const scanAgentsVulnerabilitiesService = async ({
  agentIds,
}: {
  agentIds: string[];
}) =>
  (await paginatedAgentsRequestService({
    method: 'PUT',
    url: '/agents/scan/vulnerability',
    agentIds,
  })) as IApiResponse<ResponseScanAgentsVulnerabilities>;
