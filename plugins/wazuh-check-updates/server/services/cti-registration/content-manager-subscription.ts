import { IScopedClusterClient } from 'opensearch-dashboards/server';
import { contentManagerRoutes } from '../../../common/constants';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';

/**
 * Forwards the CTI OAuth access token to the indexer Content Manager plugin
 * `POST /_plugins/_content_manager/subscription`.
 * Uses the same cluster connection as other CM calls (e.g. version check).
 */
export async function postContentManagerSubscription(
  wazuhClient: IScopedClusterClient,
  accessToken: string,
): Promise<void> {
  const { logger } = getWazuhCheckUpdatesServices();

  try {
    const response = await wazuhClient.asCurrentUser.transport.request({
      method: 'POST',
      path: contentManagerRoutes.subscription,
      body: { access_token: accessToken },
    });

    const body = response.body as {
      message?: unknown;
      status?: number;
    } | null;
    const statusFromBody =
      body && typeof body.status === 'number' ? body.status : undefined;
    const statusFromMeta = (response as { statusCode?: number }).statusCode;
    const status = statusFromBody ?? statusFromMeta;

    if (status !== undefined && (status < 200 || status >= 300)) {
      throw new Error(
        `Content Manager subscription rejected with status ${status}`,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Content Manager subscription request failed';

    logger.error(message);
    return Promise.reject(error);
  }
}
