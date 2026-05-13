import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import type {
  CtiSubscriptionMessage,
  CtiSubscriptionSnapshot,
} from '../../../common/cti-registration-status-api';
import { contentManagerRoutes } from '../../../common/constants';

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
 * Reads CTI subscription payload from the indexer Content Manager plugin
 * `GET /_plugins/_content_manager/subscription` (no query params; cluster-scoped).
 * On request failure returns nulls (same as “not registered” for UX).
 */
export async function getCtiSubscriptionStatus(
  wazuhClient: IScopedClusterClient,
): Promise<CtiSubscriptionSnapshot> {
  try {
    const response = await wazuhClient.asCurrentUser.transport.request({
      method: 'GET',
      path: contentManagerRoutes.subscription,
    });

    const body = response.body as ContentManagerSubscriptionGetResponse | null;
    const message = normalizeSubscriptionMessage(body?.message);
    const statusFromBody =
      typeof body?.status === 'number' ? body.status : undefined;
    const statusFromMeta = (response as { statusCode?: number }).statusCode;
    const statusFromResponse = statusFromBody ?? statusFromMeta ?? undefined;

    return {
      message,
      status:
        statusFromResponse !== undefined && Number.isFinite(statusFromResponse)
          ? statusFromResponse
          : null,
    };
  } catch {
    return { message: null, status: null };
  }
}
