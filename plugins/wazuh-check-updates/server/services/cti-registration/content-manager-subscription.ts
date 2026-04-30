import axios from 'axios';
import { contentManagerRoutes } from '../../../common/constants';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { getContentManagerBaseUrl } from './content-manager-url';

/**
 * Forwards the CTI OAuth access token to Content Manager `POST …/subscription`.
 * Server-only: never send this body from the browser.
 *
 * No-op when `WAZUH_CONTENT_MANAGER_BASE_URL` is unset (deployments without CM yet).
 */
export async function postContentManagerSubscription(
  accessToken: string,
): Promise<void> {
  const base = getContentManagerBaseUrl();
  if (!base) {
    return;
  }

  const { logger } = getWazuhCheckUpdatesServices();
  const url = `${base}${contentManagerRoutes.subscription}`;

  try {
    await axios.post(
      url,
      { access_token: accessToken },
      {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: status => status >= 200 && status < 300,
      },
    );
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
