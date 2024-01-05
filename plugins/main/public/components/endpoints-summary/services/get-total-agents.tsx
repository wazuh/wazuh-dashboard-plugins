import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Agent } from '../types';

export const getTotalAgentsService = async (): Promise<number> => {
  const {
    data: {
      data: { total_affected_items },
    },
  } = (await WzRequest.apiReq('GET', '/agents', {
    params: { limit: 1, q: 'id!=000' },
  })) as IApiResponse<Agent>;
  return total_affected_items;
};
