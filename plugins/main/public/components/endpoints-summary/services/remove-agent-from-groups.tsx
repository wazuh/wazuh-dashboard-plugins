import { WzRequest } from '../../../react-services/wz-request';

export const removeAgentFromGroupsService = async ({
  agentId,
  groupIds,
}: {
  agentId: string;
  groupIds: string[];
}) =>
  await WzRequest.apiReq('DELETE', `/agents/${agentId}/group`, {
    params: {
      groups_list: groupIds.join(','),
      wait_for_complete: true,
    },
  });
