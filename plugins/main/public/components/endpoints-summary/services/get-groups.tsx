import IApiResponse from '../../../react-services/interfaces/api-response.interface';
import { WzRequest } from '../../../react-services/wz-request';
import { Group } from '../types';

export const getGroupsService = async () => {
  const {
    data: { data },
  } = (await WzRequest.apiReq('GET', '/groups', {})) as IApiResponse<Group>;

  return data;
};
