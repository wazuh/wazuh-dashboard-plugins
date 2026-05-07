import axios from 'axios';
import type {
  CtiSubscriptionMessage,
  CtiSubscriptionSnapshot,
} from '../../../common/cti-registration-status-api';
import { contentManagerRoutes } from '../../../common/constants';
import { getContentManagerBaseUrl } from './content-manager-url';

interface ContentManagerSubscriptionGetResponse {
  message?: {
    plan?: { name?: string; is_public?: boolean };
    is_registered?: boolean;
  };
  status?: number;
}

function normalizeSubscriptionMessage(
  raw: ContentManagerSubscriptionGetResponse['message'],
): CtiSubscriptionMessage | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const planRaw = raw.plan;
  const message: CtiSubscriptionMessage = {
    is_registered: Boolean(raw.is_registered),
  };
  if (planRaw && typeof planRaw === 'object') {
    message.plan = {
      name:
        typeof planRaw.name === 'string'
          ? planRaw.name
          : String(planRaw.name ?? ''),
      is_public: Boolean(planRaw.is_public),
    };
  }
  return message;
}

/**
 * Reads CTI subscription payload from Content Manager `GET …/subscription`.
 * On missing base URL or request failure returns nulls (same as “not registered” for UX).
 */
export async function getCtiSubscriptionStatus(
  clientId: string,
): Promise<CtiSubscriptionSnapshot> {
  const base = getContentManagerBaseUrl();
  if (!base) {
    return { message: null, status: null };
  }

  try {
    const response = await axios.get<ContentManagerSubscriptionGetResponse>(
      `${base}${contentManagerRoutes.subscription}`,
      {
        params: { clientId },
        headers: { 'Content-Type': 'application/json' },
        validateStatus: status => status >= 200 && status < 300,
      },
    );

    const body = response.data;
    const message = normalizeSubscriptionMessage(body?.message);
    const statusFromBody =
      typeof body?.status === 'number' ? body.status : response.status;

    return {
      message,
      status: Number.isFinite(statusFromBody) ? statusFromBody : null,
    };
  } catch {
    return { message: null, status: null };
  }
}
