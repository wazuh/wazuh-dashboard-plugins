import axios from 'axios';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import { getCtiConsoleBaseUrl } from './cti-console-url';

/** OAuth client_id for CTI Console device flow (Imposter README example: a17c21ed). */
export const resolveCtiOAuthClientId = (fromBody?: string): string =>
  fromBody || process.env.WAZUH_CTI_CLIENT_ID || 'a17c21ed';

/**
 * Starts OAuth 2.0 device authorization against the CTI Console (not the Wazuh manager).
 * Base URL: WAZUH_CTI_CONSOLE_BASE_URL or Imposter in Docker (see docker/imposter/cti).
 */
export const getCtiToken = async (clientId: string): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();

  try {
    const url = `${getCtiConsoleBaseUrl()}/api/v1/platform/environments/token`;
    const body = new URLSearchParams({ client_id: clientId }).toString();

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error requesting CTI token';

    logger.error(message);
    return Promise.reject(error);
  }
};
