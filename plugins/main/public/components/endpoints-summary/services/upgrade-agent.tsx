import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { ResponseUpgradeAgents } from '../types';

export const upgradeAgentService = async (agentId: string) =>
  (await WzRequest.apiReq('PUT', '/agents/upgrade', {
    params: {
      agents_list: agentId,
      wait_for_complete: true,
    },
  })) as IApiResponse<ResponseUpgradeAgents>;
