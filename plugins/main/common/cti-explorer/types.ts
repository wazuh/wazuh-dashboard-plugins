import type {
  CveSeverityFilter,
  IocConfidenceBand,
  IocSortField,
  VulnerabilityRecordType,
  VulnerabilitySortField,
} from './constants';

export interface CtiBucket {
  key: string;
  count: number;
}

/** One record of `wazuh-threatintel-enrichments`, flattened from `document.*`. */
export interface IocRecord {
  /** `document.id`, the record id in the catalog. */
  id: string;
  name: string;
  type: string;
  provider: string | null;
  confidence: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  reference: string | null;
  tags: string[];
  /** `document.feed.name`: who published the record at the provider. */
  feedName: string | null;
  software: {
    name: string | null;
    type: string | null;
    alias: string[];
  } | null;
  offset: number | null;
}

export interface IocSummaryResponse {
  total: number;
  addedRecently: number;
  providers: number;
  byType: CtiBucket[];
  byProvider: CtiBucket[];
  byRole: CtiBucket[];
  byFamily: CtiBucket[];
  byTag: CtiBucket[];
  byConfidence: CtiBucket[];
}

export interface IocFilters {
  type?: string;
  provider?: string;
  /** `document.software.type` */
  role?: string;
  /** `document.software.name` */
  family?: string;
  tag?: string;
  confidence?: IocConfidenceBand;
  /** Only records first seen in the last `CTI_RECENT_DAYS` days. */
  recent?: boolean;
  /** Start of `document.name`, case-insensitive. */
  prefix?: string;
}

export interface IocSearchRequest {
  /** Zero-based. */
  page: number;
  pageSize: number;
  sortField: IocSortField;
  sortDirection: 'asc' | 'desc';
  filters: IocFilters;
}

export interface CtiSearchResponse<T> {
  /** Exact number of matching records. */
  total: number;
  items: T[];
}

export interface IocRecordResponse {
  record: IocRecord;
  /** Other records with the same value (other providers or types). */
  related: IocRecord[];
}

export type LookupResponse =
  | { kind: 'ioc'; category: IocLookupCategory; records: IocRecord[] }
  | {
      kind: 'vulnerability';
      id: string;
      found: boolean;
      /** The record, with the fields the lists show; `null` when not found. */
      record: VulnerabilityListItem | null;
    };

export type IocLookupCategory =
  | 'hash_md5'
  | 'hash_sha1'
  | 'hash_sha256'
  | 'ip'
  | 'host_port'
  | 'url'
  | 'domain'
  | 'other';

export interface VulnerabilitySummaryResponse {
  byType: CtiBucket[];
  /**
   * CVE records by the severity band of their highest CNA base score, a bucket
   * per `CVE_SEVERITY_FILTERS` key. Records without a CNA score are in none.
   */
  byHighestSeverity: CtiBucket[];
}

export interface VulnerabilitySearchRequest {
  type?: VulnerabilityRecordType;
  /** CVE records with a CNA base score in any of these bands. */
  severities?: CveSeverityFilter[];
  /** Only the record with this full id (`_id`, case-sensitive). */
  id?: string;
  /** Newest delivered first (`offset`, descending) when omitted. */
  sortField?: VulnerabilitySortField;
  sortDirection?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/** One listed row of the vulnerabilities index; `document` holds only the fields the list reads. */
export interface VulnerabilityListItem {
  id: string;
  type: string;
  offset: number | null;
  document: Record<string, unknown> | null;
}

export interface VulnerabilityRecordResponse {
  id: string;
  type: string;
  offset: number | null;
  /** The stored record, as the feed delivered it. */
  document: Record<string, unknown> | null;
}

/** Error body of the routes; `code` is stable so the browser can translate it. */
export interface CtiExplorerErrorAttributes {
  code:
    | 'forbidden'
    | 'index_not_found'
    | 'not_found'
    | 'result_window'
    | 'value_too_long'
    | 'search_failed';
  index: string;
  reason?: string;
}
