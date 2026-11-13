/* eslint-disable camelcase -- OpenSearch query DSL */
import { getHttp } from '../../../kibana-services';
import { CTI_EXPLORER_ROUTES } from '../../../../common/cti-explorer/constants';
import type {
  CtiExplorerErrorAttributes,
  CtiSearchResponse,
  IocRecord,
  IocRecordResponse,
  IocSearchRequest,
  IocSummaryResponse,
  LookupResponse,
  VulnerabilityListItem,
  VulnerabilityRecordResponse,
  VulnerabilitySearchRequest,
  VulnerabilitySummaryResponse,
} from '../../../../common/cti-explorer/types';
import {
  fetchSecurityAnalyticsSearchCount,
  SECURITY_ANALYTICS_ROUTES,
} from '../../common/welcome/home-overview/services/security-analytics.service';

/** A failed request, as the routes describe it. */
export interface CtiRequestError {
  statusCode: number | null;
  code: CtiExplorerErrorAttributes['code'] | 'unknown';
  index: string | null;
  reason: string | null;
}

/** What `core.http` rejects with: the route's error response is in `body`. */
interface HttpFetchFailure {
  message?: string;
  response?: { status?: number };
  body?: {
    statusCode?: number;
    message?: string;
    attributes?: Partial<CtiExplorerErrorAttributes>;
  };
}

export const toCtiRequestError = (error: unknown): CtiRequestError => {
  const failure = (error ?? {}) as HttpFetchFailure;
  const attributes = failure.body?.attributes ?? {};
  return {
    statusCode: failure.body?.statusCode ?? failure.response?.status ?? null,
    code: attributes.code ?? 'unknown',
    index: attributes.index ?? null,
    reason:
      attributes.reason ?? failure.body?.message ?? failure.message ?? null,
  };
};

const post = <T>(path: string, body: unknown): Promise<T> =>
  getHttp().post(path, { body: JSON.stringify(body) }) as Promise<T>;

export const fetchIocSummary = () =>
  getHttp().get(CTI_EXPLORER_ROUTES.iocsSummary) as Promise<IocSummaryResponse>;

export const searchIocs = (request: IocSearchRequest) =>
  post<CtiSearchResponse<IocRecord>>(CTI_EXPLORER_ROUTES.iocsSearch, request);

export const fetchIocRecord = (id: string) =>
  getHttp().get(
    `${CTI_EXPLORER_ROUTES.iocRecord}/${encodeURIComponent(id)}`,
  ) as Promise<IocRecordResponse>;

export const lookupValue = (value: string) =>
  post<LookupResponse>(CTI_EXPLORER_ROUTES.lookup, { value });

export const fetchVulnerabilitySummary = () =>
  getHttp().get(
    CTI_EXPLORER_ROUTES.vulnerabilitiesSummary,
  ) as Promise<VulnerabilitySummaryResponse>;

export const searchVulnerabilities = (request: VulnerabilitySearchRequest) =>
  post<CtiSearchResponse<VulnerabilityListItem>>(
    CTI_EXPLORER_ROUTES.vulnerabilitiesSearch,
    request,
  );

export const fetchVulnerabilityRecord = (id: string) =>
  getHttp().get(
    `${CTI_EXPLORER_ROUTES.vulnerabilityRecord}/${encodeURIComponent(id)}`,
  ) as Promise<VulnerabilityRecordResponse>;

export type DetectionContentKey =
  | 'rules'
  | 'decoders'
  | 'integrations'
  | 'kvdbs';

/** One count per content type; `null` when it could not be read. */
export type DetectionContentCounts = Record<DetectionContentKey, number | null>;

/**
 * The feed delivers its detection content to the `standard` space; what users
 * create lives in `custom` and is not counted. Same counts as the CTI feed page.
 */
const FEED_SPACE = { term: { 'space.name': 'standard' } };

export async function fetchDetectionContentCounts(): Promise<DetectionContentCounts> {
  const [rules, decoders, integrations, kvdbs] = await Promise.allSettled([
    // Rules take the space as the `prePackaged` flag instead of a query term.
    fetchSecurityAnalyticsSearchCount({
      route: SECURITY_ANALYTICS_ROUTES.rulesSearch,
      body: { size: 0, query: { match_all: {} } },
      query: { prePackaged: true },
    }),
    fetchSecurityAnalyticsSearchCount({
      route: SECURITY_ANALYTICS_ROUTES.decodersSearch,
      body: { size: 0, query: FEED_SPACE },
    }),
    // The integrations route takes the whole body (minus `size`) as the query.
    fetchSecurityAnalyticsSearchCount({
      route: SECURITY_ANALYTICS_ROUTES.integrationsSearch,
      body: { size: 0, ...FEED_SPACE },
    }),
    fetchSecurityAnalyticsSearchCount({
      route: SECURITY_ANALYTICS_ROUTES.kvdbsSearch,
      body: { size: 0, query: FEED_SPACE },
    }),
  ]);
  const settled = (result: PromiseSettledResult<number>) =>
    result.status === 'fulfilled' ? result.value : null;
  return {
    rules: settled(rules),
    decoders: settled(decoders),
    integrations: settled(integrations),
    kvdbs: settled(kvdbs),
  };
}
