import { getCore } from '../../plugin-services';

/**
 * Cluster root `GET /` returns `cluster_uuid`; that value is the OAuth
 * `client_id` for Wazuh environment registration (same as dashboard `/api/setup`).
 */
export async function fetchClusterUuid(): Promise<string | null> {
  const clusterResp = await getCore().opensearch.client.asInternalUser.transport.request(
    {
      method: 'GET',
      path: '/',
    },
  );

  const uuid = (clusterResp as { body?: { cluster_uuid?: string } }).body
    ?.cluster_uuid;

  if (typeof uuid === 'string' && uuid.trim()) {
    return uuid.trim();
  }

  return null;
}
