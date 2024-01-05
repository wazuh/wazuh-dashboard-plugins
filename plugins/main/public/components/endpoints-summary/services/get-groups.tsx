import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Group } from '../types';

export const getGroupsService = async (): Promise<Group[]> => {
  const {
    data: {
      data: { affected_items },
    },
  } = (await WzRequest.apiReq('GET', '/groups', {})) as IApiResponse<Group>;

  return affected_items;
};
