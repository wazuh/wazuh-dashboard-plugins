import axios from 'axios';
import { contentManagerRoutes } from '../../../common/constants';
import { getContentManagerBaseUrl } from './content-manager-url';

interface ContentManagerSubscriptionsResponse {
  message?: {
    is_registered?: boolean;
  };
}

async function queryCtiRegistrationStatus(clientId: string): Promise<boolean> {
  const base = getContentManagerBaseUrl();
  if (!base) {
    return false;
  }

  try {
    const response = await axios.get<ContentManagerSubscriptionsResponse>(
      `${base}${contentManagerRoutes.subscription}`,
      {
        params: { clientId },
        headers: { 'Content-Type': 'application/json' },
        validateStatus: status => status >= 200 && status < 300,
      },
    );

    return Boolean(response.data?.message?.is_registered);
  } catch {
    return false;
  }
}

/**
 * Reads CTI registration state from Content Manager subscription API.
 * Falls back to `false` when the endpoint is unavailable or fails.
 */
export async function isCtiRegistered(clientId: string): Promise<boolean> {
  return queryCtiRegistrationStatus(clientId);
}
