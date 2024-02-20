import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';

export const removeAgentsFromGroupService = async ({
  agentIds,
  groupId,
}: {
  agentIds: string[];
  groupId: string;
}) =>
  (await WzRequest.apiReq(
    'DELETE',
    `/agents/group`,
    {
      params: {
        group_id: groupId,
        agents_list: agentIds.join(','),
        wait_for_complete: true,
      },
    },
    { returnOriginalResponse: true },
  )) as IApiResponse<string>;
