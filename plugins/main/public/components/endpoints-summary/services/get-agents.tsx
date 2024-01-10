import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Agent } from '../types';

export const getAgentsService = async (
  filters: any,
  limit?: number,
  offset?: number,
) => {
  const {
    data: { data },
  } = (await WzRequest.apiReq('GET', '/agents', {
    params: { limit, offset, q: filters },
  })) as IApiResponse<Agent>;
  return data;
};
