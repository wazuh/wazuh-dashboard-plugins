import { WzRequest } from '../../../react-services/wz-request';

export const removeAgentFromGroupService = async (
  agentId: string,
  group: string,
) => await WzRequest.apiReq('DELETE', `/agents/${agentId}/group/${group}`, {});
