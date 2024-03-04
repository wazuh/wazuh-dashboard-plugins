import { WzRequest } from '../../../react-services/wz-request';

export const getOutdatedAgents = async () => {
  const {
    data: {
      data: { affected_items },
    },
  } = await WzRequest.apiReq('GET', '/agents/outdated', {});
  return affected_items;
};
