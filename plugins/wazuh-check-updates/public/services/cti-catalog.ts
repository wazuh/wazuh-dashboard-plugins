import { getCore } from '../plugin-services';
import { routes } from '../../common/constants';
import type {
  CatalogErrorBody,
  CatalogIndicator,
  CatalogPage,
  IndicatorCatalogSummary,
  IndicatorSearchRequest,
  VulnerabilityCatalogSummary,
  VulnerabilityRecordResponse,
  VulnerabilityRecordRow,
  VulnerabilitySearchRequest,
} from '../../common/cti-catalog';

/** Why a catalog request failed, as the view needs it to explain the failure. */
export interface CatalogRequestError {
  /** HTTP status; 403 means the user cannot read the index. */
  status?: number;
  /** The index the request read. */
  index?: string;
  message: string;
}

interface HttpFetchErrorLike {
  message?: string;
  response?: { status?: number };
  body?: Partial<CatalogErrorBody>;
}

export function toCatalogRequestError(error: unknown): CatalogRequestError {
  const { message, response, body } = (error ?? {}) as HttpFetchErrorLike;
  return {
    status: response?.status,
    index: body?.attributes?.index,
    message: body?.message || message || String(error),
  };
}

export function fetchIndicatorCatalogSummary(
  signal?: AbortSignal,
): Promise<IndicatorCatalogSummary> {
  return getCore().http.get<IndicatorCatalogSummary>(
    routes.ctiCatalogIndicatorsSummary,
    { signal },
  );
}

export function lookupIndicator(
  q: string,
  signal?: AbortSignal,
): Promise<CatalogPage<CatalogIndicator>> {
  return getCore().http.post<CatalogPage<CatalogIndicator>>(
    routes.ctiCatalogIndicatorsLookup,
    { body: JSON.stringify({ q }), signal },
  );
}

export function searchIndicators(
  request: IndicatorSearchRequest,
  signal?: AbortSignal,
): Promise<CatalogPage<CatalogIndicator>> {
  return getCore().http.post<CatalogPage<CatalogIndicator>>(
    routes.ctiCatalogIndicatorsSearch,
    { body: JSON.stringify(request), signal },
  );
}

export function fetchVulnerabilityCatalogSummary(
  signal?: AbortSignal,
): Promise<VulnerabilityCatalogSummary> {
  return getCore().http.get<VulnerabilityCatalogSummary>(
    routes.ctiCatalogVulnerabilitiesSummary,
    { signal },
  );
}

export function searchVulnerabilityRecords(
  request: VulnerabilitySearchRequest,
  signal?: AbortSignal,
): Promise<CatalogPage<VulnerabilityRecordRow>> {
  return getCore().http.post<CatalogPage<VulnerabilityRecordRow>>(
    routes.ctiCatalogVulnerabilitiesSearch,
    { body: JSON.stringify(request), signal },
  );
}

/** `id` must already be a full CVE or TID id. */
export function fetchVulnerabilityRecord(
  id: string,
  signal?: AbortSignal,
): Promise<VulnerabilityRecordResponse> {
  return getCore().http.get<VulnerabilityRecordResponse>(
    `${routes.ctiCatalogVulnerabilityRecord}/${encodeURIComponent(id)}`,
    { signal },
  );
}
