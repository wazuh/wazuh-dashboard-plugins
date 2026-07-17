/* eslint-disable camelcase */
import { getHttp } from '../../../../../kibana-services';
import { DATA_SOURCE_NOT_FOUND } from '../interfaces/data-group';

/**
 * Shared count client for Rules/Decoders/Integrations/Detectors. Every
 * Security Analytics dashboards-plugin route answers via core.http with an
 * { ok, response, error } envelope. Two distinct "capability absent" signals
 * both map to the same data_source_not_found a missing index pattern
 * throws, so callers hide the widget instead of showing an error:
 * - HTTP 404: dashboards-side plugin not installed, so the OSD proxy route
 *   doesn't exist.
 * - ok:false, error "no handler found for uri [...]": proxy route exists
 *   and forwarded the request, but the cluster-side native plugin doesn't
 *   implement that endpoint (verified live: these are separate plugins that
 *   can be out of sync).
 * Any other ok:false is a genuine query failure.
 *
 * IOC catalog (IOCs tile, IOC-feed-by-type) used to be served here too; that
 * endpoint doesn't exist on this backend, so IOC-feed-by-type now reads off
 * the shared findings search instead (buildIocFeedByTypeAgg in queries.ts).
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

/** OpenSearch's "no handler found for uri" response: cluster-side plugin doesn't implement this endpoint. */
function isUnhandledUri(errorMessage: string | undefined): boolean {
  return typeof errorMessage === 'string' && errorMessage.includes('no handler found for uri');
}

/**
 * Throws data_source_not_found if capability-absent, else a genuine
 * query-failure Error. Callers still check `ok` for the success path.
 */
function throwIfCapabilityAbsent(error: string | undefined): never {
  if (isUnhandledUri(error)) {
    throw { type: DATA_SOURCE_NOT_FOUND };
  }
  throw new Error(error ?? 'Security Analytics returned an error');
}

interface SecurityAnalyticsSearchRequest {
  route: string;
  /** Omit entirely for a route that misreads an explicit body as its ES query. */
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

/**
 * POSTs to a Rules/Decoders/Integrations/Detectors _search route via
 * core.http and reads the count. The four routes are genuinely inconsistent
 * (confirmed against the SA plugin source):
 * - Decoders: count is response.total, not hits.total.
 * - Rules: body goes straight to the native OpenSearch SA REST API, so
 *   size:0 + hits.total works as-is.
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

/**
 * Rules tile: pre-packaged only (combined pre-packaged+custom total needs a
 * second call). Verified live: needs an explicit query; a bare { size: 0 }
 * throws illegal_argument_exception: inner bool query clause cannot be null.
 */
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

export async function fetchIntegrationsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.integrationsSearch,
    body: { size: 0 },
  });
}

export async function fetchDetectorsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.detectorsSearch,
    body: { size: 0, query: { match_all: {} } },
  });
}
