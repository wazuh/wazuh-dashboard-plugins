import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';

export const addAgentToGroupService = async (agentId: string, group: string) =>
  (await WzRequest.apiReq(
    'PUT',
    `/agents/${agentId}/group/${group}`,
    {},
  )) as IApiResponse<string>;
