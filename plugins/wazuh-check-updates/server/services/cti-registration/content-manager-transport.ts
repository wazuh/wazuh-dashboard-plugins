import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import { contentManagerRoutes } from '../../../common/constants';
import {
  isContentManagerMockEnabled,
  requestContentManagerMock,
} from './content-manager-mock';

export interface ContentManagerRequestParams {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  querystring?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface ContentManagerResponse {
  body: unknown;
  statusCode?: number | null;
}

/**
 * Sends a Content Manager request as the current user. Rejects like the cluster
 * transport: any status >= 400 throws an error carrying `meta.statusCode`.
 *
 * With `WAZUH_CTI_CONTENT_MANAGER_MOCK` set (development only), subscription requests
 * are answered by the in-memory mock instead (see `content-manager-mock.ts`); every
 * other path still goes to the indexer.
 */
export function requestContentManager(
  wazuhClient: IScopedClusterClient,
  params: ContentManagerRequestParams,
): Promise<ContentManagerResponse> {
  if (
    params.path === contentManagerRoutes.subscription &&
    isContentManagerMockEnabled()
  ) {
    return requestContentManagerMock(params);
  }
  return wazuhClient.asCurrentUser.transport.request(params);
}
