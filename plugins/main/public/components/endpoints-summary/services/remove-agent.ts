import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { ResponseRemoveAgent } from '../types';

export const removeAgentService = async (agentId: string) =>
  (await WzRequest.apiReq('DELETE', '/agents', {
    params: {
      status: 'all',
      older_than: '0s',
      agents_list: agentId,
      wait_for_complete: true,
    },
  })) as IApiResponse<ResponseRemoveAgent>;
