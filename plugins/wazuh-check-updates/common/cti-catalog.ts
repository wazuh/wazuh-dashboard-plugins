/**
 * Shapes and rules shared by the threat intelligence catalog views (Indicators
 * and Vulnerabilities tabs of the CTI feed app) and the routes that serve them.
 */

/** Aliases, not physical indices: the live index flips between `-a` and `-b`. */
export const INDICATOR_CATALOG_INDEX = 'wazuh-threatintel-enrichments';
export const VULNERABILITY_CATALOG_INDEX = '.wazuh-threatintel-vulnerabilities';

/** Values of `document.type` in the indicator catalog. */
export const INDICATOR_TYPES = [
  'url_domain',
  'url_full',
  'connection',
  'hash_sha256',
  'hash_md5',
  'hash_sha1',
] as const;
export type IndicatorType = (typeof INDICATOR_TYPES)[number];

/** Values of `type` the vulnerability browser lists; the rest are metadata. */
export const VULNERABILITY_RECORD_TYPES = ['CVE', 'TID'] as const;
export type VulnerabilityRecordType =
  (typeof VULNERABILITY_RECORD_TYPES)[number];

export const CATALOG_PAGE_SIZE = 20;
/** Deepest `from` a browse may request, so a page cannot ask for an unbounded window. */
export const CATALOG_MAX_FROM = 1000;
export const CATALOG_MAX_PAGE = CATALOG_MAX_FROM / CATALOG_PAGE_SIZE;

/** Longest value the lookup accepts; the indexed keyword ignores longer ones. */
export const INDICATOR_LOOKUP_MAX_LENGTH = 4096;
/** Most records one lookup returns. */
export const INDICATOR_LOOKUP_MAX_HITS = 50;
/** Longest "starts with" text and filter value a browse accepts. */
export const CATALOG_FILTER_MAX_LENGTH = 256;

/**
 * A full vulnerability record id: `CVE-` + year + 4 to 7 digits, or `TID-` +
 * digits. Only a full id can find a record: the record body is not indexed.
 */
const VULNERABILITY_ID_RE = /^(CVE-\d{4}-\d{4,7}|TID-\d{1,10})$/i;

/** The id as stored (`_id` is upper case), or `null` when it is not a full id. */
export function normalizeVulnerabilityId(value: string): string | null {
  const trimmed = value.trim();
  return VULNERABILITY_ID_RE.test(trimmed) ? trimmed.toUpperCase() : null;
}

/** Only web links: anything else in third-party content is not linked. */
export function isWebUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

const BARE_IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const BARE_IPV6_RE = /^[0-9a-f:]+$/i;

function isBareIpAddress(value: string): boolean {
  return (
    BARE_IPV4_RE.test(value) ||
    (value.includes(':') && BARE_IPV6_RE.test(value))
  );
}

function getUrlHostname(value: string): string | null {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return null;
  }
  try {
    return new URL(value).hostname || null;
  } catch {
    return null;
  }
}

/** What one lookup value matches in `document.name`. */
export interface IndicatorLookupPlan {
  /** Values matched exactly, ignoring case. */
  exact: string[];
  /**
   * Anchored prefix for `ip:port` records, only for a bare IP address. Always
   * ends with `:`, so `124.70.213.4` never matches `124.70.213.43:1010`.
   */
  connectionPrefix?: string;
}

/**
 * The matches for a lookup value. Never a leading wildcard or an unanchored
 * prefix: either would report an unrelated record as a known indicator.
 */
export function planIndicatorLookup(value: string): IndicatorLookupPlan {
  const trimmed = value.trim();
  const exact = new Set<string>([trimmed]);

  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    exact.add(trimmed.slice(0, -1));
  }
  const hostname = getUrlHostname(trimmed);
  if (hostname) {
    exact.add(hostname);
  }

  return {
    exact: [...exact],
    ...(isBareIpAddress(trimmed) ? { connectionPrefix: `${trimmed}:` } : {}),
  };
}

/** One record of the indicator catalog. */
export interface CatalogIndicator {
  /** Catalog document id. */
  id: string;
  name: string;
  type?: string;
  provider?: string;
  feedName?: string;
  confidence?: number;
  firstSeen?: string;
  lastSeen?: string;
  software?: {
    name?: string;
    type?: string;
    alias: string[];
  };
  tags: string[];
  reference?: string;
  /** Provider's id for the record. */
  externalId?: string;
}

export interface CatalogBucket {
  key: string;
  count: number;
}

export interface CatalogHistogramBucket {
  /** Start of the month, epoch milliseconds. */
  date: number;
  count: number;
}

/** Served by `routes.ctiCatalogIndicatorsSummary`. */
export interface IndicatorCatalogSummary {
  total: number;
  firstSeenLast30Days: number;
  providers: number;
  families: number;
  averageConfidence: number | null;
  byType: CatalogBucket[];
  byProvider: CatalogBucket[];
  byRole: CatalogBucket[];
  topFamilies: CatalogBucket[];
  firstSeenByMonth: CatalogHistogramBucket[];
}

export interface IndicatorSearchRequest {
  page: number;
  type?: IndicatorType;
  prefix?: string;
  provider?: string;
  family?: string;
  /** `document.software.type`, such as `botnet_cc`. */
  role?: string;
}

export interface CatalogPage<T> {
  /** Every match, beyond the pages that can be browsed. */
  total: number;
  items: T[];
}

export interface CvssScore {
  score: number;
  version?: string;
  severity?: string;
  vector?: string;
  /** Who scored it: `cna` or an ADP provider short name. */
  source: string;
}

/** One record of the vulnerability catalog, as the browser lists it. */
export interface VulnerabilityRecordRow {
  id: string;
  type: string;
  offset?: number;
  state?: string;
  published?: string;
  updated?: string;
  assigner?: string;
  title?: string;
  /** The highest numeric base score in the record. */
  topScore?: CvssScore;
  /** Only for TID records: how a vendor/product pair is translated. */
  translationRule?: TranslationRule;
}

export interface AffectedProduct {
  vendor?: string;
  product?: string;
  platforms: string[];
  /** Readable version ranges, such as `2.0.1 to < 2.3.1`. */
  versions: string[];
  /** Who reported it: `cna` or an ADP provider short name. */
  source: string;
}

export interface TranslationRule {
  action: string[];
  sourceVendor?: string;
  sourceProduct?: string;
  target: string[];
  translation: Array<{ vendor?: string; product?: string }>;
}

/** Served by `routes.ctiCatalogVulnerabilityRecord`. */
export interface VulnerabilityRecordDetail extends VulnerabilityRecordRow {
  descriptions: Array<{ lang?: string; value: string }>;
  scores: CvssScore[];
  weaknesses: string[];
  affected: AffectedProduct[];
  references: Array<{ url: string; tags: string[] }>;
  /** The stored record, for the JSON view. */
  raw: unknown;
}

export type VulnerabilityRecordResponse =
  | { found: true; record: VulnerabilityRecordDetail }
  | { found: false; id: string };

/** Served by `routes.ctiCatalogVulnerabilitiesSummary`. */
export interface VulnerabilityCatalogSummary {
  total: number;
  byType: CatalogBucket[];
}

export interface VulnerabilitySearchRequest {
  page: number;
  type?: VulnerabilityRecordType;
}

/**
 * Error body of the catalog routes. `index` names the index the user could not
 * read, so the view can say which section failed.
 */
export interface CatalogErrorBody {
  message: string;
  attributes?: { index?: string; reason?: string };
}
