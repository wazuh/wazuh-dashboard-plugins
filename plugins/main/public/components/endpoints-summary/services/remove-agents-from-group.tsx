import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';

export const removeAgentsFromGroupService = async (
  agentIds: string[],
  group_id: string,
) =>
  (await WzRequest.apiReq('DELETE', `/agents/group`, {
    params: {
      group_id,
      agents_list: agentIds.join(','),
      wait_for_complete: true,
    },
  })) as IApiResponse<string>;
