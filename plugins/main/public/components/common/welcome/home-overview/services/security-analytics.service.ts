/* eslint-disable camelcase */
import { getHttp } from '../../../../../kibana-services';
import { ErrorDataSourceNotFound } from '../../../../../utils/errors';

/**
 * Count client for the Ruleset Management Rules/Decoders/Integrations/Detectors
 * `_search` routes. Each replies via `core.http` with an
 * `{ ok, response, error }` response.
 */

const SECURITY_ANALYTICS_BASE = '../_plugins/_security_analytics';

export const SECURITY_ANALYTICS_ROUTES = {
  rulesSearch: `${SECURITY_ANALYTICS_BASE}/rules/_search`,
  decodersSearch: `${SECURITY_ANALYTICS_BASE}/decoders/_search`,
  integrationsSearch: `${SECURITY_ANALYTICS_BASE}/integrations/_search`,
  detectorsSearch: `${SECURITY_ANALYTICS_BASE}/detectors/_search`,
  kvdbsSearch: `${SECURITY_ANALYTICS_BASE}/kvdbs/_search`,
  filtersSearch: `${SECURITY_ANALYTICS_BASE}/filters/_search`,
};

/**
 * Content documents live in a `space.name` (`standard` = pre-packaged, `custom`
 * = user-defined) and carry a `document.enabled` flag. Counts sum both spaces
 * and include only enabled entities.
 */
const CONTENT_SPACES = ['standard', 'custom'];
const ENABLED_ONLY = { term: { 'document.enabled': true } };
const SPACES_AND_ENABLED = {
  bool: { filter: [{ terms: { 'space.name': CONTENT_SPACES } }, ENABLED_ONLY] },
};

interface SecurityAnalyticsResponse<T> {
  ok?: boolean;
  error?: string;
  response?: T;
}

function isUnhandledUri(errorMessage: string | undefined): boolean {
  return (
    typeof errorMessage === 'string' &&
    errorMessage.includes('no handler found for uri')
  );
}

function throwIfCapabilityAbsent(error: string | undefined): never {
  if (isUnhandledUri(error)) {
    throw new ErrorDataSourceNotFound(
      error ?? 'Ruleset Management endpoint not found',
    );
  }
  throw new Error(error ?? 'Ruleset Management returned an error');
}

interface SecurityAnalyticsSearchRequest {
  route: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

/**
 * POSTs a `_search` to one of the SA routes and reads the total. Decoders
 * report the count as `response.total`; the others as `hits.total`.
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
  let envelope: SecurityAnalyticsResponse<SearchResponse>;
  try {
    envelope = (await getHttp().post(route, {
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(query ? { query } : {}),
    })) as SecurityAnalyticsResponse<SearchResponse>;
  } catch (error) {
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

export async function fetchRulesCount(): Promise<number> {
  const [standard, custom] = await Promise.all(
    [true, false].map(prePackaged =>
      fetchSecurityAnalyticsSearchCount({
        route: SECURITY_ANALYTICS_ROUTES.rulesSearch,
        body: { size: 0, query: ENABLED_ONLY },
        query: { prePackaged },
      }),
    ),
  );
  return standard + custom;
}

export async function fetchDecodersCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.decodersSearch,
    body: { size: 0, query: SPACES_AND_ENABLED },
  });
}

/**
 * The integrations route treats the whole body (minus `size`/`_source`) as the
 * ES query, so the filter goes at the top level, not under `query`.
 */
export async function fetchIntegrationsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.integrationsSearch,
    body: { size: 0, ...SPACES_AND_ENABLED },
  });
}

export async function fetchDetectorsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.detectorsSearch,
    body: { size: 0, query: { match_all: {} } },
  });
}

export async function fetchKvdbsCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.kvdbsSearch,
    body: { size: 0, query: SPACES_AND_ENABLED },
  });
}

export async function fetchFiltersCount(): Promise<number> {
  return fetchSecurityAnalyticsSearchCount({
    route: SECURITY_ANALYTICS_ROUTES.filtersSearch,
    body: { size: 0, query: SPACES_AND_ENABLED },
  });
}
