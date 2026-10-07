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
 *
 * `transport.request` throws on any HTTP status >= 400. A `401` (token
 * rejected) never reaches here: the Content Manager already answers that
 * case with a `200` and a public plan. What does reach here is a `502`
 * (CTI Console unreachable; registration unchanged) or a lower-level
 * network/timeout failure, so the thrown status is preserved instead of
 * being discarded, letting callers tell "unknown" apart from "not
 * registered".
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
  } catch (error) {
    const statusCode = (error as { meta?: { statusCode?: number } })?.meta
      ?.statusCode;
    return {
      message: null,
      status: typeof statusCode === 'number' ? statusCode : null,
    };
  }
}
