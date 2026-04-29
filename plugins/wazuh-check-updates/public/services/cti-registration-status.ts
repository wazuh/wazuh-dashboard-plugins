import {
  CTI_OAUTH_DEVICE_GRANT_TYPE,
  routes,
  statusCodes,
  WAZUH_CTI_DEVICE_CODE_SESSION_KEY,
  WAZUH_CTI_REGISTERED_LOCAL_KEY,
} from '../../common/constants';
import { getCore } from '../plugin-services';

/**
 * Derives CTI registration UI state from the same token endpoint as device
 * authorization (poll with `device_code`) — no separate subscription API.
 */
export async function fetchCtiRegistrationStatus(): Promise<{
  statusCode: number;
  message: string;
}> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(WAZUH_CTI_REGISTERED_LOCAL_KEY) === '1'
    ) {
      return { statusCode: statusCodes.SUCCESS, message: '' };
    }

    const deviceCode =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(WAZUH_CTI_DEVICE_CODE_SESSION_KEY)
        : null;
    if (!deviceCode) {
      return { statusCode: statusCodes.NOT_FOUND, message: '' };
    }

    const res = (await getCore().http.post<Record<string, unknown>>(
      routes.token,
      {
        body: JSON.stringify({
          grant_type: CTI_OAUTH_DEVICE_GRANT_TYPE,
          device_code: deviceCode,
        }),
      },
    )) as Record<string, unknown>;

    if (typeof res.access_token === 'string' && res.access_token.length > 0) {
      window.sessionStorage.removeItem(WAZUH_CTI_DEVICE_CODE_SESSION_KEY);
      window.localStorage.setItem(WAZUH_CTI_REGISTERED_LOCAL_KEY, '1');
      return { statusCode: statusCodes.SUCCESS, message: '' };
    }

    if (typeof res.error === 'string') {
      return { statusCode: statusCodes.NOT_FOUND, message: res.error };
    }

    return { statusCode: statusCodes.NOT_FOUND, message: '' };
  } catch (error: unknown) {
    console.error('Error fetching CTI registration status:', error);
    const e = error as {
      body?: { message?: string; statusCode?: number };
      statusCode?: number;
      message?: string;
    };
    const statusCode =
      e.statusCode ?? e.body?.statusCode ?? statusCodes.NOT_FOUND;
    const message =
      e.message ?? e.body?.message ?? 'Registration status request failed';
    throw { statusCode, message };
  }
}
