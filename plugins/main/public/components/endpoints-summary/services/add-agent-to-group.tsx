import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';

export const addAgentToGroupService = async ({
  agentId,
  groupId,
}: {
  agentId: string;
  groupId: string;
}) =>
  (await WzRequest.apiReq('PUT', `/agents/${agentId}/group/${groupId}`, {
    wait_for_complete: true,
  })) as IApiResponse<string>;
