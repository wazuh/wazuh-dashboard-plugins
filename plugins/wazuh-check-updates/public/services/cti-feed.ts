import { getCore } from '../plugin-services';
import { routes } from '../../common/constants';
import type { CtiConsumersResponse } from '../../common/cti-consumers';
import type { CtiFeedIndicatorsResponse } from '../../common/cti-feed';

/**
 * Ruleset Management (Security Analytics) `_search` routes, the same ones the
 * Home page counts with. Each replies `{ ok, response, error }`.
 */
const SECURITY_ANALYTICS_BASE = '/_plugins/_security_analytics';

const SECURITY_ANALYTICS_ROUTES = {
  rules: `${SECURITY_ANALYTICS_BASE}/rules/_search`,
  decoders: `${SECURITY_ANALYTICS_BASE}/decoders/_search`,
  integrations: `${SECURITY_ANALYTICS_BASE}/integrations/_search`,
  kvdbs: `${SECURITY_ANALYTICS_BASE}/kvdbs/_search`,
};

/**
 * Feed content lives in the `standard` space; the `custom` space holds what
 * users create, which the feed does not deliver.
 */
const FEED_SPACE = { term: { 'space.name': 'standard' } };

interface SecurityAnalyticsSearchResponse {
  ok?: boolean;
  error?: string;
  response?: {
    hits?: { total?: number | { value?: number } };
    total?: number;
  };
}

async function fetchSecurityAnalyticsCount(
  route: string,
  body: Record<string, unknown>,
  query?: Record<string, boolean>,
): Promise<number> {
  const envelope = await getCore().http.post<SecurityAnalyticsSearchResponse>(
    route,
    {
      body: JSON.stringify(body),
      ...(query ? { query } : {}),
    },
  );
  if (!envelope?.ok) {
    throw new Error(envelope?.error ?? 'Ruleset Management returned an error');
  }
  // Decoders report the count as `response.total`; the others as `hits.total`.
  const hitsTotal = envelope.response?.hits?.total;
  return (
    (typeof hitsTotal === 'number' ? hitsTotal : hitsTotal?.value) ??
    envelope.response?.total ??
    0
  );
}

export type FeedContentKey =
  | 'rules'
  | 'decoders'
  | 'integrations'
  | 'kvdbs'
  | 'iocs'
  | 'vulnerabilities';

/** One count per content type; `null` when it could not be read. */
export type FeedContentCounts = Record<FeedContentKey, number | null>;

const settledCount = (result: PromiseSettledResult<number>): number | null =>
  result.status === 'fulfilled' ? result.value : null;

/**
 * Counts the content the CTI feed delivered. Each count fails on its own, so a
 * missing plugin or privilege only blanks the tiles it affects.
 */
export async function fetchFeedContentCounts(): Promise<FeedContentCounts> {
  const indicators = getCore()
    .http.get<CtiFeedIndicatorsResponse>(routes.ctiFeedIndicators)
    .catch(() => null);

  const [rules, decoders, integrations, kvdbs] = await Promise.allSettled([
    // Rules take the space as the `prePackaged` flag instead of a query term.
    fetchSecurityAnalyticsCount(
      SECURITY_ANALYTICS_ROUTES.rules,
      // eslint-disable-next-line camelcase -- OpenSearch query DSL
      { size: 0, query: { match_all: {} } },
      { prePackaged: true },
    ),
    fetchSecurityAnalyticsCount(SECURITY_ANALYTICS_ROUTES.decoders, {
      size: 0,
      query: FEED_SPACE,
    }),
    // The integrations route treats the whole body (minus `size`/`_source`) as
    // the query, so the filter goes at the top level.
    fetchSecurityAnalyticsCount(SECURITY_ANALYTICS_ROUTES.integrations, {
      size: 0,
      ...FEED_SPACE,
    }),
    fetchSecurityAnalyticsCount(SECURITY_ANALYTICS_ROUTES.kvdbs, {
      size: 0,
      query: FEED_SPACE,
    }),
  ]);
  const indicatorCounts = await indicators;

  return {
    rules: settledCount(rules),
    decoders: settledCount(decoders),
    integrations: settledCount(integrations),
    kvdbs: settledCount(kvdbs),
    iocs: indicatorCounts?.iocs ?? null,
    vulnerabilities: indicatorCounts?.vulnerabilities ?? null,
  };
}

export function fetchCtiConsumers(): Promise<CtiConsumersResponse> {
  return getCore().http.get<CtiConsumersResponse>(routes.ctiConsumers);
}

/** Asks the indexer to sync the CTI content now; the sync runs asynchronously. */
export async function requestCtiContentUpdate(): Promise<void> {
  await getCore().http.post(routes.ctiFeedContentUpdate);
}
