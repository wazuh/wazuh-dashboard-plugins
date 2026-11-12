/* eslint-disable camelcase -- CTI fields keep their API names */
import type { IScopedClusterClient } from 'opensearch-dashboards/server';
import type {
  CtiPlanSubscription,
  CtiSubscriptionEnvironment,
  CtiSubscriptionMessage,
  CtiSubscriptionSnapshot,
} from '../../../common/cti-registration-status-api';
import { contentManagerRoutes } from '../../../common/constants';

interface ContentManagerSubscriptionGetResponse {
  message?: {
    plan?: { name?: string; is_public?: boolean };
    is_registered?: boolean;
    environment?: unknown;
    subscriptions?: unknown;
  };
  status?: number;
}

const PLAN_SUBSCRIPTION_INTERVALS = ['month', 'year'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** A non-empty string, trimmed; anything else is dropped. */
function toText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  return text ? text : undefined;
}

/** An ISO 8601 date the browser can parse; anything else is dropped. */
function toDate(value: unknown): string | undefined {
  const text = toText(value);
  return text !== undefined && !Number.isNaN(Date.parse(text))
    ? text
    : undefined;
}

/** Like {@link toDate}, but keeps an explicit `null` (the date does not apply). */
function toNullableDate(value: unknown): string | null | undefined {
  return value === null ? null : toDate(value);
}

function normalizeEnvironment(
  raw: unknown,
): CtiSubscriptionEnvironment | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const environment: CtiSubscriptionEnvironment = {};
  const name = toText(raw.name);
  if (name) {
    environment.name = name;
  }
  const organizationName = isRecord(raw.organization)
    ? toText(raw.organization.name)
    : undefined;
  if (organizationName) {
    environment.organization = { name: organizationName };
  }
  const registeredAt = toDate(raw.registered_at);
  if (registeredAt) {
    environment.registered_at = registeredAt;
  }
  return Object.keys(environment).length > 0 ? environment : undefined;
}

function normalizePlanSubscription(
  raw: unknown,
): CtiPlanSubscription | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const plan = toText(raw.plan);
  if (!plan) {
    return undefined;
  }
  const subscription: CtiPlanSubscription = { plan };
  const interval = PLAN_SUBSCRIPTION_INTERVALS.find(
    value => value === raw.interval,
  );
  if (interval) {
    subscription.interval = interval;
  }
  const startedAt = toDate(raw.started_at);
  if (startedAt) {
    subscription.started_at = startedAt;
  }
  const renewsAt = toNullableDate(raw.renews_at);
  if (renewsAt !== undefined) {
    subscription.renews_at = renewsAt;
  }
  const expiresAt = toNullableDate(raw.expires_at);
  if (expiresAt !== undefined) {
    subscription.expires_at = expiresAt;
  }
  return subscription;
}

function normalizePlanSubscriptions(
  raw: unknown,
): CtiPlanSubscription[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw
    .map(normalizePlanSubscription)
    .filter((item): item is CtiPlanSubscription => item !== undefined);
}

/**
 * Copies the fields the browser renders from the Content Manager subscription message.
 * The `environments/me` fields (`environment`, `subscriptions`) are validated one by one:
 * an invalid value is dropped, never passed through, and no other field is copied.
 */
export function normalizeSubscriptionMessage(
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
  // Identity and dates describe a registration; never show them for an unregistered one.
  if (!message.is_registered) {
    return message;
  }
  const environment = normalizeEnvironment(raw.environment);
  if (environment) {
    message.environment = environment;
  }
  const subscriptions = normalizePlanSubscriptions(raw.subscriptions);
  if (subscriptions) {
    message.subscriptions = subscriptions;
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
