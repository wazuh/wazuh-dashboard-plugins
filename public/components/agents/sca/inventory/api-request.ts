import { WzRequest } from '../../../../react-services/wz-request';

export async function getAgentPolicies(agentId) {
  const {
    data: {
      data: { affected_items: policies },
    },
  } = await WzRequest.apiReq('GET', `/sca/${agentId}`, {});

  return policies;
}
