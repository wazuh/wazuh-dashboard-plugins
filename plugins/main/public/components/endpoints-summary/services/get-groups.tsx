import { WzRequest } from '../../../react-services/wz-request';

export const getGroupsService = async () => {
  const {
    data: { data },
  } = await WzRequest.apiReq('GET', '/groups', {});
  return data;
};
