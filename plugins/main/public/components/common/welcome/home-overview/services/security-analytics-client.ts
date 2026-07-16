/* eslint-disable camelcase */
import { getHttp } from '../../../../../kibana-services';
import { DATA_SOURCE_NOT_FOUND } from './types';

/**
 * The reusable Security Analytics count client, for Rules / Decoders /
 * Integrations / Detectors. Every route the Security Analytics dashboards
 * plugin registers replies with an `{ ok, response, error }` envelope via
 * `core.http`. Two distinct "capability absent" signals are both surfaced
 * as the same `data_source_not_found` shape a missing index pattern
 * already throws, so callers hide the dependent widget instead of showing
 * an error:
 * - An HTTP 404 — the OSD-level proxy route doesn't exist because the
 *   Security Analytics *dashboards* plugin isn't installed.
 * - An `ok: false` envelope whose `error` is OpenSearch's own
 *   `no handler found for uri [...] and method [...]` — the proxy route
 *   exists and forwarded the request, but the *cluster-side* native
 *   Security Analytics plugin doesn't implement that REST endpoint
 *   (confirmed live: the dashboards-side route and the cluster-side plugin
 *   are separate plugins that can be out of sync).
 * Any other `ok: false` is a genuine query failure.
 *
 * (The IOC catalog — IOCs tile, IOC-feed-by-type — used to be served from
 * here too, but that endpoint doesn't exist on this Wazuh backend
 * (confirmed live: OpenSearch itself returns "no handler found for uri").
 * IOC-feed-by-type now reads `wazuh.threat.enrichments.indicator.type` off
 * the same findings search as the IOC Match hero instead — see
 * `buildIocFeedByTypeAgg` in aggs.ts — and the IOCs tile was dropped.)
 */

const SECURITY_ANALYTICS_BASE = '../_plugins/_security_analytics';

export const SECURITY_ANALYTICS_ROUTES = {
  rulesSearch: `${SECURITY_ANALYTICS_BASE}/rules/_search`,
  decodersSearch: `${SECURITY_ANALYTICS_BASE}/decoders/_search`,
  integrationsSearch: `${SECURITY_ANALYTICS_BASE}/integrations/_search`,
  detectorsSearch: `${SECURITY_ANALYTICS_BASE}/detectors/_search`,
};

interface SecurityAnalyticsEnvelope<T> {
  ok?: boolean;
  error?: string;
  response?: T;
}

function isSecurityAnalyticsNotFound(error: unknown): boolean {
  const err = error as {
    response?: { status?: number };
    body?: { statusCode?: number };
    statusCode?: number;
  };
  return (
    err?.response?.status === 404 ||
    err?.body?.statusCode === 404 ||
    err?.statusCode === 404
  );
}

/** OpenSearch's own REST layer response when no handler is registered for a
 * URI/method — the cluster-side plugin doesn't implement this endpoint. */
function isUnhandledUri(errorMessage: string | undefined): boolean {
  return typeof errorMessage === 'string' && errorMessage.includes('no handler found for uri');
}

/** Throws if the envelope reports a capability-absent condition; otherwise
 * throws a genuine query-failure Error. Callers still need to check `ok`
 * themselves for the success path. */
function throwIfCapabilityAbsent(error: string | undefined): never {
  if (isUnhandledUri(error)) {
    throw { type: DATA_SOURCE_NOT_FOUND };
  }
  throw new Error(error ?? 'Security Analytics returned an error');
}

interface SecurityAnalyticsSearchRequest {
  route: string;
  /** Omit entirely for a route that misreads an explicit body as its ES
   * query (see the Integrations comment below). */
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

/**
 * POSTs a search to a Rules/Decoders/Integrations/Detectors `_search` route
 * via `core.http` and reads the resulting count. These four routes are
 * genuinely inconsistent (confirmed against the Security Analytics plugin
 * source, not guessed) — this function absorbs that:
 * - Decoders wraps its count as `response.total`, not `hits.total`.
 * - Rules passes the request body straight to the native OpenSearch
 *   Security Analytics REST API, so `size: 0` + `hits.total` works as-is.
 */
async function fetchSecurityAnalyticsSearchCount({
  route,
  body,
  query,
}: SecurityAnalyticsSearchRequest): Promise<number> {
  type SearchResponse = {
    hits?: { total?: number | { value?: number } };
    total?: number;
  };
  let envelope: SecurityAnalyticsEnvelope<SearchResponse>;
  try {
    envelope = (await getHttp().post(route, {
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(query ? { query } : {}),
    })) as SecurityAnalyticsEnvelope<SearchResponse>;
  } catch (error) {
    if (isSecurityAnalyticsNotFound(error)) {
      throw { type: DATA_SOURCE_NOT_FOUND };
    }
    throw error;
  }
  if (!envelope?.ok) {
    throwIfCapabilityAbsent(envelope?.error);
  }
  const hitsTotal = envelope.response?.hits?.total;
  return (
    (typeof hitsTotal === 'number' ? hitsTotal : hitsTotal?.value) ??
    envelope.response?.total ??
    0
  );
}

/** Rules tile — pre-packaged only (the documented default for the open
 * item; the combined pre-packaged + custom total needs a second call).
 * Verified live: this route requires an explicit `query` — a bare
 * `{ size: 0 }` throws `illegal_argument_exception: inner bool query
 * clause cannot be null` server-side. */
export async function fetchRulesCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.rulesSearch,
    body: { size: 0, query: { match_all: {} } },
    query: { prePackaged: true },
  });
}

export async function fetchDecodersCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.decodersSearch,
    body: { size: 0 },
  });
}

/** The Integrations route treats the whole request body as the ES query
 * itself (a pre-existing quirk in that route, not something we can fix) —
 * sending `{ size: 0 }` would be sent AS the query and fail; omitting the
 * body falls back to `match_all` server-side. The route also always
 * returns up to 10000 full documents regardless of what's sent, but
 * `hits.total` is still accurate. */
export async function fetchIntegrationsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.integrationsSearch,
  });
}

/** The Detectors route destructures `query` off the body and throws on a
 * null/undefined body, so an empty object is required; `size` is hardcoded
 * server-side regardless of what's sent, but `hits.total` is still
 * accurate. */
export async function fetchDetectorsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.detectorsSearch,
    body: {},
  });
}
