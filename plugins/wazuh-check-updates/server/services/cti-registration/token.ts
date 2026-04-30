import axios from 'axios';
import {
  CTI_OAUTH_DEVICE_GRANT_TYPE,
  ctiConsoleApiPaths,
} from '../../../common/constants';
import { getWazuhCheckUpdatesServices } from '../../plugin-services';
import {
  CtiConfigurationError,
  getCtiConsoleBaseUrl,
} from './cti-console-url';
import { fetchOpenSearchClusterUuid } from './opensearch-cluster-uuid';

/**
 * OAuth `client_id` (environment UID): optional body override, then
 * `WAZUH_CTI_CLIENT_ID`, otherwise OpenSearch `cluster_uuid` from `GET /`.
 */
export async function resolveCtiOAuthClientId(
  fromBody?: string,
): Promise<string> {
  const fromRequest = fromBody?.trim();
  if (fromRequest) {
    return fromRequest;
  }
  const fromEnv = process.env.WAZUH_CTI_CLIENT_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const clusterUuid = await fetchOpenSearchClusterUuid();
  if (!clusterUuid) {
    throw new CtiConfigurationError(
      'CTI registration cannot determine an environment identifier on this server.',
    );
  }
  return clusterUuid;
}

/**
 * Starts OAuth 2.0 device authorization against the CTI Console (not the Wazuh manager).
 * Base URL comes only from WAZUH_CTI_CONSOLE_BASE_URL (required).
 */
export const getCtiToken = async (clientId: string): Promise<any> => {
  const { logger } = getWazuhCheckUpdatesServices();

  try {
    const url = `${getCtiConsoleBaseUrl()}${ctiConsoleApiPaths.environmentsToken}`;
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

/**
 * Polls the same CTI Console token endpoint for an access token after the user
 * completes device authorization (RFC 8628). CTI may respond HTTP 200 with
 * `access_token` or HTTP 400 with an OAuth `error` field (e.g. `authorization_pending`).
 */
export const pollCtiToken = async (
  clientId: string,
  deviceCode: string,
): Promise<Record<string, unknown>> => {
  const { logger } = getWazuhCheckUpdatesServices();

  try {
    const url = `${getCtiConsoleBaseUrl()}${ctiConsoleApiPaths.environmentsToken}`;
    const body = new URLSearchParams({
      grant_type: CTI_OAUTH_DEVICE_GRANT_TYPE,
      client_id: clientId,
      device_code: deviceCode,
    }).toString();

    const response = await axios.post<Record<string, unknown>>(url, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: status =>
        (status >= 200 && status < 300) || status === 400,
    });

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Error polling CTI token';

    logger.error(message);
    return Promise.reject(error);
  }
};
