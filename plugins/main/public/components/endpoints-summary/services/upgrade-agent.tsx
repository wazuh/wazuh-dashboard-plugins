import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { ResponseUpgradeAgents } from '../types';

export const upgradeAgentService = async (
  agentId: string,
  packageType?: 'deb' | 'rpm',
) =>
  (await WzRequest.apiReq('PUT', '/agents/upgrade', {
    params: {
      agents_list: agentId,
      wait_for_complete: true,
      ...(packageType ? { package_type: packageType, force: true } : {}),
    },
  })) as IApiResponse<ResponseUpgradeAgents>;
