import { WzRequest } from '../../../react-services/wz-request';

export const removeAgentFromGroupsService = async (
  agentId: string,
  groups: string[],
) =>
  await WzRequest.apiReq('DELETE', `/agents/${agentId}/group`, {
    params: {
      groups_list: groups.join(','),
    },
  });
