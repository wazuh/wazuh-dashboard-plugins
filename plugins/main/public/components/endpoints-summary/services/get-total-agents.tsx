import { WzRequest } from '../../../react-services/wz-request';

export const getTotalAgentsService = async () => {
  const {
    data: {
      data: { total_affected_items },
    },
  } = await WzRequest.apiReq('GET', '/agents', {
    params: { limit: 1, q: 'id!=000' },
  });
  return total_affected_items;
};
