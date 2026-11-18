import { WAZUH_THREATINTEL_ENRICHMENTS_PATTERN } from '../constants';

/** Indicators of compromise delivered by the CTI feed. */
export const CTI_IOCS_PATTERN = WAZUH_THREATINTEL_ENRICHMENTS_PATTERN;

/**
 * CVE records and translation rules delivered by the CTI feed. The index is
 * hidden and maps only `type` and `offset`: `document` is stored, not indexed,
 * so a record can be read by its `_id` but its content cannot be searched.
 */
export const CTI_VULNERABILITIES_PATTERN =
  '.wazuh-threatintel-vulnerabilities*';

const CTI_EXPLORER_API = '/api/cti-explorer';

export const CTI_EXPLORER_ROUTES = {
  iocsSummary: `${CTI_EXPLORER_API}/iocs/summary`,
  iocsSearch: `${CTI_EXPLORER_API}/iocs/search`,
  iocRecord: `${CTI_EXPLORER_API}/iocs/record`,
  lookup: `${CTI_EXPLORER_API}/lookup`,
  vulnerabilitiesSummary: `${CTI_EXPLORER_API}/vulnerabilities/summary`,
  vulnerabilitiesSearch: `${CTI_EXPLORER_API}/vulnerabilities/search`,
  vulnerabilityRecord: `${CTI_EXPLORER_API}/vulnerabilities/record`,
} as const;

/** `index.max_result_window` of both indices: `from + size` cannot go past it. */
export const CTI_MAX_RESULT_WINDOW = 10000;
/**
 * Largest page a search route returns. The tables page by at most 100; the CSV
 * export reads 1,000 records per request, so 10 requests fill the result window.
 */
export const CTI_MAX_PAGE_SIZE = 1000;
export const CTI_DEFAULT_PAGE_SIZE = 25;

/** `document.name` is a keyword with `ignore_above: 4096`: a longer value is not indexed. */
export const CTI_LOOKUP_MAX_LENGTH = 4096;
/** Filter values are other keyword fields (provider, tag, family, …). */
export const CTI_FILTER_MAX_LENGTH = 1024;
/** Record ids: `CVE-YYYY-NNNN…` or `TID-NNNN`. */
export const CTI_RECORD_ID_MAX_LENGTH = 64;

/** Records returned for one looked-up value (one per provider and matched type). */
export const CTI_LOOKUP_MAX_RECORDS = 50;
/** Records with the same value as an opened record (one per provider). */
export const CTI_RELATED_MAX_RECORDS = 20;
/** Buckets of each IOC breakdown. */
export const CTI_BREAKDOWN_SIZE = 10;
/** Window of the "IOCs added" count, by `document.first_seen`. */
export const CTI_RECENT_DAYS = 30;

/** `document.type` values of the IOC catalog. */
export const IOC_TYPES = [
  'url_domain',
  'url_full',
  'connection',
  'hash_sha256',
  'hash_md5',
  'hash_sha1',
] as const;
export type IocType = (typeof IOC_TYPES)[number];

/**
 * URL param that opens the IOC list filtered to one type, from a link of another
 * page. The page applies it once and removes it from the URL.
 */
export const CTI_EXPLORER_IOC_TYPE_PARAM = 'iocType';

export const isIocType = (value: unknown): value is IocType =>
  IOC_TYPES.includes(value as IocType);

/** `document.software.name` of the records with no malware family. */
export const IOC_UNKNOWN_FAMILY = 'unknown';

/** `document.confidence` bands (0 to 100), as `range` aggregation keys. */
export const IOC_CONFIDENCE_BANDS = [
  { key: '100', from: 100 },
  { key: '75-99', from: 75, to: 100 },
  { key: '50-74', from: 50, to: 75 },
  { key: '0-49', to: 50 },
] as const;
export type IocConfidenceBand = (typeof IOC_CONFIDENCE_BANDS)[number]['key'];

export const IOC_SORT_FIELDS = [
  'document.first_seen',
  'document.last_seen',
  'document.confidence',
  'document.name',
] as const;
export type IocSortField = (typeof IOC_SORT_FIELDS)[number];

/**
 * Listed record types of the vulnerabilities index. The other types
 * (`FEED-GLOBAL`, `OSCPE-GLOBAL`, `CNA-MAPPING-GLOBAL`, `TCPE`, `TVENDORS`)
 * are single internal documents of the feed.
 */
export const VULNERABILITY_RECORD_TYPES = ['CVE', 'TID'] as const;
export type VulnerabilityRecordType =
  (typeof VULNERABILITY_RECORD_TYPES)[number];

/**
 * Sort fields of the vulnerability records: `offset` (the order the feed
 * delivered them in, the default) and the publication date of a CVE record,
 * where the index maps it as a date.
 */
export const VULNERABILITY_SORT_FIELDS = [
  'offset',
  'document.cveMetadata.datePublished',
] as const;
export type VulnerabilitySortField = (typeof VULNERABILITY_SORT_FIELDS)[number];

/**
 * Severity filter of the CVE records, by the CNA base scores: the CVSS v3.x and
 * v4.0 qualitative bands, as `query_string` ranges (`[` inclusive, `{` exclusive).
 * Low is 0.1 to 3.9, Medium 4.0 to 6.9, High 7.0 to 8.9 and Critical 9.0 to 10.0.
 */
export const CVE_SEVERITY_RANGES = {
  low: '{0 TO 4}',
  medium: '[4 TO 7}',
  high: '[7 TO 9}',
  critical: '[9 TO 10]',
} as const;
export type CveSeverityFilter = keyof typeof CVE_SEVERITY_RANGES;
export const CVE_SEVERITY_FILTERS = Object.keys(
  CVE_SEVERITY_RANGES,
) as CveSeverityFilter[];

/**
 * Base score of every CVSS object of the CNA container (`cvssV4_0`, `cvssV3_1`,
 * …): the index maps them as `half_float`, through a dynamic template on
 * `metrics.*`. An index without that mapping matches no severity.
 */
export const CVE_CNA_BASE_SCORE_FIELDS =
  'document.containers.cna.metrics.*.baseScore';
