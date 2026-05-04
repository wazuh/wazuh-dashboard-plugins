import { getCore } from '../../plugin-services';

/** Hidden index `.wazuh-credentials` — CTI credentials present when at least one hit. */
const CTI_CREDENTIALS_INDEX_PATH = '/.wazuh-credentials';

async function queryCtiCredentialsPresent(): Promise<boolean> {
  try {
    const clusterResp = await getCore().opensearch.client.asInternalUser.transport.request(
      {
        method: 'POST',
        path: `${CTI_CREDENTIALS_INDEX_PATH}/_search`,
        body: JSON.stringify({
          size: 1,
          _source: false,
        }),
      },
    );

    const body = (clusterResp as { body?: { hits?: { total?: number | { value?: number }; hits?: unknown[] } } })
      .body;
    const hitsArr = body?.hits?.hits ?? [];
    if (hitsArr.length > 0) {
      return true;
    }
    const total = body?.hits?.total;
    const n =
      typeof total === 'number'
        ? total
        : typeof total === 'object' && total !== null && 'value' in total
        ? Number((total as { value: number }).value)
        : 0;
    return n > 0;
  } catch {
    return false;
  }
}

/**
 * Whether CTI credentials already exist in the cluster index (read on each call;
 * same pattern as `fetchClusterUuid` — no in-process cache).
 * Never returns document contents — only a boolean for routing/UI.
 */
export async function hasPersistedCtiCredentials(): Promise<boolean> {
  return queryCtiCredentialsPresent();
}
