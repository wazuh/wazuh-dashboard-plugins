import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { paginatedAgentsGroupService } from './paginated-agents-group';

export const removeAgentsFromGroupService = async (parameters: {
  agentIds: string[];
  groupId: string;
  pageSize?: number;
}): Promise<IApiResponse<string>> =>
  await paginatedAgentsGroupService({ addOrRemove: 'remove', ...parameters });
