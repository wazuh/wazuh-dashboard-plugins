import { ILegacyCustomClusterClient } from '../../../../../src/core/server';

const API_ROUTE_PREFIX = '/_plugins/_ism';
const API_ROUTE_PREFIX_ROLLUP = '/_plugins/_rollup';
const TRANSFORM_ROUTE_PREFIX = '/_plugins/_transform';
const NOTIFICATIONS_API_ROUTE_PREFIX = '/_plugins/_notifications';
const CHANNELS_ROUTE = `${NOTIFICATIONS_API_ROUTE_PREFIX}/channels`;
const NOTIFICATION_CONFIGS_ROUTE = `${NOTIFICATIONS_API_ROUTE_PREFIX}/configs`;
const SM_ROUTE_PREFIX = '/_plugins/_sm';

export const API = {
  POLICY_BASE: `${API_ROUTE_PREFIX}/policies`,
  EXPLAIN_BASE: `${API_ROUTE_PREFIX}/explain`,
  RETRY_BASE: `${API_ROUTE_PREFIX}/retry`,
  ADD_POLICY_BASE: `${API_ROUTE_PREFIX}/add`,
  REMOVE_POLICY_BASE: `${API_ROUTE_PREFIX}/remove`,
  CHANGE_POLICY_BASE: `${API_ROUTE_PREFIX}/change_policy`,
  ROLLUP_JOBS_BASE: `${API_ROUTE_PREFIX_ROLLUP}/jobs`,
  TRANSFORM_BASE: `${TRANSFORM_ROUTE_PREFIX}`,
  CHANNELS_BASE: `${CHANNELS_ROUTE}`,
  NOTIFICATION_CONFIGS_BASE: `${NOTIFICATION_CONFIGS_ROUTE}`,
  SM_POLICY_BASE: `${SM_ROUTE_PREFIX}/policies`,
};

function ismPlugin(Client: any, config: any, components: any) {
  const ca = components.clientAction.factory;

  Client.prototype.wzISM = components.clientAction.namespaceFactory();
  const ism = Client.prototype.wzISM.prototype;

  ism.getPolicies = ca({
    url: {
      fmt: `${API.POLICY_BASE}`,
    },
    method: 'GET',
  });

  ism.createPolicy = ca({
    url: {
      fmt: `${API.POLICY_BASE}/<%=policyId%>?refresh=wait_for`,
      req: {
        policyId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  ism.putPolicy = ca({
    url: {
      fmt: `${API.POLICY_BASE}/<%=policyId%>?if_seq_no=<%=ifSeqNo%>&if_primary_term=<%=ifPrimaryTerm%>&refresh=wait_for`,
      req: {
        policyId: {
          type: 'string',
          required: true,
        },
        ifSeqNo: {
          type: 'string',
          required: true,
        },
        ifPrimaryTerm: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });
}

export function createOpenSearchClient(opensearch) {
  const opensearchClient: ILegacyCustomClusterClient =
    opensearch.legacy.createClient('wz_ism', {
      plugins: [ismPlugin],
    });
  return opensearchClient;
}
