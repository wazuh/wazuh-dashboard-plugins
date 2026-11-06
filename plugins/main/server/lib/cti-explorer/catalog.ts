import {
  CTI_IOCS_PATTERN,
  CTI_MAX_RESULT_WINDOW,
  CTI_VULNERABILITIES_PATTERN,
  IOC_CONFIDENCE_BANDS,
} from '../../../common/cti-explorer/constants';
import type { LookupClassification } from '../../../common/cti-explorer/lookup';
import type {
  CtiBucket,
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
} from '../../../common/cti-explorer/types';
import {
  buildIocLookupBody,
  buildIocRecordBody,
  buildIocRelatedBody,
  buildIocSearchBody,
  buildIocSummaryBody,
  buildVulnerabilityExistsBody,
  buildVulnerabilityRecordBody,
  buildVulnerabilitySearchBody,
  buildVulnerabilitySummaryBody,
} from './queries';

/** The part of the OpenSearch client the catalog reads with. */
export interface CatalogSearchClient {
  search(params: {
    index: string;
    body: Record<string, unknown>;
  }): Promise<{ body: unknown }>;
}

interface SearchHit {
  _id?: string;
  _source?: {
    type?: unknown;
    offset?: unknown;
    document?: unknown;
  };
}

interface Aggregation {
  doc_count?: number;
  value?: number;
  buckets?: Array<{ key: string | number; doc_count?: number }>;
}

interface SearchResponse {
  hits?: { total?: number | { value?: number }; hits?: SearchHit[] };
  aggregations?: Record<string, Aggregation | undefined>;
}

/** What the OpenSearch client rejects with. */
interface OpenSearchFailure {
  message?: string;
  meta?: { statusCode?: number; body?: { error?: { reason?: string } } };
}

type DocumentFields = Record<string, unknown>;

const asRecord = (value: unknown): DocumentFields =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as DocumentFields)
    : {};

/** A failure the route answers with its status and a stable `code`. */
export class CtiExplorerError extends Error {
  constructor(
    readonly statusCode: number,
    readonly attributes: CtiExplorerErrorAttributes,
  ) {
    super(attributes.reason ?? attributes.code);
  }
}

const toCatalogError = (error: unknown, index: string): CtiExplorerError => {
  if (error instanceof CtiExplorerError) {
    return error;
  }
  const failure = (error ?? {}) as OpenSearchFailure;
  const statusCode = failure.meta?.statusCode ?? 500;
  const reason = failure.meta?.body?.error?.reason ?? failure.message;
  if (statusCode === 403) {
    return new CtiExplorerError(403, { code: 'forbidden', index, reason });
  }
  if (statusCode === 404) {
    return new CtiExplorerError(404, {
      code: 'index_not_found',
      index,
      reason,
    });
  }
  return new CtiExplorerError(statusCode >= 400 ? statusCode : 500, {
    code: 'search_failed',
    index,
    reason,
  });
};

const search = async (
  client: CatalogSearchClient,
  index: string,
  body: Record<string, unknown>,
): Promise<SearchResponse> => {
  try {
    const { body: response } = await client.search({ index, body });
    return (response ?? {}) as SearchResponse;
  } catch (error) {
    throw toCatalogError(error, index);
  }
};

/** `from + size` past `max_result_window` is rejected by the indexer. */
const assertWithinResultWindow = (
  page: number,
  pageSize: number,
  index: string,
) => {
  if ((page + 1) * pageSize > CTI_MAX_RESULT_WINDOW) {
    throw new CtiExplorerError(400, {
      code: 'result_window',
      index,
      reason: `Only the first ${CTI_MAX_RESULT_WINDOW} records can be paged through`,
    });
  }
};

const toTotal = (response: SearchResponse): number => {
  const total = response.hits?.total;
  return typeof total === 'number' ? total : total?.value ?? 0;
};

const toBuckets = (aggregation: Aggregation | undefined): CtiBucket[] =>
  (aggregation?.buckets ?? []).map(bucket => ({
    key: String(bucket.key),
    count: bucket.doc_count ?? 0,
  }));

const hitsOf = (response: SearchResponse): SearchHit[] =>
  response.hits?.hits ?? [];

const offsetOf = (hit: SearchHit): number | null =>
  typeof hit._source?.offset === 'number' ? hit._source.offset : null;

const stringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

const stringList = (value: unknown): string[] => {
  if (typeof value === 'string' && value) {
    return [value];
  }
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
};

export const toIocRecord = (hit: SearchHit): IocRecord => {
  const document = asRecord(hit._source?.document);
  const software =
    document.software && typeof document.software === 'object'
      ? asRecord(document.software)
      : null;
  return {
    id: String(hit._id ?? document.id ?? ''),
    name: String(document.name ?? ''),
    type: String(document.type ?? ''),
    provider: stringOrNull(document.provider),
    confidence:
      typeof document.confidence === 'number' ? document.confidence : null,
    firstSeen: stringOrNull(document.first_seen),
    lastSeen: stringOrNull(document.last_seen),
    reference: stringOrNull(document.reference),
    tags: stringList(document.tags),
    feedName: stringOrNull(asRecord(document.feed).name),
    software: software
      ? {
          name: stringOrNull(software.name),
          type: stringOrNull(software.type),
          alias: stringList(software.alias),
        }
      : null,
    offset: offsetOf(hit),
  };
};

export async function getIocSummary(
  client: CatalogSearchClient,
): Promise<IocSummaryResponse> {
  const response = await search(
    client,
    CTI_IOCS_PATTERN,
    buildIocSummaryBody(),
  );
  const aggregations = response.aggregations ?? {};
  return {
    total: toTotal(response),
    addedRecently: aggregations.recent?.doc_count ?? 0,
    providers: aggregations.providers?.value ?? 0,
    byType: toBuckets(aggregations.byType),
    byProvider: toBuckets(aggregations.byProvider),
    byRole: toBuckets(aggregations.byRole),
    byFamily: toBuckets(aggregations.byFamily),
    byTag: toBuckets(aggregations.byTag),
    // `range` buckets come lowest first; list them as the bands are defined.
    byConfidence: IOC_CONFIDENCE_BANDS.flatMap(band =>
      toBuckets(aggregations.byConfidence).filter(
        bucket => bucket.key === band.key,
      ),
    ),
  };
}

export async function searchIocs(
  client: CatalogSearchClient,
  request: IocSearchRequest,
): Promise<CtiSearchResponse<IocRecord>> {
  assertWithinResultWindow(request.page, request.pageSize, CTI_IOCS_PATTERN);
  const response = await search(
    client,
    CTI_IOCS_PATTERN,
    buildIocSearchBody(request),
  );
  return {
    total: toTotal(response),
    items: hitsOf(response).map(toIocRecord),
  };
}

export async function getIocRecord(
  client: CatalogSearchClient,
  id: string,
): Promise<IocRecordResponse> {
  const response = await search(
    client,
    CTI_IOCS_PATTERN,
    buildIocRecordBody(id),
  );
  const [hit] = hitsOf(response);
  if (!hit) {
    throw new CtiExplorerError(404, {
      code: 'not_found',
      index: CTI_IOCS_PATTERN,
    });
  }
  const record = toIocRecord(hit);
  const related = await search(
    client,
    CTI_IOCS_PATTERN,
    buildIocRelatedBody(record.name, record.id),
  );
  return {
    record,
    related: hitsOf(related).map(toIocRecord),
  };
}

export async function lookupValue(
  client: CatalogSearchClient,
  classification: Extract<
    LookupClassification,
    { kind: 'ioc' } | { kind: 'vulnerability' }
  >,
): Promise<LookupResponse> {
  if (classification.kind === 'vulnerability') {
    const response = await search(
      client,
      CTI_VULNERABILITIES_PATTERN,
      buildVulnerabilityExistsBody(classification.id),
    );
    return {
      kind: 'vulnerability',
      id: classification.id,
      found: hitsOf(response).length > 0,
    };
  }
  const response = await search(
    client,
    CTI_IOCS_PATTERN,
    buildIocLookupBody(classification),
  );
  return {
    kind: 'ioc',
    category: classification.category,
    records: hitsOf(response).map(toIocRecord),
  };
}

export async function getVulnerabilitySummary(
  client: CatalogSearchClient,
): Promise<VulnerabilitySummaryResponse> {
  const response = await search(
    client,
    CTI_VULNERABILITIES_PATTERN,
    buildVulnerabilitySummaryBody(),
  );
  return { byType: toBuckets(response.aggregations?.byType) };
}

const toVulnerabilityItem = (hit: SearchHit): VulnerabilityListItem => {
  const document = hit._source?.document;
  return {
    id: String(hit._id ?? ''),
    type: String(hit._source?.type ?? ''),
    offset: offsetOf(hit),
    document:
      document && typeof document === 'object' ? asRecord(document) : null,
  };
};

export async function searchVulnerabilities(
  client: CatalogSearchClient,
  request: VulnerabilitySearchRequest,
): Promise<CtiSearchResponse<VulnerabilityListItem>> {
  assertWithinResultWindow(
    request.page,
    request.pageSize,
    CTI_VULNERABILITIES_PATTERN,
  );
  const response = await search(
    client,
    CTI_VULNERABILITIES_PATTERN,
    buildVulnerabilitySearchBody(request),
  );
  return {
    total: toTotal(response),
    items: hitsOf(response).map(toVulnerabilityItem),
  };
}

export async function getVulnerabilityRecord(
  client: CatalogSearchClient,
  id: string,
): Promise<VulnerabilityRecordResponse> {
  const response = await search(
    client,
    CTI_VULNERABILITIES_PATTERN,
    buildVulnerabilityRecordBody(id),
  );
  const [hit] = hitsOf(response);
  if (!hit) {
    throw new CtiExplorerError(404, {
      code: 'not_found',
      index: CTI_VULNERABILITIES_PATTERN,
    });
  }
  return toVulnerabilityItem(hit);
}
